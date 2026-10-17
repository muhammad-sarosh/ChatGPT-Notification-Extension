const enabledInput = document.getElementById("enabled");
const volumeInput = document.getElementById("volume");
const volumeValue = document.getElementById("volumeValue");
const status = document.getElementById("status");
chrome.storage.local.get(["enabled", "volume"]).then(({ enabled = true, volume = 60 }) => {
  enabledInput.checked = enabled;
  volumeInput.value = volume;
  volumeValue.textContent = `${volume}%`;
});
enabledInput.addEventListener("change", () => chrome.storage.local.set({ enabled: enabledInput.checked }));
volumeInput.addEventListener("input", () => {
  volumeValue.textContent = `${volumeInput.value}%`;
  chrome.storage.local.set({ volume: Number(volumeInput.value) });
});
document.getElementById("test").addEventListener("click", async () => {
  try {
    const result = await chrome.runtime.sendMessage({ type: "test-chime" });
    status.textContent = result?.ok ? "Test sound played." : `Could not play: ${result?.error || "unknown error"}`;
  } catch (error) { status.textContent = error.message; }
});

async function diagnose() {
  const output = document.getElementById("diagnostics");
  output.textContent = "Checking tabs…";
  try {
    const tabs = await chrome.tabs.query({});
    const results = await Promise.all(tabs.map(async tab => {
      try {
        const state = await chrome.tabs.sendMessage(tab.id, { type: "detector-status" });
        if (!state) return null;
        return `Tab ${tab.id} · detector ${state.version}\n${state.active ? "Response running" : state.generating ? "Waiting to confirm completion" : "Connected, idle"}\nSignal: ${state.signal || "none"}\nLast completion: ${state.lastCompleted ? new Date(state.lastCompleted).toLocaleTimeString() : "none detected"}\nAudio: ${state.lastAudio || "unknown"}\nControls: ${state.controls.join(", ") || "none matched"}`;
      } catch { return null; }
    }));
    output.textContent = results.filter(Boolean).join("\n\n") || "No connected ChatGPT tabs. Reload the extension, then refresh your ChatGPT tabs. Check that extension site access is allowed for chatgpt.com.";
  } catch (error) { output.textContent = error.message; }
}
document.getElementById("diagnose").addEventListener("click", diagnose);
diagnose();
