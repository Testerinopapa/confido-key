const AUTH_HEADER = "X-Api-Key";

export function validateApiKey(request: Request): boolean {
  const keys = process.env["API_KEYS"];
  if (!keys) return true; // no keys configured — open access
  const provided = request.headers.get(AUTH_HEADER);
  if (!provided) return false;
  return keys.split(",").map(k => k.trim()).includes(provided);
}

export function getDeviceId(request: Request): string | null {
  return request.headers.get("X-Device-Id");
}

export function authError() {
  return Response.json(
    { error: "Missing or invalid API key. Send X-Api-Key header." },
    { status: 401, headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
