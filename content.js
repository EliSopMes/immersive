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
  popup.style.width = "138px";
  // popup.style.height = "34px";
  popup.style.fontFamily = "'Poppins', sans-serif";
  popup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
  popup.style.left = `${rect.right + window.scrollX}px`; // Adjust X position
  popup.style.background = "white";
  popup.style.border = "1px solid #D9D9D9";
  popup.style.borderRadius = "8px";
  popup.style.padding = "8px 12px";
  popup.style.zIndex = "9999";
  popup.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";

  // Add buttons
  popup.innerHTML = `
    <div id="popup-styling" style="display: flex; justify-content: space-between;">
      <img id="btn1" src="${chrome.runtime.getURL("pngs/translate-icon.png")}" alt="translate" class="context-icons">
      <img id="btn2" src="${chrome.runtime.getURL("pngs/simple-icon.png")}" alt="simplification" class="context-icons">
      <img id="btn3" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" class="context-icons">
      <button class="closePopup">X</button>
    </div>
  `;

  // Append popup to body
  document.body.appendChild(popup);

  // ✅ Ensure Event Listeners Work
  setTimeout(() => {
    document.getElementById("btn1").addEventListener("click", () => {
      translate(selectedText);
      popup.remove();
    });
    document.getElementById("btn2").addEventListener("click", () => {
      simplify(selectedText);
      popup.remove();
    });
    document.getElementById("btn3").addEventListener("click", (event) => {
      if (event.target.innerHTML === 'pause') {
        event.target.innerHTML = "pronounce"
      } else {
        event.target.innerHTML = "pause"
      }
      pronounce(selectedText, "de");
    });
    document.querySelector(".closePopup").addEventListener("click", () => {
      popup.remove();
      cleanup();
    });
  }, 100);  // Small delay ensures the elements exist

  function cleanup() {
    document.removeEventListener("click", handleOutsideClick);
    window.removeEventListener("scroll", handleScroll());
  }

  function handleOutsideClick(event) {
    if (!popup.contains(event.target)) {
      popup.remove();
      cleanup();
    }
  }

  function handleScroll() {
    const popupRect = popup.getBoundingClientRect();
    const isOutOfView =
      popupRect.bottom < 0 || popupRect.top > window.innerHeight;

    if (isOutOfView) {
      popup.remove();
      cleanup();
    }
  }
  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);
  window.addEventListener("scroll", handleScroll);
}

function simplify(selectedText) {
  fetch("https://immersive-server.netlify.app/.netlify/functions/simplify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: selectedText })
  })
  .then(res => res.json())
  .then(data => {
    const simplified = data.simplified;

    let choicePopup = document.createElement("div");
    choicePopup.id = "choicePopup";

    // Get selection coordinates
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    choicePopup.style.position = "absolute";
    choicePopup.style.width = "305px";
    choicePopup.style.fontFamily = "'Poppins', sans-serif";
    choicePopup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
    choicePopup.style.left = `${rect.right + window.scrollX}px`; // Adjust X position
    choicePopup.style.background = "white";
    choicePopup.style.border = "1px solid #D9D9D9";
    choicePopup.style.borderRadius = "8px";
    choicePopup.style.padding = "8px 12px";
    choicePopup.style.zIndex = "9999";
    choicePopup.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";

    // Add buttons
    choicePopup.innerHTML = `
      <div id="choicePopup">
        <div style="display: flex; justify-content: space-between;">
          <p style="color: #555555; margin: 4px 0px 8px 0px">Simplified content</p>
          <button class="closePopup">X</button>
        </div>
        <hr>
        <p>${simplified}</p>
        <div id="choice-popup-styling" style="display: flex; justify-content: space-between;">
          <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" class="context-icons">
          <img id="btn-vocab" src="${chrome.runtime.getURL("pngs/vocab-icon.png")}" alt="audio" class="context-icons">
          <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="translate" class="context-icons">
          <img id="btn-translate" src="${chrome.runtime.getURL("pngs/translate-icon.png")}" alt="simplification" class="context-icons">
        </div>
      </div>
    `;

    // Append choicePopup to body
    document.body.appendChild(choicePopup);

    setTimeout(() => {
      document.getElementById("btn-copy").addEventListener("click", () => {
        navigator.clipboard.writeText(translation);
      });
      document.getElementById("btn-vocab").addEventListener("click", () => {
        vocabulary_list.push([selectedText, translation]);
        chrome.storage.local.set({ vocabulary_list });
      });
      document.getElementById("btn-translate").addEventListener("click", () => {
        translate(simplified);
      });
      document.getElementById("btn-audio").addEventListener("click", (event) => {
        pronounce(translation, 'de');
      });
      document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
      });
    }, 100);
  });
}

