#!/usr/bin/env bash
set -euo pipefail

PKG_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "${PKG_ROOT}/../.." && pwd)"
CLUSTER=""
FORGE_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --cluster)
            CLUSTER="${2:?--cluster needs a name}"
            shift 2
            ;;
        *)
            FORGE_ARGS+=("$1")
            shift
            ;;
    esac
done

if [[ -z "${CLUSTER}" ]]; then
    echo "Pass --cluster mainnet, testnet, or anvil."
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
    echo "Set USDG in ${CLUSTER_FILE} before deploy."
    exit 1
fi

if [[ -z "${FACTORY_OWNER:-}" ]]; then
    echo "FACTORY_OWNER is unset."
    echo "Set FACTORY_OWNER to the approved factory multisig before deploy."
    exit 1
fi

if [[ -z "${TREASURY_OWNER:-}" ]]; then
    echo "TREASURY_OWNER is unset."
    echo "Set TREASURY_OWNER to the approved treasury multisig before deploy."
    exit 1
fi

if [[ -z "${FEE_RATE:-}" || -z "${FEE_DENOMINATOR:-}" ]]; then
    echo "FEE_RATE or FEE_DENOMINATOR is unset."
    echo "Pin both in the cluster file. Official values are 100 and 10000."
    exit 1
fi

CMD=(forge script script/Deploy.s.sol:Deploy)

HAS_RPC=0
if [[ ${#FORGE_ARGS[@]} -gt 0 ]]; then
    for arg in "${FORGE_ARGS[@]}"; do
        if [[ "${arg}" == "--rpc-url" ]]; then
            HAS_RPC=1
        fi
    done
fi

if [[ "${HAS_RPC}" -eq 0 && -n "${RPC_URL:-}" ]]; then
    CMD+=(--rpc-url "${RPC_URL}")
fi

if [[ ${#FORGE_ARGS[@]} -gt 0 ]]; then
    CMD+=("${FORGE_ARGS[@]}")
fi

cd "${PKG_ROOT}"
"${CMD[@]}"
