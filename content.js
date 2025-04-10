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
  popup.style.fontFamily = "'Poppins', sans-serif";
  popup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
  popup.style.left = `${rect.right + window.scrollX}px`; // Adjust X position
  popup.style.background = "white";
  popup.style.border = "1px solid black";
  popup.style.padding = "20px";
  popup.style.zIndex = "9999";
  popup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";

  // Add buttons
  popup.innerHTML = `
    <button class="closePopup" style="text-align: end;">X</button>
    <div id="popup-styling">
      <button id="btn1">Translate</button>
      <button id="btn2">Simplify</button>
      <button id="btn3">Pronounce</button>
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
  chrome.runtime.sendMessage({
    action: 'simplify',
    text: selectedText
  }, (response) => {
    if (response.simplified) {
      // document.getElementById('text-action-result').textContent = response.translation;
      const simplified = response.simplified;
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const foundElement = container.nodeType === 3 ? container.parentElement :container;
        if (foundElement !== null) {
          const regex = new RegExp(selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"); // Escape special characters
          const highlightedReplacement = `<span class="highlighted-text">${simplified}</span>`
          foundElement.innerHTML = foundElement.innerText.replace(regex, highlightedReplacement);

           // Create the popup container
          let backPopup = document.createElement("div");
          backPopup.id = "backPopup";

          // Get selection coordinates
          const selection = window.getSelection();
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          backPopup.style.position = "absolute";
          backPopup.style.fontFamily = "'Poppins', sans-serif";
          backPopup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
          backPopup.style.left = `${rect.right + window.scrollX}px`; // Adjust X position
          backPopup.style.background = "white";
          backPopup.style.border = "1px solid black";
          backPopup.style.padding = "20px";
          backPopup.style.zIndex = "9999";
          backPopup.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";

          // Add buttons
          backPopup.innerHTML = `
            <button class="closePopup" style="text-align: end;">X</button>
            <div id="backPopup-styling">
              <button id="btn-back">Back to original</button>
            </div>
          `;

          // Append backPopup to body
          document.body.appendChild(backPopup);

          // ✅ Ensure Event Listeners Work
          setTimeout(() => {
            document.getElementById("btn-back").addEventListener("click", () => {
              const regexBack = new RegExp(simplified.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"); // Escape special characters
              const backReplacement = `<span>${selectedText}</span>`
              foundElement.innerHTML = foundElement.innerText.replace(regexBack, backReplacement);
            });
            document.getElementById("backPopup").addEventListener("click", () => {
              backPopup.remove();
            });
          }, 100);
        } else {
          console.log("foundElement is null")
        }
      }
    } else {
      document.getElementById('text-action-result').textContent = 'Translation failed';
    }
  });
}
function translate(selectedText) {
  fetch("https://immersive-server.netlify.app/.netlify/functions/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: selectedText })
  })
  .then(res => res.json())
  .then(data => console.log(data.simplified));


  // chrome.runtime.sendMessage({
  //   action: 'translate',
  //   text: selectedText
  // }, (response) => {
  //   if (response.translation) {
  //     const translation = response.translation;

  //     vocabulary_list.push([selectedText, translation]);
  //     chrome.storage.local.set({ vocabulary_list });
  //     const popup = document.getElementById('customPopup');
  //     popup.insertAdjacentHTML('beforeend', `<p id="text-action-result">Translated: ${translation}</p>`)
  //   } else {
  //     document.getElementById('text-action-result').textContent = 'Translation failed';
  //   }
  // });
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
    exercisePopup.style.fontFamily = "'Poppins', sans-serif";
    exercisePopup.style.top = '50%'; // Adjust Y position
    exercisePopup.style.left = '50%'; // Adjust X position
    exercisePopup.style.transform = "translate(-50%, -50%)";
    exercisePopup.style.background = "white";
    exercisePopup.style.border = "1px solid black";
    exercisePopup.style.padding = "20px";
    exercisePopup.style.zIndex = "9999";

    // Add buttons
    exercisePopup.innerHTML = `
      <button class="closePopup" style="text-align: end;">X</button>
      <button id="exercise-btn">Test your understanding</button>
    `;

    // Append exercisePopup to body
    document.body.appendChild(exercisePopup);
    setTimeout(() => {
      document.getElementById("exercise-btn").addEventListener("click", () => {
        exercisePopup.remove()
      });
      document.querySelector(".closePopup").addEventListener("click", () => exercisePopup.remove());
    }, 100);
  }
})
