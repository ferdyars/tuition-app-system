const blacklist = new Set<string>();

export function blacklistToken(token: string): void {
  blacklist.add(token);
}

export function isTokenBlacklisted(token: string): boolean {
  return blacklist.has(token);
}
