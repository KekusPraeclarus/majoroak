# MajorOak Settlements

On-chain escrow for over-the-counter ERC-20 deals on Robinhood Chain.

The repository is a pnpm workspace.

OTC protocol contracts live in `packages/otc`.

That package has a pinned Foundry toolchain.

`packages/otc/src/` holds EscrowFactory, Escrow, and FeeTreasury.

## Pinned versions

| Tool | Version | Reason |
| --- | --- | --- |
| Foundry | v1.7.1 | Latest Foundry release on 2026-08-13. Includes invariant options from v1.7.0. |
| solc | 0.8.36 | Latest Solidity release. Includes inheritance-order and Yul optimizer fixes. |
| forge-std | v1.16.1 | Matches Foundry v1.7.1. Avoids later Vm interface drift. |
| OpenZeppelin Contracts | v5.6.1 | Latest audited npm `latest` tag. Do not use v5.7.0-rc. |
| EVM | cancun | Matches ArbOS 61-era Cancun opcodes. Do not select Amsterdam. |

Install Foundry with:

```text
foundryup --install v1.7.1
```

Confirm `forge --version` prints `1.7.1`.

## Layout

```text
packages/otc/src/            EscrowFactory, Escrow, and FeeTreasury.
packages/otc/script/         Deploy and verify scripts. Constructor args come from the environment.
packages/otc/lib/            Pinned git submodules.
packages/otc/docs/           OTC protocol docs, stories, and invariants.
packages/frontend/           Vite and React UI.
packages/frontend/docs/      Frontend context map.
packages/indexer/            Cloudflare Worker and D1 deal index.
packages/indexer/docs/       Indexer runbook.
docs/                        Workspace architecture, shared knowledge, and brand.
assurance/                   Packets, Gherkin, audit pack, and ops records.
script/                      Root wrappers for Constitution gates.
```

Do not run `forge update`.

That command can move submodules to `master`.

## Next

Set factory `FEE_RATE` and `FEE_DENOMINATOR` at deploy.

Run `script/deploy.sh --cluster mainnet` for mainnet USDG.

Run `script/verify.sh --cluster mainnet` after that broadcast.

Pin testnet USDG in `packages/otc/script/clusters/testnet.env` when that phase starts.

Read `docs/README.md` before a workspace or brand edit.

Read `packages/otc/docs/README.md` before an OTC edit.

Run the UI with `pnpm install` then `pnpm dev`.

Set `VITE_FACTORY_ADDRESS` in `packages/frontend/.env.local` after factory deploy.

Run `pnpm test:anvil` for a local Robinhood mainnet fork, contract deploy, indexer, and UI server.

## Test

Angle tests are the unit layer. Do not add `test/unit/`.

```text
script/smoke.sh lite
script/invariants.sh
script/mutation.sh full
script/assurance.sh pr
```

Nightly adds deep smoke, long invariants, Halmos, Echidna, Medusa, Gambit mutation, coverage, and SBOM.

```text
script/assurance.sh nightly
```

## License

This repository uses Business Source License 1.1.

The Change Date is 25 August 2030.

The Change License is MIT.

Read `LICENSE`.
