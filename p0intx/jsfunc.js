const SAVE_PREFIX = "hlasvmlze";

let summaryLog = [];
let story = {};
let current = "start";
let storyLoaded = false;
let history = [];
let isAnimating = false;
let currentHealth = 100;

// ===== UNIVERSAL FADE =====
function fadeIn(el) {
 el.classList.add("open");
 lockScroll(true);
}

function fadeOut(el) {
 el.classList.remove("open");
 lockScroll(false);
}

// ===== FORMAT =====
function formatText(text) {
 return text
  .replace(/\[b\](.*?)\[\/b\]/g, "<strong>$1</strong>")
  .replace(/\[i\](.*?)\[\/i\]/g, "<i>$1</i>")
  .replace(/\[u\](.*?)\[\/u\]/g, "<u>$1</u>")
  .replace(/\[center\](.*?)\[\/center\]/g, "<div class='center'>$1</div>")
  .replace(/\[h2\](.*?)\[\/h2\]/g, "<h2>$1</h2>")
  .replace(/\[img\](.*?)\[\/img\]/g, "<img src='$1'>")
  .replace(/\[br\]/g, "<br>")
  .replace(/\[m\]/g, "&nbsp;")
  .replace(/\n/g, "<br>");
}

function setFontSize(size) {
 document.body.classList.remove("font-small", "font-medium", "font-large");

 document.body.classList.add("font-" + size);

 localStorage.setItem("fontSize", size);
}

// ===== SCROLL LOCK =====
function lockScroll(lock) {
 document.body.style.overflow = lock ? "hidden" : "auto";
}

// Active Buttons
function resetActiveButtons() {
 document.getElementById("mapBtn").classList.remove("activeBtn");
 document.getElementById("notesBtn").classList.remove("activeBtn");
 document.getElementById("helpBtn")?.classList.remove("activeBtn");
 document.getElementById("summaryBtn")?.classList.remove("activeBtn");
 document.getElementById("grafBtn")?.classList.remove("activeBtn");
}

// ===== LOAD =====
function loadStory() {
 return fetch("story.txt")
  .then((res) => res.text())
  .then(parseStory);
}

function parseStory(text) {
 const blocks = text.trim().split("\n\n");
 blocks.forEach((block) => {
  const lines = block.split("\n");
  const id = lines[0].replace("[", "").replace("]", "").trim();
  let content = "";
  let choices = [];
  let summary = [];
  let health = null;
  let graf = null;
  for (let i = 1; i < lines.length; i++) {
   if (lines[i].startsWith(";;;")) {
    graf = lines[i].substring(3).trim();
    lines[i] = "";
    continue;
   }
   if (lines[i].startsWith(":::")) {
    const txt = lines[i].substring(3).trim();
    if (txt) summary.push(txt);
    lines[i] = "";
    continue;
   } else if (lines[i].startsWith(":;")) {
    const val = parseInt(lines[i].substring(2).trim());
    if (!isNaN(val)) health = val;
    continue;
   }

   if (lines[i].startsWith(">")) {
    let parts = lines[i].substring(1).split("|");
    choices.push({ text: parts[0].trim(), target: parts[1].trim() });
   } else if (lines[i] === "END") {
    choices = [];
   } else {
    content += lines[i] + "\n";
   }
  }
  story[id] = { content, choices, summary, graf, health };
 });
 storyLoaded = true;
}

// ===== START =====
function startGame() {
 const loginEl = document.getElementById("login");
 if (loginEl) loginEl.style.display = "none";

 document.getElementById("game").style.display = "block";

 loadStory().then(() => {
  current = localStorage.getItem(SAVE_PREFIX + "_save") || "start";
  history = JSON.parse(localStorage.getItem(SAVE_PREFIX + "_history")) || [];

  const savedHealth = localStorage.getItem(SAVE_PREFIX + "_health");
  if (savedHealth !== null) {
   currentHealth = parseInt(savedHealth);
  }

  const notes = localStorage.getItem(SAVE_PREFIX + "_notes");
  if (notes) {
   const notesEl = document.getElementById("notes");
   notesEl.value = notes;
   notesEl.scrollTop = notesEl.scrollHeight;
  }

  const savedSummary = localStorage.getItem(SAVE_PREFIX + "_summary");
  if (savedSummary) {
   summaryLog = JSON.parse(savedSummary);

   document.getElementById("summaryContent").innerHTML = summaryLog
    .map((s) => "<p>📌" + s + "</p>")
    .join("");
  }

  showNode(current, false, true);
 });
}

