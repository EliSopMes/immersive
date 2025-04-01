let vocabulary_list = []
let defintion_list = []

document.addEventListener('mouseup', function () {
  let existingPopup = document.getElementById("text-action-popup");
  let isSpeaking = false;
  if (existingPopup) {
    existingPopup.remove();
  }

  const selectedText = window.getSelection().toString().trim();

  if (!selectedText) {
    console.log('No text found');
    return;
  }

  console.log(selectedText);


  // const returns = chrome.runtime.sendMessage({ action: "openPopup", text: selectedText })
  // console.log(returns)

  const popup = document.createElement("div");
  popup.id = "text-action-popup";

  // Get selection coordinates
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (selectedText.includes(" ")) {
    chrome.runtime.sendMessage({
      action: 'simplify',
      text: selectedText
    }, (response) => {
      console.log(response)
      if (response.simplified) {
        // document.getElementById('text-action-result').textContent = response.translation;
        console.log(response.simplified);
        const simplified = response.simplified;

        defintion_list.push([selectedText, simplified]);
        chrome.storage.local.set({ defintion_list });

        popup.innerHTML = `
            <p id="text-action-result">Simplified: ${simplified}</p>
        `;
      } else {
        document.getElementById('text-action-result').textContent = 'Translation failed';
      }
    });
  } else {
    chrome.runtime.sendMessage({
      action: 'translate',
      text: selectedText
    }, (response) => {
      if (response.translation) {
        // document.getElementById('text-action-result').textContent = response.translation;
        console.log(response.translation);
        const translation = response.translation;

        vocabulary_list.push([selectedText, translation]);
        chrome.storage.local.set({ vocabulary_list });

        popup.innerHTML = `
            <p id="text-action-result">Translated: ${translation}</p>
        `;
      } else {
        document.getElementById('text-action-result').textContent = 'Translation failed';
      }
    });
  }


  // Position the popup near the selected text
  popup.style.position = "absolute";
  popup.style.top = `${window.scrollY + rect.bottom + 5}px`; // Adjust Y position
  popup.style.left = `${rect.right + window.scrollX}px`; // Adjust X position

    // Append to the document body
  document.body.appendChild(popup);
  const utterance = new SpeechSynthesisUtterance(selectedText);
  utterance.lang = "de"; // Set language code (e.g., "de" for German, "en" for English)
  window.speechSynthesis.speak(utterance);

  // document.getElementById('simplify-btn').addEventListener('click', () => {
  //   document.getElementById('text-action-result').textContent = 'Simplification coming soon!';
  //   chrome.runtime.sendMessage({
  //     action: 'simplify',
  //     text: selectedText
  //   }, (response) => {
  //     console.log(response)
  //     if (response.simplified) {
  //       // document.getElementById('text-action-result').textContent = response.translation;
  //       console.log(response.simplified);
  //       const simplified = response.simplified;

  //       defintion_list.push([selectedText, simplified]);
  //       chrome.storage.local.set({ defintion_list });

  //       popup.innerHTML = `
  //           <p id="text-action-result">Simplified: ${simplified}</p>
  //       `;
  //     } else {
  //       document.getElementById('text-action-result').textContent = 'Translation failed';
  //     }
  //   });
  // });
});
