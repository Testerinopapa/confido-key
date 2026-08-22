export function getDeviceId(request: Request): string | null {
  return request.headers.get("X-Device-Id");
}

export class DeviceNotClaimedError extends Error {}

export async function getDeviceOwner(deviceId: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("extension_devices")
    .select("user_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.user_id ?? null;
}

export async function requireDeviceOwner(deviceId: string): Promise<string> {
  const userId = await getDeviceOwner(deviceId);
  if (!userId) throw new DeviceNotClaimedError("Extension device is not linked to an account");
  return userId;
}

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const authorization = request.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user?.id ?? null;
}
