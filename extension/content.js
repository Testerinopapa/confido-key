// Runs on LinkedIn pages. Collects the profile currently in view so the
// dashboard pipeline stays in sync, and exposes a helper to draft replies
// through the AudiencePilot proxy (keys stay server-side).

function readProfile() {
  const name = document.querySelector("h1")?.textContent?.trim();
  if (!name) return null;
  const headline = document.querySelector(".text-body-medium")?.textContent?.trim() || null;
  return { name, headline, profile_url: location.href.split("?")[0] };
}

function syncCurrentProfile() {
  if (!location.pathname.startsWith("/in/")) return;
  const lead = readProfile();
  if (!lead) return;
  chrome.runtime.sendMessage({ type: "syncLead", lead });
}

let lastPath = "";
setInterval(() => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    setTimeout(syncCurrentProfile, 1500);
  }
}, 1000);

chrome.runtime.onMessage?.addListener((message, _sender, sendResponse) => {
  if (message?.type === "readProfile") {
    sendResponse({ ok: true, lead: readProfile() });
    return true;
  }
  return undefined;
});
