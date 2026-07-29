import "server-only";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

function safeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

export async function saveUploadedFile(file: File, subdir: string) {
  const dir = path.join(UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const storedName = `${crypto.randomUUID()}${safeExt(file.name)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, storedName), bytes);

  return { storedName, originalName: file.name };
}

export async function readUploadedFile(subdir: string, storedName: string) {
  const safeName = path.basename(storedName);
  const filePath = path.join(UPLOADS_ROOT, subdir, safeName);
  return readFile(filePath);
}
