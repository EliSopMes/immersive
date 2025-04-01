// document.addEventListener('mouseup', function () {
//   let existingPopup = document.getElementById("text-action-popup");
//   let isSpeaking = false;
//   if (existingPopup) {
//     existingPopup.remove();
//   }

//   const selectedText = window.getSelection().toString().trim();

//   if (!selectedText) {
//     console.log('No text found');
//     return;
//   }

//   console.log(selectedText);

//   const popup = document.createElement("div");
//   popup.id = "text-action-popup";

//   // Get selection coordinates
//   const selection = window.getSelection();
//   const range = selection.getRangeAt(0);
//   const rect = range.getBoundingClientRect();

//   chrome.runtime.sendMessage({
//     action: 'translate',
//     text: selectedText
//   }, (response) => {
//     if (response.translation) {
//       // document.getElementById('text-action-result').textContent = response.translation;
//       console.log(response.translation);
//       const translation = response.translation;

//       vocabulary_list.push([selectedText, translation]);
//       chrome.storage.local.set({ vocabulary_list });

//       // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//       //   if (message.action === "fetch_vocab") {
//       //     chrome.storage.local.set({ vocabulary_list }); // Save to storage
//       //     console.log("📌 Vocabulary saved:", vocabulary_list);
//       //     sendResponse({ vocabulary: vocabulary_list });
//       //   } else {
//       //     sendResponse({ message: "fail" });
//       //   }
//       // });
//       popup.innerHTML = `
//           <p id="text-action-result">Translated: ${translation}</p>
//       `;
//     } else {
//       document.getElementById('text-action-result').textContent = 'Translation failed';
//     }
//   });

//   // Position the popup near the selected text
//   popup.style.position = "absolute";
//   popup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
//   popup.style.left = `${rect.right + window.scrollX}px`; // Adjust X position

//     // Append to the document body
//   document.body.appendChild(popup);
//   const utterance = new SpeechSynthesisUtterance(selectedText);
//   utterance.lang = "de"; // Set language code (e.g., "de" for German, "en" for English)
//   window.speechSynthesis.speak(utterance);

//   document.getElementById('simplify-btn').addEventListener('click', () => {
//     document.getElementById('text-action-result').textContent = 'Simplification coming soon!';
//   });
// });

//   document.getElementById("translate").addEventListener("click", () => {
//     console.log("inside translate event listener")
//     //  chrome.storage.local.get("DEEPL_API_KEY", async (data) => {
//     //    const apiKey = data.DEEPL_API_KEY;
//     //    if (!apiKey) {
//     //     console.error("Deeply API key not found");
//     //     return;
//     //    } else {
//     //      console.log(apiKey)
//     //      const url = "https://api-free.deepl.com/v2/translate";

//     //      const response = await fetch(url, {
//     //          method: "POST",
//     //          headers: {
//     //              "Content-Type": "application/json",
//     //              "Authorization": `DeepL-Auth-Key ${apiKey}`
//     //          },
//     //          body: JSON.stringify({
//     //              text: [text],
//     //              target_lang: "EN",
//     //              source_lang: "DE"
//     //          })
//     //      });
//     //      console.log(response);
//     //      const data = await response.json();
//     //      if (data.translations) {
//     //        document.getElementById("output").textContent = data.translations[0].text;
//     //        console.log(data.translations[0]);
//     //      } else {
//     //        console.log('oh noooooo');
//     //      }
//     //    }
//     //  })
//    });

//    document.getElementById('listBtn').addEventListener("click", () => {
//      chrome.storage.local.get("vocabulary_list", (data) => {
//        console.log(data.vocabulary_list);
//        let vocabList = data.vocabulary_list || [];
//        document.getElementById("vocabList").textContent = "Your Vocabulary:\n" + vocabList.map(v => `${v[0]} -> ${v[1]}`).join("\n")
//        const exportBtn = document.getElementById('exportBtn')
//        if (exportBtn.style.display === "none" && vocabList.length > 0) {
//          exportBtn.style.display = 'block'
//        } else {
//          exportBtn.style.display = 'none'
//        }
//      });
//    })

const urlParams = new URLSearchParams(window.location.search);
const selectedText = urlParams.get("text");

if (selectedText) {
  document.getElementById("selectedWord").textContent = selectedText;
}
