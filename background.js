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
  if (message.type === "OPEN_LOGIN_POPUP") {
    chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: 400,
      height: 600
    }, (win) => {
      const winId = win.id
      chrome.storage.local.set({
        winId: winId,
      });
    });
  }
});
