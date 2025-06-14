window.addEventListener("message", (event) => {
  if (event.origin !== "https://immersive-server.netlify.app") return;

  if (event.data.type === "SUPABASE_TOKEN") {
    const token = event.data.token;
    chrome.storage.local.set({
      supabaseToken: token,
    });
  }
  if (event.data.type === "REFRESH_TOKEN") {
    const refreshToken = event.data.refresh_token
    chrome.storage.local.set({
      refreshToken: refreshToken,
    });
  }
  if (event.data.type === "EXPIRATION") {
    const expires_at = event.data.expires_at
    chrome.storage.local.set({
      expires_at: expires_at,
    });
  }
});

if (!window.myExtensionActive) {
  window.myExtensionActive = true;

  window.cleanupMyExtension = () => {
    document.removeEventListener("mouseup", window.myExtensionMouseupHandler)
    window.myExtensionActive = false;
    // window.myExtensionMouseupHandler = null;
    window.lastSelectedText = null;

    document.getElementById("choicePopup")?.remove();
    document.getElementById("quizPopup")?.remove();
  };

  let lastSelectedText = "";
  let isSpeaking = false;


  window.myExtensionMouseupHandler = function (event) {
    const isInsidePopup = event.target.closest("#choicePopup") || event.target.closest("#quizPopup");
    if (isInsidePopup) return;

    let selectedText = window.getSelection().toString().trim();
    if (selectedText && selectedText !== window.lastSelectedText) {
      window.lastSelectedText = selectedText;
      const number_of_highlighted_words = selectedText.split(/\s+/).length;
      createPopup(selectedText, number_of_highlighted_words);
    }
  };

  document.addEventListener('mouseup', window.myExtensionMouseupHandler);

  // document.addEventListener('mouseup', function (event) {
  //   const isInsidePopup = event.target.closest("#choicePopup") || event.target.closest(".simplified-popup");
  //   if (isInsidePopup) return;
  //   let selectedText = window.getSelection().toString().trim();
  //   if (selectedText && selectedText !== lastSelectedText) {
  //     //  && !document.getElementById("customPopup")
  //     lastSelectedText = selectedText;
  //     const number_of_highlighted_words = selectedText.split(/\s+/).length;
  //     createPopup(lastSelectedText, number_of_highlighted_words);
  //   }
  // });

  function createPopup(selectedText, number_of_highlighted_words) {
    chrome.storage.local.get(["supabaseToken", "expires_at"] , async ({ supabaseToken, expires_at }) => {
      // Check if popup already exists, to prevent duplicates
      let existingPopup = document.getElementById("customPopup");
      if (existingPopup) {
        existingPopup.remove();
      }
      let choicePopup = document.getElementById("choicePopup");
      if (choicePopup) {
        choicePopup.remove();
      }

      let popup = document.createElement("div");
      popup.id = "customPopup";

      // Get selection coordinates
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      popup.style.position = "absolute";
      popup.style.fontFamily = "'Poppins', sans-serif";

      popup.style.width = "138px";
      const padding = 10;
      const desiredLeft = rect.right - 138;
      const maxLeft = window.innerWidth - 138 - padding;
      const adjustedLeft = Math.max(padding, Math.min(desiredLeft + window.scrollX, maxLeft));

      popup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
      popup.style.left = `${adjustedLeft}px`; // Adjust X position
      popup.style.background = "white";
      popup.style.color = "white";
      popup.style.border = "1px solid #D9D9D9";
      popup.style.borderRadius = "8px";
      popup.style.padding = "5px 9px";
      popup.style.zIndex = "9999";
      popup.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";

      const isExpired = expires_at && Date.now() / 1000 > expires_at;

      if (!supabaseToken || isExpired) {
        popup.innerHTML = `
          <div id="logged-out">
            <h4>You're logged out</h4>
            <button id="loginBtn" style="">Log In</button>
          </div>
        `;
      } else {
        popup.innerHTML = `
          <div id="popup-styling" style="display: flex; justify-content: space-between;">
            <img id="btn2" src="${chrome.runtime.getURL("pngs/simple-icon.png")}" style="height:24px; margin-top:1.5px;" alt="simplify" title="simplify" class="context-icons">
            <img id="btn1" src="${chrome.runtime.getURL("pngs/translate-icon.png")}" alt="translate" title="translate" class="context-icons">
            <img id="btn3" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
            <button class="closePopup" style="padding-right: 3px; font-weight:300; margin-bottom: 0px;">X</button>
          </div>
        `;
      }

      // Append popup to body
      document.body.appendChild(popup);

      // ✅ Ensure Event Listeners Work
      setTimeout(() => {
        document.getElementById("loginBtn")?.addEventListener("click", () => {
          const existingPopup = document.getElementById("customPopup");
          existingPopup.remove();
          chrome.runtime.sendMessage({ type: "OPEN_LOGIN_POPUP" });
        });
        document.getElementById("btn1")?.addEventListener("click", () => {
          translateGPT(selectedText, number_of_highlighted_words);
          // translate(selectedText, number_of_highlighted_words);
          popup.remove();
        });
        document.getElementById("btn2")?.addEventListener("click", () => {
          chrome.storage.local.get("language_level" , (data) => {
            const level = data.language_level || 'A2';
            simplify(selectedText, level, number_of_highlighted_words);
            popup.remove();
          })
        });
        document.getElementById("btn3")?.addEventListener("click", (event) => {
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
    })
  }

  function simplify(selectedText, level, number_of_highlighted_words) {
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
    choicePopup.style.fontSize= "18px";

    const padding = 10;
    const desiredLeft = rect.right - 305;
    const maxLeft = window.innerWidth - 305 - padding;
    const adjustedLeft = Math.max(padding, Math.min(desiredLeft + window.scrollX, maxLeft));

    choicePopup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
    choicePopup.style.left = `${adjustedLeft}px`; // Adjust X position
    choicePopup.style.background = "white";
    choicePopup.style.border = "1px solid #D9D9D9";
    choicePopup.style.borderRadius = "8px";
    choicePopup.style.padding = "8px 12px";
    choicePopup.style.zIndex = "9000";
    choicePopup.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
    choicePopup.innerHTML = `
      <div id="choicePopup" style="padding: 2px 0px 2px 6px;">
        <div style="display: flex; justify-content: space-between;">
          <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Simplified content</p>
          <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
        </div>
        <hr>
        <div style="display: flex; justify-content: center; align-items: center; height: 80px;">
          <div class="loader"></div>
        </div>
      </div>
    `;

    document.body.appendChild(choicePopup);

    setTimeout(() => {
      document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
        cleanup();
      });
    }, 100);


    chrome.storage.local.get("supabaseToken" , async ({ supabaseToken }) =>  {
      if (!supabaseToken) {
        console.log('no token')
        return;
      }

      const taskToDo = number_of_highlighted_words <= 3 ? 'define' : 'simplify';
      const makeRequest = async (token) => {
        try {
          const res = await fetch(`https://immersive-server.netlify.app/.netlify/functions/${taskToDo}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, },
            body: JSON.stringify({ text: selectedText, level })
          });
          if (!res.ok) {
            // If status is not ok, parse the error
            const errorData = await res.json();
            console.error("Request failed:", errorData.error);
            throw new Error(errorData.error || "Request failed");
          }
          const data = await res.json();
          return data;
        } catch (error) {
          console.error("Fetch error:", error.message);
          // Optional: Display the error message to the user
          alert(`Error: ${error.message}`);
          return null;
        }
      };

      try {
        const data = await makeRequest(supabaseToken);
        if (data && data.error) {
          // Handling custom error messages
          alert(`Server Error: ${data.error}`);
        }

        if (data.simplified === "not german") {
          choicePopup.innerHTML = `
            <div id="choicePopup">
              <div style="display: flex; justify-content: space-between;">
                <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Error</p>
                <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
              </div>
              <hr>
              <p class="choice-text">Currently only available for simplifying from German text.</p>
            </div>
          `;
          setTimeout(() => {
            document.querySelector(".closePopup").addEventListener("click", () => {
              choicePopup.remove();
              cleanup();
            });
          }, 100);
        } else {
          // const simplified = taskToDo === "define" ? JSON.parse(data.simplified) : data.simplified;
          const simplified = data.simplified;
          const synonyms = simplified.synonyms ? `<strong><p style="margin-bottom: 5px;">Synonyme</p></strong><ul style="list-style-type:disc; margin-bottom: 20px;"> ${simplified.synonyms.map(synonym => `<li>${synonym}</li>`).join('')}</ul>` : ""
          const examples = simplified.examples ? `<strong><p style="margin-bottom: 5px;">Beispiele</p></strong><ul style="list-style-type:disc; margin-bottom: 20px;"> ${simplified.examples.map(synonym => `<li>${synonym}</li>`).join('')}</ul>` : ""
          innerDefine =  `<div id="choicePopup" style="padding: 2px 6px;">
              <div style="display: flex; justify-content: space-between;">
                <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Simplified content</p>
                <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
              </div>
              <hr>
              <p class="choice-text" style="margin-bottom: 0px;">${simplified.article ? simplified.article : ""} <strong>${selectedText}</strong> (${simplified.word_type})</p>
              <p class="choice-text" style="margin-bottom: 20px; margin-top: 2px;">${simplified.plural ? "Plural: " + simplified.plural : ""}</p>
              <strong><p style="margin-bottom: 5px;">Bedeutung</p></strong>
              <p class="choice-text" style="margin-bottom: 20px; margin-top:0px;">${simplified.meaning}</p>
              ${synonyms ? synonyms : ""}
              ${examples ? examples : ""}
              <div id="choice-popup-styling" class="four" style="display: flex; justify-content: space-between;">
                <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
                <img id="btn-translate" src="${chrome.runtime.getURL("pngs/translate-icon.png")}" alt="translate" title="translate" class="context-icons">
                <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="copy" title="copy" class="context-icons">
                <div id="toast-copy">
                  Saved to clipboard!
                </div>
                <img id="btn-vocab" src="${chrome.runtime.getURL("pngs/star.png")}" style="height: 20px; margin: 0px 0px 2px 0px;" alt="add to vocabulary list" title="add to vocabulary list" class="context-icons">
                <div id="toast">
                  Saved!
                </div>
              </div>
            </div>
          `;
          innerSimplify = `<div id="choicePopup">
              <div style="display: flex; justify-content: space-between;">
                <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Simplified content</p>
                <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
              </div>
              <hr>
              <p class="choice-text">${simplified}</p>

              <p class="instruction-text">Double-click on any word in the text to get its individual translation</p>
              <div id="choice-popup-styling" class="three" style="display: flex; justify-content: space-between;">
                <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
                <img id="btn-translate" src="${chrome.runtime.getURL("pngs/translate-icon.png")}" alt="translate" title="translate" class="context-icons">
                <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="copy" title="copy" class="context-icons">
                <div id="toast-copy">
                  Saved to clipboard!
                </div>
              </div>
            </div>
          `;
          // Add buttons
          if (taskToDo === "define") {
            choicePopup.innerHTML = innerDefine
          } else {
            choicePopup.innerHTML = innerSimplify
          }
          setTimeout(() => {
            document.getElementById("btn-copy").addEventListener("click", () => {
              navigator.clipboard.writeText(simplified);
              const toast = document.getElementById('toast-copy');
              toast.style.visibility = "visible";
              setTimeout(() => {
                toast.style.visibility = "hidden";
              }, 1000);
            });
            document.getElementById("btn-vocab")?.addEventListener("click", () => {
              const germanWord = simplified.article ? `${simplified.article} ${selectedText}` : selectedText
              save_vocabulary(germanWord, simplified.translation, simplified.word_type)
              const toast = document.getElementById('toast');
              toast.style.visibility = "visible";
              setTimeout(() => {
                toast.style.visibility = "hidden";
              }, 1000);
            });
            document.getElementById("btn-translate").addEventListener("click", () => {
              const text_to_be_translated = taskToDo === "define" ? selectedText : simplified
              translate_from_simplified(text_to_be_translated, number_of_highlighted_words);
            });
            document.getElementById("choicePopup").addEventListener("mouseup", function (event) {
              const isInsidePopup = event.target.closest("#choice-popup-styling");
              if (isInsidePopup) return;
              let selectedText = window.getSelection().toString().trim();
              let number_highlighted_words = selectedText.split(/\s+/).length;
              if (selectedText && selectedText !== "") {
                translate_from_simplified(selectedText, number_highlighted_words);
              }
            });
            document.getElementById("btn-audio").addEventListener("click", () => {
              const toBePronounced = taskToDo === "define" ? selectedText : simplified;
              pronounce(toBePronounced, 'de');
            });
            document.querySelector(".closePopup").addEventListener("click", () => {
              choicePopup.remove();
              cleanup();
            });
          }, 100);
          function cleanup() {
            document.removeEventListener("click", handleOutsideClick);
            window.removeEventListener("scroll", handleScroll());
          }

          function handleOutsideClick(event) {
            if (!choicePopup.contains(event.target)) {
              choicePopup.remove();
              cleanup();
            }
          }

          function handleScroll() {
            const popupRect = choicePopup.getBoundingClientRect();
            const isOutOfView =
              popupRect.bottom < 0 || popupRect.top > window.innerHeight;

            if (isOutOfView) {
              choicePopup.remove();
              cleanup();
            }
          }
          setTimeout(() => {
            document.addEventListener("click", handleOutsideClick);
          }, 0);
          window.addEventListener("scroll", handleScroll);
        }
      } catch (err) {
        choicePopup.innerHTML = `<div style="display: flex; justify-content: space-between;">
                                    <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Fetch failed</p>
                                    <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
                                  </div>
                                  <p>Please try again later.</p>
                                  <p>If the problem persists, copy this error and send it as feedback to Immersive:</p>
                                  <p>${err}</p>`
        setTimeout(() => {
          document.querySelector(".closePopup").addEventListener("click", () => {
            choicePopup.remove();
          });
        }, 100);
      }
    });
  }

  function translateGPT(selectedText, number_of_highlighted_words) {
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
    choicePopup.style.fontSize= "18px";

    const padding = 10;
    const desiredLeft = rect.right - 305;
    const maxLeft = window.innerWidth - 305 - padding;
    const adjustedLeft = Math.max(padding, Math.min(desiredLeft + window.scrollX, maxLeft));

    choicePopup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
    choicePopup.style.left = `${adjustedLeft}px`;
    choicePopup.style.background = "white";
    choicePopup.style.border = "1px solid #D9D9D9";
    choicePopup.style.borderRadius = "8px";
    choicePopup.style.padding = "8px 12px";
    choicePopup.style.zIndex = "9998";
    choicePopup.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";

    choicePopup.innerHTML = `
      <div id="choicePopup">
        <div style="display: flex; justify-content: space-between;">
          <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Translation</p>
          <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
        </div>
        <hr>
        <div style="display: flex; justify-content: center; align-items: center; height: 80px;">
          <div class="loader"></div>
        </div>
      </div>
    `;
    document.body.appendChild(choicePopup);

    setTimeout(() => {
      document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
        cleanup();
      });
    }, 100);

    chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
      if (!supabaseToken) {
        console.log('no token')
        return;
      }
      fetch("https://immersive-server.netlify.app/.netlify/functions/translateGPT", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
        body: JSON.stringify({ text: selectedText })
      })
      .then(res => res.json())
      .then(data => {
        if (data.translated === "not german") {
          choicePopup.innerHTML = `
            <div id="choicePopup">
              <div style="display: flex; justify-content: space-between;">
                <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Error</p>
                <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
              </div>
              <hr>
              <p class="choice-text">Currently only available for translating from German to English</p>
            </div>
          `;
          setTimeout(() => {
            document.querySelector(".closePopup").addEventListener("click", () => {
              choicePopup.remove();
              cleanup();
            });
          }, 100);
        } else {
          const translation = JSON.parse(data.translated);

          // Add buttons
          choicePopup.innerHTML = `
            <div id="choicePopup">
              <div style="display: flex; justify-content: space-between;">
                <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Translation</p>
                <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
              </div>
              <hr>
              <div style="margin:0px; padding:0px;${number_of_highlighted_words > 1 ? "display: none" : ""}">
                <p class="choice-text"><span style="color: grey;">${translation.article ? translation.article : ""}</span> ${selectedText} (${translation.word_type}) <span style="color: grey;">${translation.infinitive ? "--> Infinitive: " + translation.infinitive : ""}</span></p>
              </div>
              <p class="choice-text">${translation.translation}</p>
              <div id="choice-popup-styling" class="three" style="${number_of_highlighted_words === 1 ? "width: 110px" : ""}">
                <img id="btn-audio" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
                <img id="btn-simple" src="${chrome.runtime.getURL("pngs/simple-icon.png")}" style="height: 20px; margin: 2px 2px 1px 6px;" alt="simplify" title="simplify" class="context-icons">
                <img id="btn-copy" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="copy" title="copy" class="context-icons">
                <div id="toast-copy">
                  Saved to clipboard!
                </div>
                <img id="btn-vocab" src="${chrome.runtime.getURL("pngs/star.png")}" style="${number_of_highlighted_words > 1 ? "display: none;" : ""}height: 20px; margin: 0px 0px 2px 0px;" alt="add to vocabulary list" title="add to vocabulary list" class="context-icons">
                <div id="toast">
                  Saved!
                </div>
              </div>
            </div>
          `;
          setTimeout(() => {
            document.getElementById("btn-copy")?.addEventListener("click", () => {
              navigator.clipboard.writeText(translation.translation);
              const toast = document.getElementById('toast-copy');
              toast.style.visibility = "visible";
              setTimeout(() => {
                toast.style.visibility = "hidden";
              }, 1000);
            });
            document.getElementById("btn-vocab")?.addEventListener("click", () => {
              const germanWord = translation.article ? `${translation.article} ${selectedText}` : selectedText
              save_vocabulary(germanWord, translation.translation, translation.word_type)
              const toast = document.getElementById('toast');
              toast.style.visibility = "visible";
              setTimeout(() => {
                toast.style.visibility = "hidden";
              }, 1000);
            });
            document.getElementById("btn-simple")?.addEventListener("click", () => {
              chrome.storage.local.get("language_level" , (data) => {
                const level = data.language_level || 'A2';
                simplify(selectedText, level, number_of_highlighted_words);
              })
            });
            document.getElementById("btn-audio")?.addEventListener("click", () => {
              pronounce(selectedText, 'de');
            });
            document.querySelector(".closePopup").addEventListener("click", () => {
              choicePopup.remove();
              cleanup();
            });
          }, 100);
        }


        function cleanup() {
          document.removeEventListener("click", handleOutsideClick);
          window.removeEventListener("scroll", handleScroll());
        }

        function handleOutsideClick(event) {
          if (!choicePopup.contains(event.target)) {
            choicePopup.remove();
            cleanup();
          }
        }

        function handleScroll() {
          const popupRect = choicePopup.getBoundingClientRect();
          const isOutOfView =
            popupRect.bottom < 0 || popupRect.top > window.innerHeight;

          if (isOutOfView) {
            choicePopup.remove();
            cleanup();
          }
        }
        setTimeout(() => {
          document.addEventListener("click", handleOutsideClick);
        }, 0);
        window.addEventListener("scroll", handleScroll);
      })
      .catch((err) => {
        choicePopup.innerHTML = `<div style="display: flex; justify-content: space-between;">
                                      <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Fetch failed</p>
                                      <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
                                    </div>
                                    <p>Please try again later.</p>
                                  <p>If the problem persists, copy this error and send it as feedback to Immersive:</p>
                                  <p>${err}</p>`
        setTimeout(() => {
        document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
        });
        }, 100);
      });
    });
  }

  function translate_from_simplified(selectedText, number_of_highlighted_words) {
    let oldPopup = document.getElementById("choicePopup");
    let existingPopup = document.getElementById("translate-from-simplified");
    if (existingPopup) {
      existingPopup.remove();
    }
    const additionalHTML = `
      <div id="translate-from-simplified">
        <div style="display: flex; justify-content: space-between;">
          <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Translation</p>
          <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
        </div>
        <hr>
        <div style="display: flex; justify-content: center; align-items: center; height: 80px;">
          <div class="loader"></div>
        </div>
      </div>
    `;
    oldPopup.insertAdjacentHTML('beforeend', additionalHTML);

    setTimeout(() => {
      document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
        cleanup();
      });
    }, 100);
    chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
      if (!supabaseToken) {
        console.log('no token')
        return;
      }
      fetch("https://immersive-server.netlify.app/.netlify/functions/translateGPT", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
        body: JSON.stringify({ text: selectedText })
      })
      .then(res => res.json())
      .then(data => {
        const translation = JSON.parse(data.translated);
        const number_of_words = selectedText.split(/\s+/).length;
        let existingPopup = document.getElementById("translate-from-simplified");
        if (existingPopup) {
          existingPopup.remove();
        }
        // Add buttons
        const additionalHTML = `
          <div id="translate-from-simplified">
            <div style="display: flex; justify-content: space-between;">
              <p style="color: #555555; margin: 4px 0px 8px 0px; font-weight: 300;">Translation</p>
            </div>
            <hr>
            <div style="margin:0px; padding:0px;${number_of_highlighted_words > 1 ? "display: none" : ""}">
              <p class="choice-text"><span style="color: grey;">${translation.article ? translation.article : ""}</span> ${selectedText} (${translation.word_type}) <span style="color: grey;">${translation.infinitive ? "--> Infinitive: " + translation.infinitive : ""}</span></p>
            </div>
            <p class="choice-text">${translation.translation}</p>
            <div id="choice-popup-styling" class="three" style="${number_of_words > 1 ? "width:50px" : ""}">
              <img style="${number_of_words < 2 ? "" : "display:none;"}" id="btn-audio-after" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
              <img id="btn-copy-after" src="${chrome.runtime.getURL("pngs/copy-icon.png")}" alt="copy" title="copy" class="context-icons">
              <div id="toast-copy-after">
                Saved to clipboard!
              </div>
              <img id="btn-vocab-after" src="${chrome.runtime.getURL("pngs/star.png")}" style="${number_of_highlighted_words > 1 ? "display: none;" : ""}height: 20px; margin: 0px 0px 2px 0px;" alt="add to vocabulary list" title="add to vocabulary list" class="context-icons">
              <div id="toast-after">
                Saved!
              </div>
            </div>
          </div>
        `;
        // Append choicePopup to body
        oldPopup.insertAdjacentHTML('beforeend', additionalHTML)

        setTimeout(() => {
          document.getElementById("btn-copy-after")?.addEventListener("click", () => {
            navigator.clipboard.writeText(translation);
            const toast = document.getElementById('toast-copy-after');
            toast.style.visibility = "visible";
            setTimeout(() => {
              toast.style.visibility = "hidden";
            }, 1000);
          });
          document.getElementById("btn-vocab-after")?.addEventListener("click", () => {
            const germanWord = translation.article ? `${translation.article} ${selectedText}` : selectedText
            save_vocabulary(germanWord, translation.translation, translation.word_type)
            const toast = document.getElementById('toast-after');
            toast.style.visibility = "visible";
            setTimeout(() => {
              toast.style.visibility = "hidden";
            }, 1000);
          });
          document.getElementById("btn-audio-after")?.addEventListener("click", (event) => {
            pronounce(selectedText, 'de');
          });
        }, 100);
      })
      .catch((err) => {
        choicePopup.innerHTML = `<div style="display: flex; justify-content: space-between;">
                                      <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Fetch failed</p>
                                      <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
                                    </div>
                                    <p>Please try again later.</p>
                                  <p>If the problem persists, copy this error and send it as feedback to Immersive:</p>
                                  <p>${err}</p>`
        setTimeout(() => {
        document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
        });
        }, 100);
      });
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

  function save_vocabulary(original_word, translated_word, word_type) {
    chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
      if (!supabaseToken) {
        console.log('no token')
        return;
      }
      fetch(`https://immersive-server.netlify.app/.netlify/functions/save_vocab`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
        body: JSON.stringify({ original_word, translated_word, word_type })
      })
      .then(res => res.json())
      .then(data => {
        console.log(data)
      })
      .catch((err) => {
        choicePopup.innerHTML = `<div style="display: flex; justify-content: space-between;">
                                      <p style="color: #555555; margin: 4px 0px 0px 0px; font-weight: 300;">Fetch failed</p>
                                      <button class="closePopup" style="font-weight:300; margin-bottom: 0px;">X</button>
                                    </div>
                                    <p>Please try again later.</p>
                                  <p>If the problem persists, copy this error and send it as feedback to Immersive:</p>
                                  <p>${err}</p>`
        setTimeout(() => {
        document.querySelector(".closePopup").addEventListener("click", () => {
        choicePopup.remove();
        });
        }, 100);
      });
    });
  }
}
