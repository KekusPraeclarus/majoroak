#!/usr/bin/env bash
set -euo pipefail

PKG_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "${PKG_ROOT}/../.." && pwd)"

CLUSTER=""
FACTORY_ADDRESS="${FACTORY_ADDRESS:-}"
TREASURY_ADDRESS="${TREASURY_ADDRESS:-}"
ESCROW_ADDRESS="${ESCROW_ADDRESS:-}"
CHECK_ONLY=0

usage() {
    echo "Pass --cluster mainnet or testnet."
    echo "Pass --factory and --treasury, or set FACTORY_ADDRESS and TREASURY_ADDRESS."
    echo "The script also reads broadcast/Deploy.s.sol/<chainId>/run-latest.json."
    echo "Optional: --escrow <address> and --check-only."
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cluster)
            CLUSTER="${2:?--cluster needs a name}"
            shift 2
            ;;
        --factory)
            FACTORY_ADDRESS="${2:?--factory needs an address}"
            shift 2
            ;;
        --treasury)
            TREASURY_ADDRESS="${2:?--treasury needs an address}"
            shift 2
            ;;
        --escrow)
            ESCROW_ADDRESS="${2:?--escrow needs an address}"
            shift 2
            ;;
        --check-only)
            CHECK_ONLY=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown flag $1."
            usage
            exit 1
            ;;
    esac
done

if [[ -z "${CLUSTER}" ]]; then
    usage
    exit 1
fi

CLUSTER_FILE="${PKG_ROOT}/script/clusters/${CLUSTER}.env"
if [[ ! -f "${CLUSTER_FILE}" ]]; then
    echo "Missing cluster file ${CLUSTER_FILE}."
    exit 1
fi

set -a
# shellcheck disable=SC1090
source "${CLUSTER_FILE}"
set +a

if [[ -z "${CHAIN_ID:-}" ]]; then
    echo "CHAIN_ID is unset in ${CLUSTER_FILE}."
    exit 1
fi

if [[ -z "${USDG:-}" ]]; then
    echo "USDG is unset for cluster ${CLUSTER}."
    echo "Set USDG in ${CLUSTER_FILE} before verify."
    exit 1
fi

if [[ -z "${FACTORY_OWNER:-}" ]]; then
    echo "FACTORY_OWNER is unset."
    echo "Set FACTORY_OWNER to the factory constructor owner."
    exit 1
fi

if [[ -z "${TREASURY_OWNER:-}" ]]; then
    echo "TREASURY_OWNER is unset."
    echo "Set TREASURY_OWNER to the treasury constructor owner."
    exit 1
fi

if [[ -z "${PAYOUT:-}" ]]; then
    echo "PAYOUT is unset."
    echo "Set PAYOUT to the FeeTreasury constructor payout."
    exit 1
fi

if [[ -z "${FEE_RATE:-}" || -z "${FEE_DENOMINATOR:-}" ]]; then
    echo "FEE_RATE or FEE_DENOMINATOR is unset."
    echo "Pin both in the cluster file. Official values are 100 and 10000."
    exit 1
fi

RPC_ARG="${RPC_URL:-}"
if [[ -z "${RPC_ARG}" ]]; then
    case "${CHAIN_ID}" in
        4663)
            RPC_ARG="robinhood_public"
            ;;
        46630)
            RPC_ARG="robinhood_testnet_public"
            ;;
        *)
            echo "Set RPC_URL for cluster ${CLUSTER}."
            exit 1
            ;;
    esac
fi

VERIFIER="blockscout"
VERIFIER_URL=""
EXPLORER=""
case "${CHAIN_ID}" in
    4663)
        VERIFIER_URL="https://robinhoodchain.blockscout.com/api/"
        EXPLORER="https://robinhoodchain.blockscout.com"
        ;;
    46630)
        VERIFIER_URL="https://explorer.testnet.chain.robinhood.com/api/"
        EXPLORER="https://explorer.testnet.chain.robinhood.com"
        ;;
    *)
        CHECK_ONLY=1
        ;;
esac

cd "${PKG_ROOT}"

BROADCAST_FILE="${PKG_ROOT}/broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json"

read_broadcast_address() {
    local name="$1"
    if [[ ! -f "${BROADCAST_FILE}" ]]; then
        return 0
    fi
    python3 - "$BROADCAST_FILE" "$name" <<'PY'
import json
import sys

path, name = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as handle:
    data = json.load(handle)
for tx in data.get("transactions", []):
    if tx.get("transactionType") == "CREATE" and tx.get("contractName") == name:
        print(tx.get("contractAddress", ""))
        break
PY
}

if [[ -z "${TREASURY_ADDRESS}" ]]; then
    TREASURY_ADDRESS="$(read_broadcast_address FeeTreasury)"
fi
if [[ -z "${FACTORY_ADDRESS}" ]]; then
    FACTORY_ADDRESS="$(read_broadcast_address EscrowFactory)"
fi

