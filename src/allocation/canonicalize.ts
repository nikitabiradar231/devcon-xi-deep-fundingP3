import { keccak256, toUtf8Bytes } from 'ethers';

export function canonicalizeJson(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return JSON.stringify(obj);
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }

  if (typeof obj === 'bigint') {
    return JSON.stringify(obj.toString());
  }

  if (Array.isArray(obj)) {
    const elements = obj.map(item => canonicalizeJson(item));
    return `[${elements.join(',')}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const entries = keys.map(k => `${JSON.stringify(k)}:${canonicalizeJson((obj as Record<string, unknown>)[k])}`);
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(obj);
}

export function hashUtf8(text: string): string {
  return keccak256(toUtf8Bytes(text));
}

export function hashCanonicalObject(obj: unknown): string {
  const canonical = canonicalizeJson(obj);
  return keccak256(toUtf8Bytes(canonical));
}

export function hashPackageId(packageId: string): string {
  return keccak256(toUtf8Bytes(packageId));
}

export function hashAlgorithmVersion(version: string): string {
  return keccak256(toUtf8Bytes(version));
}
