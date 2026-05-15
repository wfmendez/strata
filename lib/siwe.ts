// Lightweight SIWE-style message format. viem.verifyMessage handles the
// signature verification; this module handles the message contract.

const FRESHNESS_MS = 5 * 60_000; // 5 minutes

export function buildSiweMessage({
  address,
  nonce,
  domain,
  uri,
}: {
  address: string;
  nonce: string;
  domain: string;
  uri: string;
}) {
  const issuedAt = new Date().toISOString();
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Welcome to STRATA. Sign this message to prove ownership.",
    "",
    `URI: ${uri}`,
    `Version: 1`,
    `Chain ID: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

export type SiweFields = {
  domain: string | null;
  address: string;
  uri: string | null;
  nonce: string;
  issuedAt: string | null;
};

export function parseSiweFields(message: string): SiweFields {
  const lines = message.split("\n");
  const domainMatch = lines[0]?.match(/^(.+) wants you to sign in/);
  const domain = domainMatch?.[1] ?? null;
  const address = lines[1]?.trim() ?? "";

  const grab = (re: RegExp) => message.match(re)?.[1] ?? null;
  return {
    domain,
    address,
    uri: grab(/^URI:\s*(.+)$/m),
    nonce: grab(/^Nonce:\s*(\S+)/m) ?? "",
    issuedAt: grab(/^Issued At:\s*(.+)$/m),
  };
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateSiweMessage(
  fields: SiweFields,
  expected: { host: string; origin: string; nonce: string; now?: number },
): ValidationResult {
  if (!fields.address || !/^0x[0-9a-fA-F]{40}$/.test(fields.address))
    return { ok: false, reason: "invalid address" };
  if (!fields.domain || fields.domain !== expected.host)
    return { ok: false, reason: "domain mismatch" };
  if (!fields.uri) return { ok: false, reason: "missing URI" };
  try {
    if (new URL(fields.uri).origin !== expected.origin)
      return { ok: false, reason: "uri mismatch" };
  } catch {
    return { ok: false, reason: "malformed uri" };
  }
  if (!fields.nonce || fields.nonce !== expected.nonce)
    return { ok: false, reason: "nonce mismatch" };
  if (!fields.issuedAt) return { ok: false, reason: "missing issued at" };
  const issued = Date.parse(fields.issuedAt);
  if (Number.isNaN(issued)) return { ok: false, reason: "malformed issued at" };
  const now = expected.now ?? Date.now();
  if (Math.abs(now - issued) > FRESHNESS_MS)
    return { ok: false, reason: "message too old" };
  return { ok: true };
}
