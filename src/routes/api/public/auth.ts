const AUTH_HEADER = "X-Api-Key";

/** Checks the global API_KEYS env var — used by /claude and /gemini proxy routes. */
export function validateApiKey(request: Request): boolean {
  const keys = process.env["API_KEYS"];
  if (!keys) return true;
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

/** Resolves a user-scoped API key from the api_keys table.
 *  Falls back to device_id for unauthenticated requests.
 *  Returns null for invalid keys (caller should return 401). */
export async function resolveAuth(request: Request): Promise<{ user_id: string | null; device_id: string } | null> {
  const provided = request.headers.get(AUTH_HEADER);
  const deviceId = getDeviceId(request) || "unknown";

  if (!provided) {
    // No key — still allowed, data tied to device_id only
    return { user_id: null, device_id: deviceId };
  }

  // First check global API_KEYS (backward compat)
  const globalKeys = process.env["API_KEYS"];
  if (globalKeys && globalKeys.split(",").map(k => k.trim()).includes(provided)) {
    return { user_id: null, device_id: deviceId };
  }

  // Then check user-scoped api_keys table
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("api_keys")
      .select("id, user_id")
      .eq("key", provided)
      .maybeSingle();

    if (data) {
      // Touch last_used_at (non-blocking)
      supabaseAdmin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(
        () => {},
        () => {},
      );
      return { user_id: data.user_id, device_id: deviceId };
    }
  } catch {
    // Supabase not configured — fall through
  }

  return null; // key not found
}
