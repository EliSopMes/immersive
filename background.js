chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translateText(request.text)
      .then(translation => {
          sendResponse({ translation: translation });
      })
      .catch(error => {
          sendResponse({ error: error.message });
      });
    return true; // Indicates we want to send an async response
  } else if (request.action === 'simplify') {
    simplifyText(request.text)
      .then(simplification => {
        sendResponse({ simplified: simplification });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true; // Indicates we want to send an async response
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    sendResponse({ message: "fail" });
    chrome.action.openPopup({
      url: 'popup_options.html'
    })
  }
});

async function translateText(text) {
  fetch("https://your-site.netlify.app/.netlify/functions/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text })
  })
  .then(res => res.json())
  .then(data => console.log(data.simplified));
}

async function simplifyText(text) {
  // Retrieve API key
  const { OPENAI_API_KEY } = await chrome.storage.local.get('OPENAI_API_KEY');
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        "messages": [
          {
            "role": "system",
            "content": "You are a German language tutor specializing on transforming complicated German words & sentences into A2 level."
          },
          {
            "role": "user",
            "content": `Was ist eine vereinfachte Version von diesem Text: ${text}. Gib nur die vereinfachte Version zurück, ohne weitere Erklärungen`
          }
        ],
        max_tokens: 100,
        temperature: 0.5
      })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
