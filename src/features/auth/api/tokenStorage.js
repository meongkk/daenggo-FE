const TOKEN_STORAGE_KEY = 'daenggo.auth.tokens';
export const AUTH_EXPIRED_EVENT = 'daenggo:auth-expired';

export function saveTokens({
  tokenType,
  accessToken,
  accessTokenExpiresIn,
  refreshToken,
}) {
  const expiresInSeconds = Number(accessTokenExpiresIn);
  const accessTokenExpiresAt = Number.isFinite(expiresInSeconds)
    ? Date.now() + expiresInSeconds * 1000
    : null;

  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
    tokenType: tokenType || 'Bearer',
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
  }));
}

export function getStoredTokens() {
  const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);

  if (!storedTokens) {
    return null;
  }

  try {
    return JSON.parse(storedTokens);
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function hasStoredSession() {
  const tokens = getStoredTokens();
  return Boolean(tokens?.accessToken && tokens?.refreshToken);
}

export function notifyAuthExpired() {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}
