// Fail-safe shape normalizer for API responses
export function extractUserId(userJson: any): string | undefined {
  return (
    userJson?.id ??
    userJson?.userId ??
    userJson?.user?.id ??
    userJson?.data?.id ??
    undefined
  );
}

export function extractSessionId(sessionJson: any): string | undefined {
  return (
    sessionJson?.id ??
    sessionJson?.sessionId ??
    sessionJson?.session?.id ??
    sessionJson?.data?.id ??
    undefined
  );
}

// Convert string IDs to numbers for backward compatibility
export function toNumericId(id: string | number | undefined): number {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    const numeric = parseInt(id.replace(/\D/g, ''), 10);
    return isNaN(numeric) ? Date.now() : numeric;
  }
  return Date.now();
}
