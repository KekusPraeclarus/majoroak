CREATE TABLE cursor (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  block INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE deals (
  escrow TEXT PRIMARY KEY,
  seller TEXT NOT NULL,
  base_token TEXT NOT NULL,
  quote_token TEXT NOT NULL,
  base_amount TEXT NOT NULL,
  quote_amount TEXT NOT NULL,
  allowed_payer TEXT NOT NULL,
  expiry INTEGER NOT NULL,
  fee_amount TEXT NOT NULL,
  state INTEGER NOT NULL,
  created_block INTEGER NOT NULL,
  created_tx TEXT NOT NULL,
  created_log_index INTEGER NOT NULL,
  payer TEXT,
  updated_block INTEGER NOT NULL
);

CREATE TABLE wallets (
  wallet TEXT NOT NULL,
  escrow TEXT NOT NULL,
  role TEXT NOT NULL,
  PRIMARY KEY (wallet, escrow, role)
);

CREATE TABLE processed_logs (
  log_id TEXT PRIMARY KEY,
  block INTEGER NOT NULL
);

CREATE INDEX deals_state ON deals (state);
CREATE INDEX deals_expiry ON deals (expiry);
CREATE INDEX wallets_wallet ON wallets (wallet);
