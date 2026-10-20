import { createRequire } from "node:module";

interface Statement {
  run(...values: (string | number)[]): unknown;
  get(): { total: number };
  iterate(): Iterable<{ payload: string }>;
}
interface Database { exec(sql: string): void; prepare(sql: string): Statement; close(): void }

/** SQLite nativo do Node >=22.13; arquivo temporário, nunca o banco de produção. */
export class CandidateSpool<T extends { itemId: string }> {
  private db: Database;
  private insert: Statement;
  private sealed = false;
  constructor(file: string) {
    // @types/node 20 não declara node:sqlite; o runner é Node 22, separado do Worker.
    const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as { DatabaseSync: new (file: string) => Database };
    this.db = new DatabaseSync(file);
    this.db.exec("PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF; PRAGMA cache_size=-4096; PRAGMA mmap_size=0; PRAGMA temp_store=FILE; CREATE TABLE candidates (item_id TEXT PRIMARY KEY, payload TEXT NOT NULL); BEGIN;");
    this.insert = this.db.prepare("INSERT INTO candidates(item_id,payload) VALUES (?,?) ON CONFLICT(item_id) DO UPDATE SET payload=excluded.payload");
  }
  add(item: T) {
    if (this.sealed) throw new Error("candidate_spool_already_sealed");
    this.insert.run(item.itemId, JSON.stringify(item));
  }
  seal() { if (!this.sealed) { this.db.exec("COMMIT"); this.sealed = true; } }
  get size() { return this.db.prepare("SELECT COUNT(*) AS total FROM candidates").get().total; }
  *items(): Iterable<T> {
    if (!this.sealed) throw new Error("candidate_spool_not_sealed");
    for (const row of this.db.prepare("SELECT payload FROM candidates ORDER BY rowid").iterate()) yield JSON.parse(row.payload) as T;
  }
  close() { this.db.close(); }
}
