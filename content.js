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
    <div id="popup-styling">
      <button id="btn1">translate</button>
      <button id="btn2">simplify</button>
      <button id="btn3">pronounce</button>
    </div>
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
      if (foundElement !== null) {
        const regex = new RegExp(selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"); // Escape special characters
        const highlightedReplacement = `<span class="highlighted-text">${simplified}</span>`
        foundElement.innerHTML = foundElement.innerHTML.replace(regex, highlightedReplacement);
      } else {
        console.log("foundElement is null")
      }
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
    font-weight: bold;v
    padding: 2px 4px;
    border-radius: 3px;
  }
`;

document.head.appendChild(style);


window.addEventListener("scroll", () => {
  const scrollPosition = window.scrollY + window.innerHeight;
  const totalPosition = document.documentElement.scrollHeight;

  const scrollPercentage = (scrollPosition / totalPosition) * 100

  if (scrollPercentage >= 70) {
    let exercisePopup = document.createElement("div");
    exercisePopup.id = "exercisePopup";

    exercisePopup.style.position = "fixed";
    exercisePopup.style.top = '50%'; // Adjust Y position
    exercisePopup.style.left = '50%'; // Adjust X position
    exercisePopup.style.transform = "translate(-50%, -50%)";
    exercisePopup.style.background = "white";
    exercisePopup.style.border = "1px solid black";
    exercisePopup.style.padding = "20px";
    exercisePopup.style.zIndex = "9999";

    // Add buttons
    exercisePopup.innerHTML = `
      <button id="closePopup" style="text-align: end;">X</button>
      <button id="exercise-btn">Test your understanding</button>
    `;

    // Append exercisePopup to body
    document.body.appendChild(exercisePopup);
    setTimeout(() => {
      document.getElementById("exercise-btn").addEventListener("click", () => {
        exercisePopup.remove()
      });
      document.getElementById("closePopup").addEventListener("click", () => exercisePopup.remove());
    }, 100);
  }
})
