let audioContext;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "play-chime") return;
  (async () => {
    audioContext ||= new AudioContext();
    await audioContext.resume();
    const volume = Math.max(0, Math.min(100, Number(message.volume) || 0)) / 100;
    const start = audioContext.currentTime + 0.02;
    for (const [offset, frequency] of [[0, 659.25], [0.16, 880], [0.32, 1046.5]]) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start + offset);
      gain.gain.linearRampToValueAtTime(volume * 0.24, start + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 0.5);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.55);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    return { ok: true };
  })().then(sendResponse, error => sendResponse({ ok: false, error: error.message }));
  return true;
});
