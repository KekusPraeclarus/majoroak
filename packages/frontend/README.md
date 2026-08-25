# @majoroak/frontend

Vite and React UI for MajorOak Settlements on Robinhood Chain.

Read [docs/README.md](docs/README.md) before you change this package.

## Run

Copy `.env.example` to `.env.local`.

Set `VITE_FACTORY_ADDRESS` after factory deploy.

From the repository root:

```text
pnpm install
pnpm dev
```

Run `pnpm test:anvil` for a local Robinhood mainnet fork, contract deploy, indexer, and UI server.

Build with `pnpm build:frontend`.

`dev` and `build` first write brand rasters into `public/`. Run `pnpm --filter @majoroak/frontend rasters` on its own if you only need those files.
