import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { serverDirectory } from './config.js';
import { HttpError } from './errors.js';

export const uploadDirectory = path.join(serverDirectory, 'uploads');

const signatures = {
  'image/jpeg': buffer => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': buffer => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/webp': buffer => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
  'application/pdf': buffer => buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-',
};

const extensions = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

export function validateUploadedFile(file, allowedTypes) {
  if (!allowedTypes.includes(file.mimetype) || !signatures[file.mimetype]?.(file.buffer)) {
    throw new HttpError(415, 'UNSUPPORTED_FILE_TYPE', 'Upload a valid JPG, PNG, WebP image, or PDF file.');
  }
}

export function saveUploadedFile(file) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
  const storedName = `${randomUUID()}${extensions[file.mimetype]}`;
  fs.writeFileSync(path.join(uploadDirectory, storedName), file.buffer, { flag: 'wx' });
  return storedName;
}

export function removeUploadedFile(storedName) {
  if (!storedName || path.basename(storedName) !== storedName) return;
  fs.rmSync(path.join(uploadDirectory, storedName), { force: true });
}