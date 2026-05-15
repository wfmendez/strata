// Lightweight SIWE-style message format. We don't depend on the `siwe` lib
// because viem's verifyMessage handles signature verification cleanly.

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

// Permissive parser — we only need to extract the nonce and address back out.
export function parseSiweFields(message: string) {
  const addrLine = message.split("\n")[1]?.trim() ?? "";
  const nonceMatch = message.match(/^Nonce:\s*(\S+)/m);
  return {
    address: addrLine,
    nonce: nonceMatch?.[1] ?? "",
  };
}
