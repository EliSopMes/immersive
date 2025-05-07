let isSpeaking = false;

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(["supabaseToken", "expires_at"], async ({ supabaseToken, expires_at }) => {
    const root = document.getElementById("popup-root");

    const isExpired = expires_at && Date.now() / 1000 > expires_at;

    if (!supabaseToken || isExpired) {
      // Show login UI
      root.innerHTML = `
        <div id="logged-out">
          <h4>You're logged out</h4>
          <a href="https://immersive-server.netlify.app" target="_blank">Don't have an account yet?</a>
          <br><br>
          <p id="error-msg" style="display:none; color: red;"></p>
          <form id="login-form">
            <input type="email" id="email" placeholder="Email" required />
            <input type="password" id="password" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>
          <p>or</p>
          <a id="googleSignin" href="https://immersive-server.netlify.app/signin" target="_blank">Google Login</a>
          <br><br>
        </div>
      `;
      // <button id="googleLogin">Google Login</button>
      document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const res = await fetch("https://immersive-server.netlify.app/.netlify/functions/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: "login", email, password }),
        });
        const respone = await res.json();
        if (respone.error) {
          const errorMsg = document.getElementById('error-msg')
          errorMsg.innerText = respone.error
          errorMsg.style.display = 'block'
        } else {
          const { token, refreshToken, expiration } = respone;
          chrome.storage.local.set({ supabaseToken: token, refreshToken: refreshToken, expires_at: expiration }, () => {
            chrome.storage.local.get("winId", (data) => {
              const winId = data.winId || 'none';
              if (winId !== 'none') {
                chrome.windows.remove(winId);
                chrome.storage.local.remove("winId")
              }
            })
            // console.log(window.location)
            window.location.reload();
          });
        }
      });
      // document.getElementById("googleLogin").addEventListener("click", async (e) => {
      //   e.preventDefault();
      //   (async () => {
      //     const { createClient } = await import('https://esm.sh/@supabase/supabase-js');
      //     const supabase = createClient('https://gbxmuqfqwiehvsfwpouw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdieG11cWZxd2llaHZzZndwb3V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNTI3NTIsImV4cCI6MjA1OTkyODc1Mn0.J_aP5NqxbosSYiWpSujYt3tKskCTKJpqpvju_QZ9oQU";');

      //     // Proceed with your logic, e.g., supabase.auth.signInWithOAuth({ ... })
      //     const { data, error } = await supabase.auth.signInWithOAuth({
      //       provider: 'google',
      //       options: {
      //         redirectTo: `https://immersive-server.netlify.app/success.html`
      //       }
      //     });
      //     if (error) {
      //       console.error("Signup error:", error.message);
      //     }
      //   })();
      // });
    } else {
      // Show main authenticated UI
      root.innerHTML = `
           <div class="accordion">
            <div class="item">
              <div class="title">Language Level Setting</div>
              <div id="lng-level" class="content" style="display: flex; justify-content: space-between;">
                <p style="padding-top: 3px; font-size: 14px;">my level: </p>
                <select name="levels" id="levels">
                  <option value="A1">A1 (Beginner)</option>
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate)</option>
                  <option value="B2">B2 (Upper Intermediate)</option>
                  <option value="C1">C1 (Advanced)</option>
                </select>
                <button id="level-btn">save</button>
                <div id="toast-icon" style="
                  visibility: hidden;
                  background-color: #FFDB58;
                  color: black;
                  text-align: center;
                  border-radius: 4px;
                  padding: 4px 10px;
                  position: fixed;
                  z-index: 9999;
                  bottom: 85%;
                  left: 80%;
                  transform: translateX(-50%);
                  font-size: 14px;
                ">
                  Saved!
                </div>
              </div>
            </div>
            <div class="item">
              <div class="title">My Saved words</div>
              <div id="vocab-div" class="content">
                <div id="vocabList"></div>
              </div>
            </div>
            <div class="item">
              <div class="title">My practice</div>
              <div class="content" id="practice-interest">
                <button id="practice">Practice now</button>
              </div>
            </div>
            <div class="item">
              <div class="title">Care to Share More?</div>
              <div class="content" id="pin-popup">
                <textarea name="feedback" rows="5" id="inputText" placeholder="What would you like to tell us?" style="width: 250px;"></textarea>
                <br>
                <button id="feedbackBtn" style="margin-top: 5px; margin-left: 200px;">Send</button>
                <div id="toast-feedback" style="
                  visibility: hidden;
                  min-width: 60px;
                  background-color: black;
                  color: white;
                  text-align: center;
                  border-radius: 8px;
                  padding: 4px 8px;
                  position: fixed;
                  z-index: 9999;
                  bottom: 30%;
                  left: 50%;
                  transform: translateX(-50%);
                  font-size: 14px;
                "></div>
              </div>
            </div>
            <br>
            <a href="#" id="logoutBtn" style="color: black;">Log out</a>
            <br><br>
          </div>
      `;

      const logoutBtn = document.getElementById('logoutBtn')
      logoutBtn.addEventListener('click', () => {
        chrome.storage.local.remove(["supabaseToken","refreshToken", "expires_at"],
          function () {
            if (chrome.runtime.lastError) {
              console.error("Error removing tokens:", chrome.runtime.lastError);
            } else {
              console.log("Tokens removed successfully.");
            }
          }
        )
        root.innerHTML = `
          <div id="logged-out">
            <h4>You're logged out</h4>
            <form id="login-form">
              <input type="email" id="email" placeholder="Email" required />
              <input type="password" id="password" placeholder="Password" required />
              <button type="submit">Login</button>
            </form>
            <p>or</p>
            <a id="googleSignin" href="https://immersive-server.netlify.app/signin" target="_blank">Google Login</a>
            <br><br>
          </div>
        `;
      })
      document.querySelectorAll('.accordion .title').forEach(title => {
        title.addEventListener('click', () => {
          const item = title.parentElement;
          item.classList.toggle('open');

          if (item.querySelector('#vocab-div') && item.classList.contains('open')) {
            renderVocabList();
          }
        });
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
          const toast = document.getElementById('toast-feedback');
          toast.innerText = "Please write something."
          toast.style.visibility = "visible";
          setTimeout(() => {
            toast.style.visibility = "hidden";
          }, 3000);
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
        toast.innerText = "Sent! Thank you :)"
        toast.style.visibility = "visible";
        setTimeout(() => {
          toast.style.visibility = "hidden";
        }, 3000);
      })

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
    }
  });

    function renderVocabList() {
      const vocabListHtml = document.getElementById("vocabList");
      chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
        if (!supabaseToken) {
          console.log('no token')
          return;
        }
        fetch("https://immersive-server.netlify.app/.netlify/functions/fetch_vocab", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
          body: JSON.stringify({ message: 'user wants vocab' })
        })
        .then(res => res.json())
        .then(data => {
          console.log(data)
          let yourDate = new Date()
          let firstAfter = 0
          vocabListHtml.innerHTML = '';
          let vocabList = data.saved_words || [];

          if (vocabList.length > 0) {
            vocabList.forEach((vocab, index) => {
              if (vocab.created_at.split('T')[0] !==  yourDate.toISOString().split('T')[0]) {
                firstAfter += 1
              }
              const vocabListItem = `<div id='list-item-${index}' class="vocab-card">
                                            <div style="display: flex; justify-content: space-between;">
                                              <p>${vocab.original_word} (${vocab.word_type})</p>
                                              <div style="display: flex;">
                                                <img height="16" id="btn-audio-${index}" style="margin-right: 10px;" src="${chrome.runtime.getURL("pngs/audio-icon.png")}" alt="audio" title="audio" class="context-icons">
                                                <img height="14" id='vocab-${index}' src="${chrome.runtime.getURL("pngs/trash-can-solid.svg")}" alt="trash" title="delete" class="context-icons">
                                              </div>
                                            </div>
                                            <p>${vocab.translated_word}</p>
                                          </div>`

              if (vocab.created_at.split('T')[0] ===  yourDate.toISOString().split('T')[0] && index === 0) {
                vocabListHtml.insertAdjacentHTML("afterbegin", '<p id="today">Today</p>')
              } else if (vocab.created_at.split('T')[0] !==  yourDate.toISOString().split('T')[0] && firstAfter === 1) {
                vocabListHtml.insertAdjacentHTML("beforeend", '<p id="seven">Last 7 days</p>')
              }

              vocabListHtml.insertAdjacentHTML("beforeend", vocabListItem)

              setTimeout(() => {
                const deleteButton = document.getElementById(`vocab-${index}`)
                deleteButton.addEventListener('click', (event) => {
                  event.preventDefault();

                  const original_word = vocab.original_word
                  chrome.storage.local.get("supabaseToken" , ({ supabaseToken }) => {
                    if (!supabaseToken) {
                      console.log('no token')
                      return;
                    }
                    fetch(`https://immersive-server.netlify.app/.netlify/functions/delete_vocab`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseToken}`, },
                      body: JSON.stringify({ original_word })
                    })
                    .then(res => res.json())
                    .then(data => {
                      console.log(data)
                    })
                    .catch((err) => {
                      console.error("Fetch failed:", err);
                    });
                  });
                  const indexList = vocabList.indexOf(vocab.original_word);
                  const domElement = document.getElementById(`list-item-${index}`)
                  console.log(domElement)
                  domElement.remove();
                  vocabList.splice(indexList, 1);
                  chrome.storage.local.set({ vocabulary_list: vocabList})
                  const vocabCardsCount = document.querySelectorAll("#vocabList .vocab-card").length;
                  if (vocabCardsCount === 0) {
                    vocabListHtml.innerHTML = "<div>You haven't saved any vocabulary yet.</div>"
                  }
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
          // vocabListHtml.insertAdjacentHTML("beforeend", `<button id="exportBtn">Export list</button>`)
        })
        .catch((err) => {
          console.error("Fetch failed:", err);
        });
      })
    }

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
      }
    });
 })
