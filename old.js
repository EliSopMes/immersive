// replacing the text in the document itself
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
    backPopup.style.borderRadius = "8px";
    backPopup.style.padding = "6px 12px";
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