// ===== SHOW =====
function showNode(id, addToHistory = true, instant = false) {
 if (!storyLoaded || isAnimating) return;

 if (addToHistory && current !== id) history.push(current);
 if (currentHealth <= 0) {
  document.getElementById("text").innerHTML = "💀 Zemřel jsi";

  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  const btn = document.createElement("button");
  btn.innerText = "Začít znovu";
  btn.onclick = () => {
   currentHealth = 75;

   localStorage.removeItem(SAVE_PREFIX + "_save");
   localStorage.removeItem(SAVE_PREFIX + "_history");
   localStorage.removeItem(SAVE_PREFIX + "_notes");
   localStorage.removeItem(SAVE_PREFIX + "_summary");
   localStorage.removeItem(SAVE_PREFIX + "_health");

   showNode("start");
  };

  choicesDiv.appendChild(btn);
  return;
 }

 current = id;
 localStorage.setItem(SAVE_PREFIX + "_save", current);
 localStorage.setItem(SAVE_PREFIX + "_history", JSON.stringify(history));

 const node = story[id];
 const textEl = document.getElementById("text");

 function render() {
  if (node.health !== null) {
   currentHealth = node.health;
   localStorage.setItem(SAVE_PREFIX + "_health", currentHealth);
  }

  const notesEl = document.getElementById("notes");
  if (node.graf) {
   localStorage.setItem(SAVE_PREFIX + "_graf", node.graf);
   updateGrafImage();
  }
  if (node.summary && node.summary.length) {
   node.summary.forEach((s) => {
    if (!notesEl.value.includes(s)) {
     notesEl.value += (notesEl.value ? "\n" : "") + "📌 " + s + "\n\n\n\n";
    }
   });

   localStorage.setItem(SAVE_PREFIX + "_notes", notesEl.value);
   notesEl.scrollTop = 9999999;
  }
  if (node.summary && node.summary.length) {
   node.summary.forEach((s) => {
    if (!summaryLog.includes(s)) summaryLog.push(s);
   });
   localStorage.setItem(SAVE_PREFIX + "_summary", JSON.stringify(summaryLog));
   document.getElementById("summaryContent").innerHTML = summaryLog
    .map((s) => "<p>📌" + s + "</p>")
    .join("");
  }
  textEl.innerHTML = formatText(node.content);
  window.scrollTo(0, 0);
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";

  if (!node.choices || node.choices.length === 0) {
   const btn = document.createElement("button");
   btn.innerText = "Restart";
   btn.onclick = () => {
    history = [];
    summaryLog = [];
    currentHealth = 75;
    localStorage.setItem(SAVE_PREFIX + "_health", currentHealth);
    localStorage.setItem(SAVE_PREFIX + "_history", JSON.stringify(history));
    localStorage.removeItem(SAVE_PREFIX + "_summary");

    showNode("start");
   };
   choicesDiv.appendChild(btn);
  } else {
   node.choices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.innerText = choice.text;
    btn.onclick = () => showNode(choice.target);
    choicesDiv.appendChild(btn);
   });
  }
  updateHealthBar();
 }

 if (instant) {
  render();
  return;
 }

 isAnimating = true;
 textEl.classList.add("fade-out");

 setTimeout(() => {
  render();
  textEl.classList.remove("fade-out");
  textEl.classList.add("fade-in");

  setTimeout(() => {
   textEl.classList.remove("fade-in");
   isAnimating = false;
  }, 450);
 }, 450);
}

