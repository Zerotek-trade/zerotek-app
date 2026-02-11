let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getStoredAccessToken(): string | null {
  return accessToken;
}
