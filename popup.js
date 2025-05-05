let isSpeaking = false;

 document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.accordion .title').forEach(title => {
      title.addEventListener('click', () => {
        const item = title.parentElement;
        const content = item.querySelector('.content');
        item.classList.toggle('open');

        if (item.querySelector('#vocab-div') && item.classList.contains('open')) {
          console.log("hello")
          renderVocabList();
        }
      });
    });

  //  document.getElementById("translateBtn").addEventListener("click", async () => {
  //     let text = document.getElementById("inputText").value;
  //     if (!text) return;
  //     fetch("https://immersive-server.netlify.app/.netlify/functions/translate", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ text: text })
  //     })
  //     .then(res => res.json())
  //     .then(data => {
  //       const translation = data.translated;
  //       if (translation) {
  //         document.getElementById("output").textContent = translation;
  //         chrome.storage.local.get("vocabulary_list", (data) => {
  //           let vocabulary_list = data.vocabulary_list || [];
  //           vocabulary_list.push([text, translation]);
  //           chrome.storage.local.set({ vocabulary_list });
  //         });
  //       } else {
  //         console.log('oh noooooo');
  //       }
  //     })
  //   });

    const levelSet = document.getElementById('levels')
    chrome.storage.local.get("language_level", (data) => {
      const level = data.language_level || 'A2';
      if (level) {
        levelSet.value = level;
      }
    })

    const levelBtn = document.getElementById('level-btn')
    levelBtn.addEventListener("click", () => {
      chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
        if (!supabaseToken) {
          console.log('no token')
          return;
        }
        fetch("https://immersive-server.netlify.app/.netlify/functions/update_level", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
          body: JSON.stringify({ level: levelSet.value })
        })
        .then(res => res.json())
        .then(data => {
          console.log(data)
        })
        .catch((err) => {
          console.error("Fetch failed:", err);
        });
      })
      chrome.storage.local.set({ language_level: levelSet.value });
      const toast = document.getElementById('toast-icon');
      toast.style.visibility = "visible";
      setTimeout(() => {
        toast.style.visibility = "hidden";
      }, 1000);
    })

    const feedbackBtn = document.getElementById('feedbackBtn')
    feedbackBtn.addEventListener("click", () => {
      const feedback = document.getElementById('inputText').value
      if (feedback === "") {
        return;
      }
      chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
        if (!supabaseToken) {
          console.log('no token')
          return;
        }

        fetch("https://immersive-server.netlify.app/.netlify/functions/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
          body: JSON.stringify({ feedback })
        })
        .then(res => res.json())
        .then(data => {
          console.log(data)
          const feedbackBox = document.getElementById('inputText')
          feedbackBox.value = ''
        })
        .catch((err) => {
          console.error("Fetch failed:", err);
        });
      })
      const toast = document.getElementById('toast-feedback');
      toast.style.visibility = "visible";
      setTimeout(() => {
        toast.style.visibility = "hidden";
      }, 1000);
    })

    function renderVocabList() {
      const vocabListHtml = document.getElementById("vocabList");

      chrome.storage.local.get("vocabulary_list", (data) => {
        let vocabList = data.vocabulary_list || [];
        if (vocabList.length > 0) {
          vocabListHtml.innerHTML = '';
          vocabList.forEach((vocab, index) => {
            const vocabListItem = `<div id='list-item-${index}' class="vocab-card">
                            <div style="display: flex; justify-content: space-between;">
                              <p>${vocab[0]}</p>
                              <div style="display: flex;">
                                <img height="16" id="btn-audio-${index}" style="margin-right: 10px;" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
                                <img height="14" id='vocab-${index}' src="${chrome.runtime.getURL("pngs/trash-can-solid.svg")}" alt="trash" title="delete" class="context-icons">
                              </div>
                            </div>
                            <p>${vocab[1]}</p>
                          </div>`
            vocabListHtml.insertAdjacentHTML("beforeend", vocabListItem)

            setTimeout(() => {
              const deleteButton = document.getElementById(`vocab-${index}`)
              deleteButton.addEventListener('click', (event) => {
                event.preventDefault();
                const index = vocabList.indexOf(vocab);
                vocabList.splice(index, 1);
                chrome.storage.local.set({ vocabulary_list: vocabList})
                const domElement = document.getElementById(`list-item-${index}`)
                domElement.remove();
              })
              const audioButton = document.getElementById(`btn-audio-${index}`)
              audioButton.addEventListener('click', (event) => {
                if (isSpeaking) {
                  window.speechSynthesis.cancel(); // Stop speech if already speaking
                  isSpeaking = false;
                } else {
                  const utterance = new SpeechSynthesisUtterance(vocab[0]);
                  utterance.lang = 'de'; // Set language code (e.g., "de" for German, "en" for English)
                  utterance.onend = () => {
                    isSpeaking = false; // Reset when done
                  };
                  window.speechSynthesis.speak(utterance);
                  isSpeaking = true;
                }
              })
            }, 0);
          })
        } else {
          vocabListHtml.innerHTML = "<div>You haven't saved any vocabulary yet.</div>";
        }
        vocabListHtml.insertAdjacentHTML("beforeend", `<button id="exportBtn">Export list</button>`)
      });
    }

    const practiceBtn = document.getElementById('practice')
    practiceBtn.addEventListener('click', () => {
      chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
        if (!supabaseToken) {
          console.log('no token')
          return;
        }
        fetch("https://immersive-server.netlify.app/.netlify/functions/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
          body: JSON.stringify({ message: 'user interested' })
        })
        .then(res => res.json())
        .then(data => {
          console.log(data)
        })
        .catch((err) => {
          console.error("Fetch failed:", err);
        });
      })
      document.getElementById('practice-interest').innerHTML = '<p>Launching soon ...</p>'
    })

    const vocabListDiv = document.getElementById('vocab-div')
    chrome.storage.local.get("vocabulary_list", (data) => {
      let vocabList = data.vocabulary_list || [];
      if (vocabListDiv.style.display === "none" && vocabList.length > 0) {
        vocabListDiv.style.display = 'block'
        const exportBtn = document.getElementById('exportBtn')
        if (exportBtn !== null) {
          exportBtn.addEventListener('click', () => {
            let textContent = "German\tEnglish\n";
            vocabList.forEach(([german, english]) => {
              textContent += `${german}\t${english}\n`;
            });

            // Create a Blob with the text data
            let blob = new Blob([textContent], { type: "text/plain" });

            // Create a download link
            let link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "vocabulary_list.txt"; // Name of the file

            // Trigger the download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

          })
        }
      } else {
        console.log("here was display none")
      }
    });
 })