// ===== BACK =====
function goBack() {
 if (history.length === 0 || isAnimating) return;
 const prev = history.pop();
 showNode(prev, false);
}

function updateBackBtn() {
 const backBtn = document.getElementById("backBtn");

 const modals = ["mapModal", "notesModal", "helpModal", "summaryModal"];

 const isAnyOpen = modals.some((id) =>
  document.getElementById(id).classList.contains("open"),
 );

 backBtn.style.display = isAnyOpen ? "none" : "inline-block";
}

function updateGrafImage() {
 const img = document.getElementById("grafImg");
 const saved = localStorage.getItem(SAVE_PREFIX + "_graf");

 if (saved) {
  img.src = saved;
 }
}

function updateHealthBar() {
  const fill = document.getElementById("healthFill");
  const text = document.getElementById("healthText");
  fill.style.transform = `scaleY(${currentHealth / 100})`;
  fill.style.backgroundColor = "green";
  text.textContent = `${Math.round(currentHealth)}`;
}

// ===== TOGGLES =====
function toggleModal(modalId, btnId, onOpenCallback = null) {
  const modals = [
    "grafModal",
    "mapModal",
    "notesModal",
    "helpModal",
    "summaryModal"
  ];
  const currentModal = document.getElementById(modalId);
  resetActiveButtons();
  if (currentModal.classList.contains("open")) {
    fadeOut(currentModal);
  } else {
    modals.forEach(id => {
      const el = document.getElementById(id);
      if (el) fadeOut(el);
    });
    fadeIn(currentModal);
    if (btnId) {
      document.getElementById(btnId)?.classList.add("activeBtn");
    }
    if (onOpenCallback) {
      onOpenCallback();
    }
  }
  updateBackBtn();
}

function toggleMap() {
  toggleModal("mapModal", "mapBtn", drawMap);
}
function toggleGraf() {
  toggleModal("grafModal", "grafBtn", updateGrafImage);
}
function toggleNotes() {
  toggleModal("notesModal", "notesBtn");
}
function toggleHelp() {
  toggleModal("helpModal", "helpBtn");
}
function toggleSummary() {
  toggleModal("summaryModal", "summaryBtn");
}


function setFontSize(size) {
 document.body.classList.remove("font-small", "font-medium", "font-large");
 document.body.classList.add("font-" + size);
 localStorage.setItem("fontSize", size);
}

function resetAllData() {
 const ok = confirm("??");
 if (!ok) return;
 localStorage.removeItem(SAVE_PREFIX + "_save");
 localStorage.removeItem(SAVE_PREFIX + "_history");
 localStorage.removeItem(SAVE_PREFIX + "_notes");
 localStorage.removeItem(SAVE_PREFIX + "_summary");
 localStorage.removeItem(SAVE_PREFIX + "_health");
 location.reload();
}
// light dark mode
function toggleTheme() {
 const isLight = document.body.classList.toggle("light");
 localStorage.setItem("theme", isLight ? "light" : "dark");
}

(function initTheme() {
 const savedTheme = localStorage.getItem("theme");
 if (savedTheme === "dark") {
  document.body.classList.remove("light");
 } else {
  document.body.classList.add("light");
 }
})();

// ===== NOTES AUTOSAVE =====
document.getElementById("notes").addEventListener("input", () => {
 localStorage.setItem(
  SAVE_PREFIX + "_notes",
  document.getElementById("notes").value,
 );
});

if ("serviceWorker" in navigator) {
 navigator.serviceWorker.register("sw.js");
}
document.addEventListener("DOMContentLoaded", () => {
 const savedTheme = localStorage.getItem("theme");
 if (savedTheme === "light") {
  document.body.classList.add("light");
 }
 const savedFont = localStorage.getItem("fontSize");
 if (savedFont) {
  document.body.classList.add("font-" + savedFont);
 }
 window.addEventListener("load", () => {
  const loader = document.getElementById("loader");

  setTimeout(() => {
   loader.classList.add("hide");
  }, 100);
 });

 startGame();
});
