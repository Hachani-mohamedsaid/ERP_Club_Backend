export function isApiFootballQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  return /429|request limit|quota|rate limit|too many requests|limite/i.test(msg);
}

export class ApiFootballQuotaError extends Error {
  constructor(message = 'API-Sports quota atteint') {
    super(message);
    this.name = 'ApiFootballQuotaError';
  }
}
