// AudiencePilot extension configuration.
// The proxy hosts the Claude + Gemini keys server-side, so no API keys live here.
const DEFAULT_CONFIG = {
  apiBase: "https://confido-key.lovable.app",
  claudeModel: "claude-haiku-4-5-20251001",
  geminiModel: "gemini-3.1-flash-image-preview",
};

async function getConfig() {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_CONFIG));
  return { ...DEFAULT_CONFIG, ...stored };
}

async function getDeviceId() {
  const { deviceId } = await chrome.storage.local.get("deviceId");
  if (deviceId) return deviceId;
  const next = crypto.randomUUID();
  await chrome.storage.local.set({ deviceId: next });
  return next;
}
