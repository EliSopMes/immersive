 document.addEventListener('DOMContentLoaded', () => {
   document.getElementById("translateBtn").addEventListener("click", async () => {
      let text = document.getElementById("inputText").value;
      if (!text) return;
      fetch("https://immersive-server.netlify.app/.netlify/functions/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
      })
      .then(res => res.json())
      .then(data => {
        const translation = data.translated;
        if (translation) {
          document.getElementById("output").textContent = translation;
          chrome.storage.local.get("vocabulary_list", (data) => {
            let vocabulary_list = data.vocabulary_list || [];
            vocabulary_list.push([text, translation]);
            chrome.storage.local.set({ vocabulary_list });
          });
        } else {
          console.log('oh noooooo');
        }
      })
    });

    const levelSet = document.getElementById('levels')
    chrome.storage.local.get("language_level", (data) => {
      const level = data.language_level || 'A2';
      if (level) {
        levelSet.value = level;
      }
    })

    const levelBtn = document.getElementById('level-btn')
    levelBtn.addEventListener("click", () => {
      chrome.storage.local.set({ language_level: levelSet.value });
      const toast = document.getElementById('toast-icon');
        toast.style.visibility = "visible";
        setTimeout(() => {
          toast.style.visibility = "hidden";
        }, 1000);
    })

    const listBtn = document.getElementById('listBtn')
    listBtn.addEventListener("click", () => {
      chrome.storage.local.get("vocabulary_list", (data) => {
        let vocabList = data.vocabulary_list || [];
        let vocabListHtml = document.getElementById("vocabList")
        vocabListHtml.innerHTML = ''
        vocabList.forEach((vocab, index) => {
          const vocabListItem = `<li id='list-item-${index}' style='display: flex;'>
            <p style="margin-right: 5px;">${vocab[0]} -> ${vocab[1]}</p>
            <button id='vocab-${index}'>X</button>
          </li>`
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
          }, 0);
        })
        vocabListHtml.insertAdjacentHTML("beforeend", `<button id="exportBtn">Export list</button>`)
        vocabListHtml.insertAdjacentHTML("afterbegin", `<h2>Your looked up vocabulary:</h2>`)
        // document.getElementById("vocabList").textContent = "Your Vocabulary:\n" + vocabList.map(v => `${v[0]} -> ${v[1]}`).join("\n")
      });
      listBtn.style.display = "none"
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
        vocabListDiv.style.display = 'none'
      }
    });
 })
