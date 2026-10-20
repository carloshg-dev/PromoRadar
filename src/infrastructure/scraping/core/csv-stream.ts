import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import csv from "csv-parser";

/** Detecta gzip pelos bytes, inclusive quando fetch já descompactou a resposta. */
export async function readCsvRows(source: Readable, visit: (row: Record<string, string>) => boolean | void | Promise<boolean | void>, options: { indexed?: boolean; required?: readonly string[] } = {}) {
  const iterator = source[Symbol.asyncIterator]();
  const prefix: Buffer[] = [];
  let length = 0;
  const release = async () => {
    try { await iterator.return?.(); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ABORT_ERR") throw error; }
  };
  try {
    while (length < 2) {
      const next = await iterator.next();
      if (next.done) break;
      const chunk = Buffer.isBuffer(next.value) ? next.value : Buffer.from(next.value as string);
      prefix.push(chunk); length += chunk.length;
    }
    const bytes = Buffer.concat(prefix);
    const compressed = bytes[0] === 0x1f && bytes[1] === 0x8b;
    const input = Readable.from((async function* () {
      try {
        for (const chunk of prefix) yield chunk;
        while (true) { const next = await iterator.next(); if (next.done) break; yield next.value; }
      } finally { await release(); }
    })(), { objectMode: false });
    let headerValid = Boolean(options.indexed);
    const parser = csv({ headers: options.indexed ? false : undefined, strict: !options.indexed,
      maxRowBytes: 1_048_576, mapHeaders: ({ header }: { header: string }) => header.trim().replace(/^\uFEFF/, "") });
    parser.on("headers", (headers: string[]) => { headerValid = (options.required ?? []).every((header) => headers.includes(header)); });
    let stopped = false;
    let consumerFailure: unknown;
    try {
      const consume = async (rows: AsyncIterable<Record<string, string>>) => {
        try {
          for await (const row of rows) {
            if (!headerValid) throw new Error("csv_required_headers_missing");
            if (await visit(row) === false) { stopped = true; break; }
          }
          if (!headerValid) throw new Error("csv_required_headers_missing");
        } catch (error) { consumerFailure = error; throw error; }
      };
      if (compressed) await pipeline(input, createGunzip(), parser, consume);
      else await pipeline(input, parser, consume);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (!stopped || !["ERR_STREAM_PREMATURE_CLOSE", "ABORT_ERR"].includes(code ?? "")) throw consumerFailure ?? error;
    }
  } finally { source.destroy(); await release(); }
}