if [[ -z "${TREASURY_ADDRESS}" || -z "${FACTORY_ADDRESS}" ]]; then
    echo "Missing factory or treasury address."
    echo "Pass --factory and --treasury after the broadcast."
    exit 1
fi

normalize_addr() {
    local value
    value="$(printf '%s' "$1" | tr -d '[:space:]')"
    value="${value#0x}"
    value="$(printf '%s' "${value}" | tr '[:upper:]' '[:lower:]')"
    printf '0x%s\n' "${value}"
}

normalize_hex() {
    local value
    value="$(printf '%s' "$1" | tr -d '[:space:]')"
    value="${value#0x}"
    printf '%s' "${value}" | tr '[:upper:]' '[:lower:]'
}

require_addr() {
    local label="$1"
    local value
    value="$(normalize_addr "$2")"
    if [[ ! "${value}" =~ ^0x[0-9a-f]{40}$ ]]; then
        echo "${label} is not a 20-byte address: $2"
        exit 1
    fi
    printf '%s\n' "${value}"
}

assert_eq() {
    local label="$1"
    local expected
    local actual
    expected="$(printf '%s' "$2" | tr -d '[:space:]')"
    actual="$(printf '%s' "$3" | tr -d '[:space:]')"
    if [[ "${expected}" != "${actual}" ]]; then
        echo "${label} mismatch."
        echo " expected ${expected}"
        echo " actual   ${actual}"
        exit 1
    fi
}

FACTORY_ADDRESS="$(require_addr FACTORY_ADDRESS "${FACTORY_ADDRESS}")"
TREASURY_ADDRESS="$(require_addr TREASURY_ADDRESS "${TREASURY_ADDRESS}")"
FACTORY_OWNER="$(require_addr FACTORY_OWNER "${FACTORY_OWNER}")"
TREASURY_OWNER="$(require_addr TREASURY_OWNER "${TREASURY_OWNER}")"
PAYOUT="$(require_addr PAYOUT "${PAYOUT}")"
USDG="$(require_addr USDG "${USDG}")"
if [[ -n "${ESCROW_ADDRESS}" ]]; then
    ESCROW_ADDRESS="$(require_addr ESCROW_ADDRESS "${ESCROW_ADDRESS}")"
fi

echo "cluster=${CLUSTER}"
echo "chainId=${CHAIN_ID}"
echo "commit=$(git -C "${REPO_ROOT}" rev-parse HEAD)"
echo "compiler=solc 0.8.36 cancun optimizer_runs=200 via_ir=true"
echo "treasury=${TREASURY_ADDRESS}"
echo "factory=${FACTORY_ADDRESS}"

RPC_CHAIN="$(cast chain-id --rpc-url "${RPC_ARG}")"
assert_eq "chain id" "${CHAIN_ID}" "${RPC_CHAIN}"

ON_FACTORY_OWNER="$(normalize_addr "$(cast call "${FACTORY_ADDRESS}" "owner()(address)" --rpc-url "${RPC_ARG}")")"
ON_TREASURY_OWNER="$(normalize_addr "$(cast call "${TREASURY_ADDRESS}" "owner()(address)" --rpc-url "${RPC_ARG}")")"
ON_PAYOUT="$(normalize_addr "$(cast call "${TREASURY_ADDRESS}" "payout()(address)" --rpc-url "${RPC_ARG}")")"
ON_FACTORY_USDG="$(normalize_addr "$(cast call "${FACTORY_ADDRESS}" "usdg()(address)" --rpc-url "${RPC_ARG}")")"
ON_TREASURY_USDG="$(normalize_addr "$(cast call "${TREASURY_ADDRESS}" "usdg()(address)" --rpc-url "${RPC_ARG}")")"
ON_FEE_TREASURY="$(normalize_addr "$(cast call "${FACTORY_ADDRESS}" "feeTreasury()(address)" --rpc-url "${RPC_ARG}")")"
ON_FEE_RATE="$(cast call "${FACTORY_ADDRESS}" "feeRate()(uint256)" --rpc-url "${RPC_ARG}" | awk '{print $1}')"
ON_FEE_DEN="$(cast call "${FACTORY_ADDRESS}" "feeDenominator()(uint256)" --rpc-url "${RPC_ARG}" | awk '{print $1}')"

assert_eq "factory owner" "${FACTORY_OWNER}" "${ON_FACTORY_OWNER}"
assert_eq "treasury owner" "${TREASURY_OWNER}" "${ON_TREASURY_OWNER}"
assert_eq "payout" "${PAYOUT}" "${ON_PAYOUT}"
assert_eq "factory usdg" "${USDG}" "${ON_FACTORY_USDG}"
assert_eq "treasury usdg" "${USDG}" "${ON_TREASURY_USDG}"
assert_eq "factory feeTreasury" "${TREASURY_ADDRESS}" "${ON_FEE_TREASURY}"
assert_eq "fee rate" "${FEE_RATE}" "${ON_FEE_RATE}"
assert_eq "fee denominator" "${FEE_DENOMINATOR}" "${ON_FEE_DEN}"