function translate(selectedText) {
  fetch("https://immersive-server.netlify.app/.netlify/functions/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: selectedText })
  })
  .then(res => res.json())
  .then(data => {
    const translation = data.translated;

    let choicePopup = document.createElement("div");
    choicePopup.id = "choicePopup";

    // Get selection coordinates
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    choicePopup.style.position = "absolute";
    choicePopup.style.width = "305px";
    choicePopup.style.fontFamily = "'Poppins', sans-serif";
    choicePopup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
    choicePopup.style.left = `${rect.right + window.scrollX}px`; // Adjust X position
    choicePopup.style.background = "white";
    choicePopup.style.border = "1px solid #D9D9D9";
    choicePopup.style.borderRadius = "8px";
    choicePopup.style.padding = "8px 12px";
    choicePopup.style.zIndex = "9999";
    choicePopup.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";

    // Add buttons
    choicePopup.innerHTML = `
      <div id="choicePopup">
        <div style="display: flex; justify-content: space-between;">
          <p style="color: #555555; margin: 4px 0px 8px 0px">Translation</p>
          <button class="closePopup">X</button>
        </div>
        <hr>
        <p>${translation}</p>
        <div id="choice-popup-styling" style="display: flex; justify-content: space-between;">
          <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" class="context-icons">
          <img id="btn-vocab" src="${chrome.runtime.getURL("pngs/vocab-icon.png")}" alt="audio" class="context-icons">
          <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="translate" class="context-icons">
          <img id="btn-simple" src="${chrome.runtime.getURL("pngs/simple-icon.png")}" alt="simplification" class="context-icons">
        </div>
      </div>
    `;

    // Append choicePopup to body
    document.body.appendChild(choicePopup);

    setTimeout(() => {
      document.getElementById("btn-copy").addEventListener("click", () => {
        navigator.clipboard.writeText(translation);
      });
      document.getElementById("btn-vocab").addEventListener("click", () => {
        vocabulary_list.push([selectedText, translation]);
        chrome.storage.local.set({ vocabulary_list });
      });
      document.getElementById("btn-simple").addEventListener("click", () => {
        simplify(translation);
      });
      document.getElementById("btn-audio").addEventListener("click", (event) => {
        pronounce(translation, 'en');
      });
      document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
      });
    }, 100);
  });
}
function pronounce(selectedText, language) {
  if (isSpeaking) {
    window.speechSynthesis.cancel(); // Stop speech if already speaking
    isSpeaking = false;
  } else {
    const utterance = new SpeechSynthesisUtterance(selectedText);
    utterance.lang = language; // Set language code (e.g., "de" for German, "en" for English)
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


// window.addEventListener("scroll", () => {
//   const scrollPosition = window.scrollY + window.innerHeight;
//   const totalPosition = document.documentElement.scrollHeight;

//   const scrollPercentage = (scrollPosition / totalPosition) * 100

//   if (scrollPercentage >= 70) {
//     let exercisePopup = document.createElement("div");
//     exercisePopup.id = "exercisePopup";

//     exercisePopup.style.position = "fixed";
//     exercisePopup.style.fontFamily = "'Poppins', sans-serif";
//     exercisePopup.style.top = '50%'; // Adjust Y position
//     exercisePopup.style.left = '50%'; // Adjust X position
//     exercisePopup.style.transform = "translate(-50%, -50%)";
//     exercisePopup.style.background = "white";
//     exercisePopup.style.border = "1px solid black";
//     exercisePopup.style.padding = "20px";
//     exercisePopup.style.zIndex = "9999";

//     // Add buttons
//     exercisePopup.innerHTML = `
//       <button class="closePopup" style="text-align: end;">X</button>
//       <button id="exercise-btn">Test your understanding</button>
//     `;

//     // Append exercisePopup to body
//     document.body.appendChild(exercisePopup);
//     setTimeout(() => {
//       document.getElementById("exercise-btn").addEventListener("click", () => {
//         exercisePopup.remove()
//       });
//       document.querySelector(".closePopup").addEventListener("click", () => exercisePopup.remove());
//     }, 100);
//   }
// })
