let vocabulary_list = []
let defintion_list = []
let lastSelectedText = "";
let isSpeaking = false;

document.addEventListener('mouseup', function () {
  let selectedText = window.getSelection().toString().trim();
  if (selectedText && selectedText !== lastSelectedText && !document.getElementById("customPopup")) {
    lastSelectedText = selectedText;
    createPopup(lastSelectedText);
  }
});

function createPopup(selectedText) {
  // Check if popup already exists, to prevent duplicates
  let existingPopup = document.getElementById("customPopup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create the popup container
  let popup = document.createElement("div");
  popup.id = "customPopup";

  // Get selection coordinates
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  popup.style.position = "absolute";
  popup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
  popup.style.left = `${rect.right + window.scrollX}px`; // Adjust X position
  popup.style.background = "white";
  popup.style.border = "1px solid black";
  popup.style.padding = "20px";
  popup.style.zIndex = "9999";
  popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";

  // Add buttons
  popup.innerHTML = `
    <button id="closePopup" style="text-align: end;">X</button>
    <button id="btn1">translate</button>
    <button id="btn2">simplify</button>
    <button id="btn3">pronounce</button>
  `;

  // Append popup to body
  document.body.appendChild(popup);

  // ✅ Ensure Event Listeners Work
  setTimeout(() => {
    document.getElementById("btn1").addEventListener("click", () => {
      translate(selectedText);
    });
    document.getElementById("btn2").addEventListener("click", () => {
      simplify(selectedText);
      popup.remove()
    });
    document.getElementById("btn3").addEventListener("click", (event) => {
      if (event.target.innerHTML === 'pause') {
        event.target.innerHTML = "pronounce"
      } else {
        event.target.innerHTML = "pause"
      }
      pronounce(selectedText);
    });
    document.getElementById("closePopup").addEventListener("click", () => popup.remove());
  }, 100);  // Small delay ensures the elements exist
}


function simplify(selectedText) {
  chrome.runtime.sendMessage({
    action: 'simplify',
    text: selectedText
  }, (response) => {
    if (response.simplified) {
      // document.getElementById('text-action-result').textContent = response.translation;
      const simplified = response.simplified;
      const xpath = `//*[contains(text(), '${selectedText}')]`;
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      const foundElement = result.singleNodeValue;
      console.log(foundElement); // Returns the found element or null
      const regex = new RegExp(selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"); // Escape special characters
      const highlightedReplacement = `<span class="highlighted-text">${simplified}</span>`
      foundElement.innerHTML = foundElement.innerHTML.replace(regex, highlightedReplacement);
      // defintion_list.push([selectedText, simplified]);
      // chrome.storage.local.set({ defintion_list });
      const popup = document.getElementById('customPopup');
      popup.insertAdjacentHTML('beforeend', `<p id="text-action-result">Simplified: ${simplified}</p>`);
    } else {
      document.getElementById('text-action-result').textContent = 'Translation failed';
    }
  });
}
function translate(selectedText) {
  chrome.runtime.sendMessage({
    action: 'translate',
    text: selectedText
  }, (response) => {
    if (response.translation) {
      const translation = response.translation;

      vocabulary_list.push([selectedText, translation]);
      chrome.storage.local.set({ vocabulary_list });
      const popup = document.getElementById('customPopup');
      popup.insertAdjacentHTML('beforeend', `<p id="text-action-result">Translated: ${translation}</p>`)
    } else {
      document.getElementById('text-action-result').textContent = 'Translation failed';
    }
  });
}
function pronounce(selectedText) {
  if (isSpeaking) {
    window.speechSynthesis.cancel(); // Stop speech if already speaking
    isSpeaking = false;
  } else {
    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.lang = "de"; // Set language code (e.g., "de" for German, "en" for English)
    utterance.onend = () => {
      isSpeaking = false; // Reset when done
    };
    window.speechSynthesis.speak(utterance);
    isSpeaking = true;
  }
}

const style = document.createElement('style')
style.innerHTML = `
  .highlighted-text {
    background-color: yellow;
    color: black;
    font-weight: bold;
    padding: 2px 4px;
    border-radius: 3px;
  }
`;

document.head.appendChild(style);
