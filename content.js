let vocabulary_list = []
let defintion_list = []
let lastSelectedText = "";
let isSpeaking = false;

window.addEventListener("message", (event) => {
  // SECURITY: verify the origin
  if (event.origin !== "http://127.0.0.1:5500") return;
  // if (event.origin !== "https://immersive-server.netlify.app/") return;

  if (event.data.type === "SUPABASE_TOKEN") {
    const token = event.data.token;

    // Store in chrome.storage
    chrome.storage.local.set({ supabaseToken: token }, () => {
      console.log("Supabase token stored in extension storage.");
    });
  }
});

document.addEventListener('mouseup', function (event) {
  const isInsidePopup = event.target.closest("#choicePopup") || event.target.closest(".simplified-popup");
  if (isInsidePopup) return;
  let selectedText = window.getSelection().toString().trim();
  if (selectedText && selectedText !== lastSelectedText && !document.getElementById("customPopup")) {
    lastSelectedText = selectedText;
    const number_of_highlighted_words = selectedText.split(/\s+/).length;
    createPopup(lastSelectedText, number_of_highlighted_words);
  }
});

function createPopup(selectedText, number_of_highlighted_words) {
  // Check if popup already exists, to prevent duplicates
  let existingPopup = document.getElementById("customPopup");
  if (existingPopup) {
    existingPopup.remove();
  }
  let choicePopup = document.getElementById("choicePopup");
  if (choicePopup) {
    choicePopup.remove();
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
  popup.style.left = `${rect.right - 200 + window.scrollX}px`; // Adjust X position
  popup.style.background = "white";
  popup.style.border = "1px solid #D9D9D9";
  popup.style.borderRadius = "8px";
  popup.style.padding = "8px 12px";
  popup.style.zIndex = "9999";
  popup.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";

  // Add buttons
  popup.innerHTML = `
    <div id="popup-styling" style="display: flex; justify-content: space-between;">
      <img id="btn1" src="${chrome.runtime.getURL("pngs/translate-icon.png")}" alt="translate" title="translate" class="context-icons">
      <img id="btn2" src="${chrome.runtime.getURL("pngs/simple-icon.png")}" alt="simplify" title="simplify" class="context-icons">
      <img id="btn3" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
      <button class="closePopup">X</button>
    </div>
  `;

  // Append popup to body
  document.body.appendChild(popup);

  // ✅ Ensure Event Listeners Work
  setTimeout(() => {
    document.getElementById("btn1").addEventListener("click", () => {
      translateGPT(selectedText, number_of_highlighted_words);
      // translate(selectedText, number_of_highlighted_words);
      popup.remove();
    });
    document.getElementById("btn2").addEventListener("click", () => {
      chrome.storage.local.get("language_level" , (data) => {
        const level = data.language_level || 'A2';
        simplify(selectedText, level, number_of_highlighted_words);
        popup.remove();
      })
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

function simplify(selectedText, level, number_of_highlighted_words) {
  chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
    if (!supabaseToken) {
      console.log('no token')
      return;
    }

    const taskToDo = number_of_highlighted_words <= 3 ? 'define' : 'simplify'
    fetch(`https://immersive-server.netlify.app/.netlify/functions/${taskToDo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
      body: JSON.stringify({ text: selectedText, level: level })
    })
    .then(res => res.json())
    .then(data => {
      const simplified = data.simplified;

      let oldPopup = document.getElementById("choicePopup");
      if (oldPopup) oldPopup.remove();

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
      choicePopup.style.left = `${rect.right - 200  + window.scrollX}px`; // Adjust X position
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
            <p style="color: #555555; margin: 4px 0px 8px 0px">${taskToDo === "define" ? "Defintion" : "Simplified content"}</p>
            <button class="closePopup">X</button>
          </div>
          <hr>
          <p class="choice-text">${simplified}</p>
          <div id="choice-popup-styling" class="three" style="display: flex; justify-content: space-between;">
            <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
            <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="copy" title="copy" class="context-icons">
            <div id="toast-copy">
              Saved to clipboard!
            </div>
            <img id="btn-translate" src="${chrome.runtime.getURL("pngs/translate-icon.png")}" alt="translate" title="translate" class="context-icons">
          </div>
        </div>
      `;

      // Append choicePopup to body
      document.body.appendChild(choicePopup);

      setTimeout(() => {
        document.getElementById("btn-copy").addEventListener("click", () => {
          navigator.clipboard.writeText(simplified);
          const toast = document.getElementById('toast-copy');
          toast.style.visibility = "visible";
          setTimeout(() => {
            toast.style.visibility = "hidden";
          }, 1000);
        });
        document.getElementById("btn-translate").addEventListener("click", () => {
          translate_from_simplified(selectedText, number_of_highlighted_words);
        });
        document.getElementById("choicePopup").addEventListener("mouseup", function (event) {
          const isInsidePopup = event.target.closest("#choice-text");
          if (isInsidePopup) return;
          let selectedText = window.getSelection().toString().trim();
          let number_highlighted_words = selectedText.split(/\s+/).length;
          if (selectedText && selectedText !== "") {
            translate_from_simplified(selectedText, number_highlighted_words);
          }
        });
        document.getElementById("btn-audio").addEventListener("click", () => {
          pronounce(simplified, 'de');
        });
        document.querySelector(".closePopup").addEventListener("click", () => {
          choicePopup.remove();
        });
      }, 100);
    })
    .catch((err) => {
      console.error("Fetch failed:", err);
    });
  });
}

function translate(selectedText, number_of_highlighted_words) {
  fetch("https://immersive-server.netlify.app/.netlify/functions/translateGPT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: selectedText })
  })
  .then(res => res.json())
  .then(data => {
    const translation = data.translated;

    let oldPopup = document.getElementById("choicePopup");
    if (oldPopup) oldPopup.remove();

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
    choicePopup.style.left = `${rect.right - 200  + window.scrollX}px`; // Adjust X position
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
        <p class="choice-text">${translation}</p>
        <div id="choice-popup-styling" class="four" style="display: flex; justify-content: space-between;">
          <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
          <div style="${number_of_highlighted_words > 3 ? "display: none" : ""}">
            <img id="btn-vocab" src="${chrome.runtime.getURL("pngs/vocab-icon.png")}" alt="add to vocabulary list" title="add to vocabulary list" class="context-icons">
            <div id="toast">
              Saved!
            </div>
          </div>
          <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="copy" title="copy" class="context-icons">
          <div id="toast-copy">
            Saved to clipboard!
          </div>
          <img id="btn-simple" src="${chrome.runtime.getURL("pngs/simple-icon.png")}" alt="simplify" title="simplify" class="context-icons">
        </div>
      </div>
    `;

    // Append choicePopup to body
    document.body.appendChild(choicePopup);

    setTimeout(() => {
      document.getElementById("btn-copy").addEventListener("click", () => {
        navigator.clipboard.writeText(translation);
        const toast = document.getElementById('toast-copy');
        toast.style.visibility = "visible";
        setTimeout(() => {
          toast.style.visibility = "hidden";
        }, 1000);
      });
      document.getElementById("btn-vocab").addEventListener("click", () => {
        vocabulary_list.push([selectedText, translation]);
        chrome.storage.local.set({ vocabulary_list });
        const toast = document.getElementById('toast');
        toast.style.visibility = "visible";
        setTimeout(() => {
          toast.style.visibility = "hidden";
        }, 1000);
      });
      document.getElementById("btn-simple").addEventListener("click", () => {
        chrome.storage.local.get("language_level" , (data) => {
          const level = data.language_level || 'A2';
          simplify(selectedText, level, number_of_highlighted_words);
        })
      });
      document.getElementById("btn-audio").addEventListener("click", () => {
        pronounce(selectedText, 'de');
      });
      document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
      });
    }, 100);
  });
}

function translateGPT(selectedText, number_of_highlighted_words) {
  fetch("https://immersive-server.netlify.app/.netlify/functions/translateGPT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: selectedText })
  })
  .then(res => res.json())
  .then(data => {
    const translation = JSON.parse(data.translated);

    let oldPopup = document.getElementById("choicePopup");
    if (oldPopup) oldPopup.remove();

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
    choicePopup.style.left = `${rect.right - 200  + window.scrollX}px`; // Adjust X position
    choicePopup.style.background = "white";
    choicePopup.style.border = "1px solid #D9D9D9";
    choicePopup.style.borderRadius = "8px";
    choicePopup.style.padding = "8px 12px";
    choicePopup.style.zIndex = "9998";
    choicePopup.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";

    // Add buttons
    choicePopup.innerHTML = `
      <div id="choicePopup">
        <div style="display: flex; justify-content: space-between;">
          <p style="color: #555555; margin: 4px 0px 8px 0px">Translation</p>
          <button class="closePopup">X</button>
        </div>
        <hr>
        <div style="margin:0px; padding:0px;${number_of_highlighted_words > 1 ? "display: none" : ""}">
          <p class="choice-text"><span style="color: grey;">${translation.article ? translation.article : ""}</span> ${selectedText} (${translation.word_type}) <span style="color: grey;">${translation.infinitive ? "--> Infinitive: " + translation.infinitive : ""}</span></p>
        </div>
        <p class="choice-text">${translation.translation}</p>
        <div id="choice-popup-styling" class="three" style="${number_of_highlighted_words === 1 ? "width: 100px" : ""}">
          <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
          <div style="margin:0px; height: 22px; padding:0px;${number_of_highlighted_words > 1 ? "display: none" : ""}">
            <img id="btn-vocab" src="${chrome.runtime.getURL("pngs/vocab-icon.png")}" alt="add to vocabulary list" title="add to vocabulary list" class="context-icons">
            <div id="toast">
              Saved!
            </div>
          </div>
          <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="copy" title="copy" class="context-icons">
          <div id="toast-copy">
            Saved to clipboard!
          </div>
          <img id="btn-simple" src="${chrome.runtime.getURL("pngs/simple-icon.png")}" alt="simplify" title="simplify" class="context-icons">
        </div>
      </div>
    `;

    // Append choicePopup to body
    document.body.appendChild(choicePopup);

    setTimeout(() => {
      document.getElementById("btn-copy").addEventListener("click", () => {
        navigator.clipboard.writeText(translation.translation);
        const toast = document.getElementById('toast-copy');
        toast.style.visibility = "visible";
        setTimeout(() => {
          toast.style.visibility = "hidden";
        }, 1000);
      });
      document.getElementById("btn-vocab").addEventListener("click", () => {
        const germanWord = translation.article ? `${translation.article} ${selectedText}` : selectedText
        vocabulary_list.push([germanWord, translation.translation]);
        chrome.storage.local.set({ vocabulary_list });
        const toast = document.getElementById('toast');
        toast.style.visibility = "visible";
        setTimeout(() => {
          toast.style.visibility = "hidden";
        }, 1000);
      });
      document.getElementById("btn-simple").addEventListener("click", () => {
        chrome.storage.local.get("language_level" , (data) => {
          const level = data.language_level || 'A2';
          simplify(selectedText, level, number_of_highlighted_words);
        })
      });
      document.getElementById("btn-audio").addEventListener("click", () => {
        pronounce(selectedText, 'de');
      });
      document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
      });
    }, 100);
  });
}

function translate_from_simplified(selectedText, number_of_highlighted_words) {
  fetch("https://immersive-server.netlify.app/.netlify/functions/translateGPT", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: selectedText })
  })
  .then(res => res.json())
  .then(data => {
    const translation = JSON.parse(data.translated);
    selectedText.split(/\s+/).length;
    let oldPopup = document.getElementById("choicePopup");
    const number_of_words = selectedText.split(/\s+/).length
    let existingPopup = document.getElementById("translate-from-simplified");
    if (existingPopup) {
      existingPopup.remove();
    }
    // Add buttons
    const additionalHTML = `
      <div id="translate-from-simplified">
        <div style="display: flex; justify-content: space-between;">
          <p style="color: #555555; margin: 4px 0px 8px 0px">Translation</p>
        </div>
        <hr>
        <div style="margin:0px; padding:0px;${number_of_highlighted_words > 1 ? "display: none" : ""}">
          <p class="choice-text"><span style="color: grey;">${translation.article ? translation.article : ""}</span> ${selectedText} (${translation.word_type}) <span style="color: grey;">${translation.infinitive ? "--> Infinitive: " + translation.infinitive : ""}</span></p>
        </div>
        <p class="choice-text">${translation.translation}</p>
        <div id="choice-popup-styling" class="three" style="${number_of_words > 1 ? "width:50px" : ""}">
          <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
          <div style="margin:0px; height: 22px; padding:0px;${number_of_highlighted_words > 1 ? "display: none" : ""}">
            <img id="btn-vocab" src="${chrome.runtime.getURL("pngs/vocab-icon.png")}" alt="add to vocabulary list" title="add to vocabulary list" class="context-icons">
            <div id="toast">
              Saved!
            </div>
          </div>
          <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="copy" title="copy" class="context-icons">
          <div id="toast-copy">
            Saved to clipboard!
          </div>
        </div>
      </div>
    `;
    // Append choicePopup to body
    oldPopup.insertAdjacentHTML('beforeend', additionalHTML)

    setTimeout(() => {
      document.getElementById("btn-copy").addEventListener("click", () => {
        navigator.clipboard.writeText(translation);
        const toast = document.getElementById('toast-copy');
        toast.style.visibility = "visible";
        setTimeout(() => {
          toast.style.visibility = "hidden";
        }, 1000);
      });
      document.getElementById("btn-vocab").addEventListener("click", () => {
        const germanWord = translation.article ? `${translation.article} ${selectedText}` : selectedText
        vocabulary_list.push([germanWord, translation.translation]);
        chrome.storage.local.set({ vocabulary_list });
        const toast = document.getElementById('toast');
        toast.style.visibility = "visible";
        setTimeout(() => {
          toast.style.visibility = "hidden";
        }, 1000);
      });
      document.getElementById("btn-audio").addEventListener("click", (event) => {
        pronounce(translation, 'en');
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