assert_bytecode() {
    local label="$1"
    local contract="$2"
    local address="$3"
    local artifact
    local local_code
    local onchain_code
    artifact="${PKG_ROOT}/out/${contract#*:}.sol/${contract#*:}.json"
    local_code="$(normalize_hex "$(forge inspect "${contract}" deployedBytecode)")"
    onchain_code="$(normalize_hex "$(cast code "${address}" --rpc-url "${RPC_ARG}")")"
    if [[ -z "${onchain_code}" ]]; then
        echo "${label} has no code at ${address}."
        exit 1
    fi
    if ! python3 - "${artifact}" "${local_code}" "${onchain_code}" <<'PY'
import json
import sys

artifact, local_hex, chain_hex = sys.argv[1], sys.argv[2], sys.argv[3]
with open(artifact, encoding="utf-8") as handle:
    refs = json.load(handle).get("deployedBytecode", {}).get("immutableReferences", {})

def mask(hexs):
    data = bytearray.fromhex(hexs)
    for ranges in refs.values():
        for item in ranges:
            start = item["start"]
            length = item["length"]
            data[start:start + length] = bytes(length)
    marker = bytes.fromhex("a26469706673")
    idx = data.find(marker)
    if idx >= 0:
        data = data[:idx]
    return bytes(data)

if mask(local_hex) != mask(chain_hex):
    raise SystemExit(1)
PY
    then
        echo "${label} runtime bytecode does not match this git tree."
        echo " address ${address}"
        echo " Use the exact commit that produced the deploy."
        exit 1
    fi
    echo "${label} bytecode matches."
}

assert_bytecode FeeTreasury "src/FeeTreasury.sol:FeeTreasury" "${TREASURY_ADDRESS}"
assert_bytecode EscrowFactory "src/EscrowFactory.sol:EscrowFactory" "${FACTORY_ADDRESS}"
if [[ -n "${ESCROW_ADDRESS}" ]]; then
    assert_bytecode Escrow "src/Escrow.sol:Escrow" "${ESCROW_ADDRESS}"
fi

if [[ -f "${BROADCAST_FILE}" ]]; then
    DEPLOY_BLOCK="$(
        python3 - "$BROADCAST_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    data = json.load(handle)
receipts = data.get("receipts", [])
if not receipts:
    raise SystemExit
raw = receipts[0].get("blockNumber", 0)
if isinstance(raw, str):
    print(int(raw, 0))
else:
    print(int(raw))
PY
    )"
    if [[ -n "${DEPLOY_BLOCK}" && "${DEPLOY_BLOCK}" != "0" ]]; then
        echo "deployBlock=${DEPLOY_BLOCK}"
    fi
fi

if [[ "${CHECK_ONLY}" -eq 1 ]]; then
    echo "check-only: pins and bytecode match. Explorer submit skipped."
    exit 0
fi

if [[ -z "${VERIFIER_URL}" ]]; then
    echo "No Blockscout verifier for chain ${CHAIN_ID}."
    exit 1
fi

TREASURY_ARGS="$(cast abi-encode "constructor(address,address,address)" \
    "${TREASURY_OWNER}" "${PAYOUT}" "${USDG}")"
FACTORY_ARGS="$(cast abi-encode "constructor(address,uint256,uint256,address,address)" \
    "${FACTORY_OWNER}" "${FEE_RATE}" "${FEE_DENOMINATOR}" "${TREASURY_ADDRESS}" "${USDG}")"

submit() {
    local address="$1"
    local contract="$2"
    shift 2
    forge verify-contract \
        --root "${PKG_ROOT}" \
        --chain "${CHAIN_ID}" \
        --rpc-url "${RPC_ARG}" \
        --verifier "${VERIFIER}" \
        --verifier-url "${VERIFIER_URL}" \
        --etherscan-api-key empty \
        --via-ir \
        --optimizer-runs 200 \
        --skip-is-verified-check \
        --watch \
        "${address}" \
        "${contract}" \
        "$@"
}

echo "submit treasury to ${VERIFIER_URL}"
submit "${TREASURY_ADDRESS}" "src/FeeTreasury.sol:FeeTreasury" --constructor-args "${TREASURY_ARGS}"
echo "submit factory to ${VERIFIER_URL}"
submit "${FACTORY_ADDRESS}" "src/EscrowFactory.sol:EscrowFactory" --constructor-args "${FACTORY_ARGS}"

if [[ -n "${ESCROW_ADDRESS}" ]]; then
    echo "submit escrow to ${VERIFIER_URL}"
    submit "${ESCROW_ADDRESS}" "src/Escrow.sol:Escrow" --guess-constructor-args
fi

echo "FeeTreasury ${EXPLORER}/address/${TREASURY_ADDRESS}"
echo "EscrowFactory ${EXPLORER}/address/${FACTORY_ADDRESS}"
if [[ -n "${ESCROW_ADDRESS}" ]]; then
    echo "Escrow ${EXPLORER}/address/${ESCROW_ADDRESS}"
fi
echo "verify=passed"
