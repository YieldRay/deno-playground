import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import process from "node:process";
import child_process from "node:child_process";
import { Buffer } from "node:buffer";
import { createWriteStream } from "node:fs";
import { pipeline, Readable } from "node:stream";
import { ReadableStream } from "node:stream/web";

const TIMEOUT = 180_000;
const SUPPORTS_TS = process.features.require_module;

const encodeBase64 = (u8a: ArrayBuffer) => Buffer.from(u8a).toString("base64");
const encode = new TextEncoder().encode.bind(new TextEncoder());

export async function handler(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    "Transfer-Encoding": "chunked",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": !origin || origin === "null" ? "*" : origin,
  });

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: string) => controller.enqueue(encode(`event: ${event}\ndata: ${data}\n\n`));
      const stdout = (buffer: ArrayBuffer) => send("stdout", encodeBase64(buffer));
      const stderr = (buffer: ArrayBuffer) => send("stderr", encodeBase64(buffer));

      const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "node_playground_"));
      const filepath = path.join(cwd, SUPPORTS_TS ? "index.ts" : "index.js");

      try {
        await new Promise<void>((resolve, reject) => {
          pipeline(Readable.fromWeb(request.body as ReadableStream), createWriteStream(filepath), (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        send("ready", "");
      } catch (error) {
        send("error", String(error));
        controller.close();
        return;
      }

      const currentBinary = process.execPath || "node";
      const flags = [filepath];
      if (SUPPORTS_TS) flags.unshift("--experimental-transform-types");
      const child = child_process.spawn(currentBinary, flags, {
        cwd,
        timeout: TIMEOUT,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          // https://nodejs.org/docs/latest/api/cli.html#environment-variables_1
          NODE_TLS_REJECT_UNAUTHORIZED: "0",
          FORCE_COLOR: "1",
          DO_NOT_TRACK: "1",
        },
        killSignal: "SIGKILL",
      });

      child.stdout.on("data", stdout);
      child.stderr.on("data", stderr);

      const exitCode = await new Promise<number | null>((resolve, reject) => {
        child.on("exit", (code) => resolve(code));
        child.on("error", reject);
      });

      send("exit", String(exitCode));
    },
  });
  return new Response(body as globalThis.ReadableStream, { headers });
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (Deno) Deno.serve(handler);
