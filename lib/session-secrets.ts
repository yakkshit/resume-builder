let vercelOidcToken = "";

export function setVercelOidcToken(next: string) {
  vercelOidcToken = next;
}

export function getVercelOidcToken(): string {
  return vercelOidcToken;
}

