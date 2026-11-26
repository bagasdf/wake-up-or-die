const STORAGE_KEY = "wuod-quiz-recovery-token";

function createToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export function getOrCreateQuizRecoveryToken() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const token = createToken();
  window.localStorage.setItem(STORAGE_KEY, token);
  return token;
}

export function getQuizRecoveryToken() {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function clearQuizRecoveryToken() {
  window.localStorage.removeItem(STORAGE_KEY);
}
