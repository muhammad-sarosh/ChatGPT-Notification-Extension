# ChatGPT Answer Chime

A Chrome / Microsoft Edge extension that plays a short three-note chime when ChatGPT finishes a response in any loaded ChatGPT tab. Includes a mute switch, volume slider, and test sound. Audio is generated locally; no audio downloads, analytics, servers, or conversation access are needed.

## Install

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Refresh your existing ChatGPT tabs.
5. Open the extension popup and click **Play test sound**.

Send a prompt in ChatGPT, switch to another tab or application, and listen for the chime. Each loaded ChatGPT tab is monitored independently. The extension works while the browser is running.

## Limits

- Detects the disappearance of ChatGPT's stop-generation control after seeing it appear. ChatGPT UI changes may require updating `content.js`.
- Manually clicking Stop does not trigger a chime. Navigation away from an observed conversation suppresses the chime.
- A failed or interrupted response that removes the stop control can also trigger a chime; this signals that generation ended, not that the answer succeeded.
- Sleeping/discarded tabs cannot run the detector until the browser resumes them. Timers in background tabs may be delayed.
- Extended tasks that do not display the regular stop-generation control are not covered.
- Chrome/Edge only; Firefox does not support this offscreen audio implementation.

## Permissions

`storage` saves mute/volume preferences. `offscreen` plays audio independently of tab focus. Content scripts run only on `chatgpt.com` and the legacy `chat.openai.com` domain and inspect the generation control; they do not read or store prompts or answers.
