const el = (id) => document.getElementById(id);
const status = el("status");

function setStatus(text, kind = "") {
  status.className = `status ${kind}`;
  status.textContent = text;
}

async function send(message) {
  const res = await chrome.runtime.sendMessage(message);
  if (!res?.ok) throw new Error(res?.error || "Request failed");
  return res;
}

(async () => {
  const cfg = await getConfig();
  el("apiBase").value = cfg.apiBase;
})();

el("save").addEventListener("click", async () => {
  await chrome.storage.local.set({
    apiBase: el("apiBase").value.trim().replace(/\/$/, ""),
  });
  setStatus("Settings saved.", "ok");
});

el("test").addEventListener("click", async () => {
  setStatus("Checking proxy…");
  try {
    const { health } = await send({ type: "health" });
    setStatus(
      `Connected. Claude: ${health.providers?.claude ? "ready" : "off"} · Gemini: ${
        health.providers?.gemini ? "ready" : "off"
      }`,
      "ok",
    );
  } catch (error) {
    setStatus(error.message, "err");
  }
});

el("draft").addEventListener("click", async () => {
  const prompt = el("prompt").value.trim();
  if (!prompt) return setStatus("Enter a prompt first.", "err");
  setStatus("Drafting with Claude…");
  try {
    const { text } = await send({ type: "claude", prompt });
    setStatus(text || "(empty response)", "ok");
  } catch (error) {
    setStatus(error.message, "err");
  }
});

el("image").addEventListener("click", async () => {
  const prompt = el("prompt").value.trim();
  if (!prompt) return setStatus("Enter a prompt first.", "err");
  setStatus("Generating image with Gemini…");
  try {
    const { text, imageDataUrl } = await send({ type: "gemini", prompt });
    setStatus(imageDataUrl ? "Image ready." : text || "No image returned.", imageDataUrl ? "ok" : "err");
    const preview = el("preview");
    preview.hidden = !imageDataUrl;
    if (imageDataUrl) preview.src = imageDataUrl;
  } catch (error) {
    setStatus(error.message, "err");
  }
});
