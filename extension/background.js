importScripts("config.js");

async function proxyHeaders() {
  const cfg = await getConfig();
  return { cfg, headers: { "Content-Type": "application/json", "X-Device-Id": await getDeviceId() } };
}

async function callClaude({ prompt, maxTokens = 400 }) {
  const { cfg, headers } = await proxyHeaders();
  const res = await fetch(`${cfg.apiBase}/api/public/claude`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: cfg.claudeModel,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude proxy error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.content || []).map((p) => p.text || "").join("").trim();
}

async function callGemini({ prompt }) {
  const { cfg, headers } = await proxyHeaders();
  const res = await fetch(`${cfg.apiBase}/api/public/gemini`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: cfg.geminiModel,
      action: "generateContent",
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini proxy error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const image = parts.find((p) => p.inlineData || p.inline_data);
  const inline = image?.inlineData || image?.inline_data;
  return {
    text: parts.map((p) => p.text || "").join("").trim(),
    imageDataUrl: inline ? `data:${inline.mimeType || inline.mime_type};base64,${inline.data}` : null,
  };
}

async function checkHealth() {
  const { cfg } = await proxyHeaders();
  const res = await fetch(`${cfg.apiBase}/api/public/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}

async function syncLead(lead) {
  const { cfg, headers } = await proxyHeaders();
  const res = await fetch(`${cfg.apiBase}/api/public/sync/lead`, {
    method: "POST",
    headers,
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error(`Lead sync failed (${res.status})`);
  return res.json();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const run = async () => {
    switch (message?.type) {
      case "claude":
        return { ok: true, text: await callClaude(message) };
      case "gemini":
        return { ok: true, ...(await callGemini(message)) };
      case "health":
        return { ok: true, health: await checkHealth() };
      case "syncLead":
        return { ok: true, lead: await syncLead(message.lead) };
      default:
        return { ok: false, error: `Unknown message type: ${message?.type}` };
    }
  };
  run()
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: String(error.message || error) }));
  return true;
});
