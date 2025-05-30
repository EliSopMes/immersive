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
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["styles.css"]
    });
    console.log("✅ content.js injected on page load.");
    chrome.storage.local.set({ active: true });
  } else {
    console.log("⏳ Tab still loading or not the correct URL:");
  }

  if (changeInfo.status === 'complete' && tab.url.includes("https://immersive-server.netlify.app")) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["content.js"],
    });
    chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["styles.css"]
    });
    console.log("✅ content.js injected on page load.");
    chrome.storage.local.set({ active: true });
  } else {
    console.log("⏳ Tab still loading or not the correct URL:");
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "activateExtension") {
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
      chrome.storage.local.set({ active: true });
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

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === "icon_clicked") {
    const tabId = request.tabId

    if (!tabId) {
      console.error("❌ Could not find the tab ID.");
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      });
      console.log("✅ content.js injected successfully.");

      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ["styles.css"]
      });
      console.log("✅ styles.css injected successfully.");
      chrome.storage.local.set({ active: true });
    } catch (error) {
      console.error("❌ Failed to inject script or styles:", error);
    }
  }
  if (request.message === "deactivate") {
    const tabId = request.tabId

    if (!tabId) {
      console.error("❌ Could not find the tab ID.");
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          if (window.cleanupMyExtension) {
            window.cleanupMyExtension();
            console.log("🧼 Extension deactivated and cleaned up.");
          } else {
            console.log("⚠️ Nothing to clean up.");
          }
        }
      });
      chrome.storage.local.set({ active: false });
    } catch (error) {
      console.error("❌ Failed to inject script or styles:", error);
    }
  }
})
