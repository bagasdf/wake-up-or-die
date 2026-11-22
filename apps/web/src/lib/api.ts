export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | T | null;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String(body.message)
        : `Permintaan gagal (${response.status})`;
    throw new Error(message);
  }

  if (
    body &&
    typeof body === "object" &&
    "success" in body &&
    body.success === true
  ) {
    return (body as ApiEnvelope<T>).data as T;
  }

  return body as T;
}
