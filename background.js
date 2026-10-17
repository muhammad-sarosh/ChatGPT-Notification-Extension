let creatingOffscreen;

async function ensureAudioDocument() {
  if (await chrome.offscreen.hasDocument()) return;
  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play a completion chime even when the ChatGPT tab is in the background."
    }).finally(() => { creatingOffscreen = undefined; });
  }
  await creatingOffscreen;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!["answer-complete", "test-chime"].includes(message.type)) return;
  // Completion signals must come from one of our ChatGPT content scripts.
  if (message.type === "answer-complete" &&
      (!sender.tab || !/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(sender.url || ""))) return;
  (async () => {
    const { enabled = true, volume = 60 } = await chrome.storage.local.get(["enabled", "volume"]);
    if (!enabled && message.type !== "test-chime") return { ok: true, muted: true };
    await ensureAudioDocument();
    return await chrome.runtime.sendMessage({ type: "play-chime", volume });
  })().then(sendResponse, error => sendResponse({ ok: false, error: error.message }));
  return true;
});
