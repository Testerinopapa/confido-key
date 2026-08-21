export function getDeviceId(request: Request): string | null {
  return request.headers.get("X-Device-Id");
}
