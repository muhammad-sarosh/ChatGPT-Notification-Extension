(() => {
  // Observe the generation control instead of guessing from pauses in streamed text.
  const stopSelector = '[data-testid="stop-button"], [data-testid="composer-stop-button"], button[aria-label="Stop"], button[aria-label="Stop generating"], button[aria-label="Stop streaming"], button[aria-label="Stop response"]';
  const streamingSelector = '[data-is-streaming="true"], .result-streaming';
  let generating = false;
  let generationPath = location.pathname;
  let pending;
  let lastCompleted = null;
  let lastAudio = "No completion sent";

  function composer() {
    const input = document.querySelector('#prompt-textarea, [contenteditable="true"][role="textbox"], textarea');
    if (!input) return null;
    const form = input.closest('form');
    if (form) return form;
    let parent = input.parentElement;
    for (let depth = 0; parent && depth < 6; depth++, parent = parent.parentElement) {
      if (parent.querySelector('button, [role="button"]')) return parent;
    }
    return null;
  }

  function squareStop(button) {
    // Recognize the filled square, including rounded squares encoded as SVG paths.
    // Sampling near all four corners excludes circular, microphone, plus and arrow icons.
    return [...button.querySelectorAll('svg rect, svg path')].some(shape => {
      try {
        const box = shape.getBBox();
        if (box.width < 6 || box.height < 6 || Math.abs(box.width / box.height - 1) > 0.12) return false;
        for (const x of [0.12, 0.5, 0.88]) for (const y of [0.12, 0.5, 0.88]) {
          if (!shape.isPointInFill(new DOMPoint(box.x + x * box.width, box.y + y * box.height))) return false;
        }
        return true;
      } catch { return false; }
    });
  }

  function iconStop() {
    const root = composer();
    if (!root) return null;
    return [...root.querySelectorAll('button, [role="button"]')].find(button =>
      button.getClientRects().length && !button.disabled && squareStop(button)) || null;
  }

  function signal() {
    if (document.querySelector(stopSelector)) return "Stop label";
    if (document.querySelector(streamingSelector)) return "Streaming marker";
    if (iconStop()) return "Composer Stop icon";
    return null;
  }
  const isActive = () => Boolean(signal());

  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.type !== "detector-status") return;
    respond({ version: "1.0.3", generating, active: isActive(), lastCompleted, signal: signal(), lastAudio,
      controls: [...document.querySelectorAll('button[aria-label], button[data-testid]')]
        .map(button => `${button.getAttribute('data-testid') || ''} ${button.getAttribute('aria-label') || ''}`.trim())
        .filter(label => /stop|send|composer|stream/i.test(label)).slice(0, 12) });
  });

  function check() {
    const active = isActive();
    if (active) {
      clearTimeout(pending);
      pending = undefined;
      generating = true;
      generationPath = location.pathname;
      return;
    }
    if (!generating || pending !== undefined) return;
    // A brief confirmation avoids chimes during temporary React control replacements.
    pending = setTimeout(() => {
      pending = undefined;
      if (isActive()) return;
      generating = false;
      if (location.pathname !== generationPath) return;
      lastCompleted = Date.now();
      lastAudio = "Sending completion";
      chrome.runtime.sendMessage({ type: "answer-complete" }).then(result => {
        lastAudio = result?.muted ? "Muted" : result?.ok ? "Audio scheduled" : `Audio error: ${result?.error || "No acknowledgement"}`;
      }).catch(error => { lastAudio = `Connection error: ${error.message}`; });
    }, 1200);
  }

  // Manually stopping a response should not count as a finished answer.
  document.addEventListener("click", event => {
    const stopIcon = iconStop();
    if (event.target instanceof Element &&
        (event.target.closest(stopSelector) || (stopIcon && event.target.closest('button, [role="button"]') === stopIcon))) {
      generating = false;
      clearTimeout(pending);
      pending = undefined;
    }
  }, true);
  new MutationObserver(check).observe(document.documentElement, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ["data-testid", "aria-label", "data-is-streaming", "class", "d", "disabled"]
  });
  // Also sample state when a framework changes controls outside observed mutations.
  setInterval(check, 750);
  check();
})();
