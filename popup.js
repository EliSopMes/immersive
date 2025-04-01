 document.addEventListener('DOMContentLoaded', () => {
   document.getElementById("translateBtn").addEventListener("click", async () => {
      let text = document.getElementById("inputText").value;
      console.log(text)
      if (!text) return;

      chrome.storage.local.get("DEEPL_API_KEY", async (data) => {
        const apiKey = data.DEEPL_API_KEY;
        if (!apiKey) {
         console.error("Deeply API key not found");
         return;
        } else {
          console.log(apiKey)
          const url = "https://api-free.deepl.com/v2/translate";

          const response = await fetch(url, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `DeepL-Auth-Key ${apiKey}`
              },
              body: JSON.stringify({
                  text: [text],
                  target_lang: "EN",
                  source_lang: "DE"
              })
          });
          console.log(response);
          const data = await response.json();
          if (data.translations) {
            document.getElementById("output").textContent = data.translations[0].text;
            console.log(data.translations[0]);
          } else {
            console.log('oh noooooo');
          }
        }
      })
    });

    document.getElementById('listBtn').addEventListener("click", () => {
      chrome.storage.local.get(["vocabulary_list", "defintion_list"], (data) => {
        console.log(data.vocabulary_list);
        let vocabList = data.vocabulary_list || [];
        let definitionList = data.defintion_list || [];
        document.getElementById("vocabList").textContent = "Your Vocabulary:\n" + vocabList.map(v => `${v[0]} -> ${v[1]}`).join("\n")
        const exportBtn = document.getElementById('exportBtn')
        if (exportBtn.style.display === "none" && vocabList.length > 0) {
          exportBtn.style.display = 'block'
          exportBtn.addEventListener('click', () => {
            console.log("reached download");
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
        } else {
          exportBtn.style.display = 'none'
        }
      });
    })

 })
