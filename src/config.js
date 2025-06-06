import * as duckdb from '@duckdb/duckdb-wasm';

const duckdb_wasm_url = new URL('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm', import.meta.url).href;
const mvp_worker_url = new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js', import.meta.url).href;
const duckdb_wasm_eh_url = new URL('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm', import.meta.url).href;
const eh_worker_url = new URL('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js', import.meta.url).href;

const MANUAL_BUNDLES = {
  mvp: {
    mainModule: duckdb_wasm_url,
    mainWorker: mvp_worker_url,
  },
  eh: {
    mainModule: duckdb_wasm_eh_url,
    mainWorker: eh_worker_url,
  },
};

export async function loadDb() {
  // Select a bundle based on browser checks
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

  // Instantiate the asynchronus version of DuckDB-wasm
  const worker = new Worker(bundle.mainWorker);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  return db;
}