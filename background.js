console.log("🚀 Service Worker Loaded!");

// Create a context menu option
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "activateExtension",
    title: "Activate Immersive Extension",
    contexts: ["page"]
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url
  ) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    });
    console.log("✅ content.js injected on page load.");
  } else {
    console.log("⏳ Tab still loading or not the correct URL:");
    console.log("Status:", changeInfo.status);
    console.log("Tab ID:", tabId);
    console.log("URL:", tab || "Not yet available");
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "activateExtension") {
    console.log("🌟 Context menu clicked!");

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      console.log("✅ content.js injected successfully.");

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["styles.css"]
      });
      console.log("✅ styles.css injected successfully.");
    } catch (error) {
      console.error("❌ Failed to inject script or styles:", error);
    }
  }
});


chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({
    url: "https://immersive-server.netlify.app/"
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
