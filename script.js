(function () {
  const layer = document.getElementById("heartsLayer");
  if (!layer) return;

  const glyphs = ["♥", "♡", "❤"];
  const tones = ["", "tone-grey", "tone-dim", "tone-grey", "tone-dim"];

  function spawnHeart() {
    const heart = document.createElement("span");
    heart.className = "floating-heart";

    // Warna: putih / grey / dim
    const tone = tones[Math.floor(Math.random() * tones.length)];
    if (tone) heart.classList.add(tone);

    // Glyph
    heart.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];

    // Posisi horizontal acak
    heart.style.left = Math.random() * 100 + "vw";

    // Opacity puncak — beberapa lebih transparan
    const peak = (0.3 + Math.random() * 0.6).toFixed(2);   // 0.3 – 0.9
    heart.style.setProperty("--peak-opacity", peak);

    // Rotasi sedikit, bukan berputar banyak — biar terasa melayang naik
    const s0 = (Math.random() * 20 - 10).toFixed(1) + "deg";
    const s1 = (Math.random() * 30 - 15).toFixed(1) + "deg";
    const s2 = (Math.random() * 40 - 20).toFixed(1) + "deg";
    heart.style.setProperty("--spin-start", s0);
    heart.style.setProperty("--spin-mid",   s1);
    heart.style.setProperty("--spin-end",   s2);

    // Durasi terbang naik: 5 – 8 detik
    const duration = 5 + Math.random() * 3;
    heart.style.animationDuration = duration + "s";

    // Delay kecil
    heart.style.animationDelay = (Math.random() * 0.7) + "s";

    layer.appendChild(heart);

    // Bersihkan setelah selesai
    const total = (duration + 1) * 1000;
    window.setTimeout(() => heart.remove(), total);
  }

  // Spawn terus-menerus
  setInterval(spawnHeart, 300);

  // Beberapa di awal
  for (let i = 0; i < 5; i++) {
    window.setTimeout(spawnHeart, i * 200);
  }
})();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const intro = $("#intro");
const story = $("#story");
const envelope = $("#openEnvelope");
const music = $("#backgroundMusic");
const musicToggle = $("#musicToggle");
const musicLabel = $("#musicLabel");
const progressBar = $("#progressBar");
const memoryReveal = $("#memoryReveal");
const memoryTitle = $("#memoryTitle");
const memoryText = $("#memoryText");
const modal = $("#photoModal");
const modalImage = $("#modalImage");
const modalCaption = $("#modalCaption");
const heartBurst = $("#heartBurst");

const memoryNotes = [
  { title: "The little things", text: "Kadang bukan momen besar yang paling aku ingat. Justru hal kecil saat kita ketawa bareng, ngobrol random, atau cuma ada di dekat satu sama lain." },
  { title: "My favorite weirdo", text: "Kamu bisa bikin aku ketawa sekaligus geleng-geleng kepala. Jujur, itu skill langka. Tolong jangan disalahgunakan." },
  { title: "If I could replay a day", text: "Aku bakal pilih satu hari biasa bareng kamu. Nggak harus mewah—asal ada kamu, ceritanya udah menarik." },
  { title: "Official notice ✷", text: "Kamu resmi dituduh mencuri perhatian, memenuhi pikiranku secara ilegal, dan menjadi orang favoritku. Hukuman: disayang terus." }
];

envelope.addEventListener("click", () => {
  if (envelope.classList.contains("opened")) return;
  envelope.classList.add("opened");
  envelope.setAttribute("aria-label", "Amplop terbuka");

  // 🎵 Autoplay musik saat amplop di-tap
  if (music.paused) {
    music.play().then(() => {
      musicToggle.setAttribute("aria-pressed", "true");
      musicLabel.textContent = "Pause our song";
    }).catch(err => {
      console.log("Autoplay ditolak browser:", err);
      musicLabel.textContent = "Tap untuk play ♫";
    });
  }

  window.setTimeout(() => {
    intro.classList.add("leaving");
    window.setTimeout(() => {
      intro.hidden = true;
      story.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
      makeHearts(10);
    }, 500);
  }, 650);
});

musicToggle.addEventListener("click", async () => {
  if (music.paused) {
    try {
      await music.play();
      musicToggle.setAttribute("aria-pressed", "true");
      musicLabel.textContent = "Pause our song";
    } catch (error) {
      musicLabel.textContent = "Add our-song.mp3";
    }
  } else {
    music.pause();
    musicToggle.setAttribute("aria-pressed", "false");
    musicLabel.textContent = "Play our song";
  }
});

$$("[data-memory]").forEach(card => {
  card.addEventListener("click", () => {
    const note = memoryNotes[Number(card.dataset.memory)];
    memoryTitle.textContent = note.title;
    memoryText.textContent = note.text;
    memoryReveal.hidden = false;
    memoryReveal.scrollIntoView({ behavior: "smooth", block: "center" });
    makeHearts(4);
  });
});
$("#closeMemory").addEventListener("click", () => { memoryReveal.hidden = true; });

/* =========================================================
   Polaroid Zoom + Notes Panel
   Klik → polaroid terbang ke center, notes slide out ke kanan
   Klik lagi → semua kembali ke posisi asal
   ========================================================= */
const polaroidBackdrop = $("#polaroidBackdrop");
const memoryGrid = $(".memory-grid");

const memoryNotesContent = [
  { title: "The little things", text: "Kadang bukan momen besar yang paling aku ingat. Justru hal kecil saat kita ketawa bareng, ngobrol random, atau cuma ada di dekat satu sama lain." },
  { title: "My favorite weirdo", text: "Kamu bisa bikin aku ketawa sekaligus geleng-geleng kepala. Jujur, itu skill langka. Tolong jangan disalahgunakan." },
  { title: "If I could replay a day", text: "Aku bakal pilih satu hari biasa bareng kamu. Nggak harus mewah—asal ada kamu, ceritanya udah menarik." },
  { title: "Official notice ✷", text: "Kamu resmi dituduh mencuri perhatian, memenuhi pikiranku secara ilegal, dan menjadi orang favoritku. Hukuman: disayang terus." }
];

let typingTimer = null;   // untuk clear kalau user close sebelum selesai

function typeText(el, text, speed = 28) {
  // Bersihkan timer sebelumnya
  if (typingTimer) clearTimeout(typingTimer);

  el.innerHTML = "";
  const caret = document.createElement("span");
  caret.className = "caret";

  let i = 0;
  function step() {
    if (i <= text.length) {
      el.textContent = text.slice(0, i);
      el.appendChild(caret);
      i++;
      typingTimer = setTimeout(step, speed);
    } else {
      // selesai — caret tetap blink
      el.appendChild(caret);
    }
  }
  step();
}

function closeAllZoom() {
  if (typingTimer) clearTimeout(typingTimer);

  $$(".memory.polaroid.zoomed").forEach(card => {
    card.classList.remove("zoomed");
    const panel = card.querySelector(".polaroid-note-panel");
    if (panel) panel.classList.remove("active");
  });
  memoryGrid.classList.remove("has-zoomed");
  polaroidBackdrop.classList.remove("active");
  document.body.classList.remove("zoomed-mode");
}

$$(".memory.polaroid").forEach(card => {
  card.addEventListener("click", (e) => {
    if (e.target.closest("button") && e.target.closest("button") !== card) return;

    const isZoomed = card.classList.contains("zoomed");

    if (!isZoomed) {
      closeAllZoom();

      // Simpan posisi asli
      card._originalParent = card.parentNode;
      card._originalNext = card.nextSibling;

      // Buat / ambil panel
      let panel = card.querySelector(".polaroid-note-panel");
      if (!panel) {
        panel = document.createElement("div");
        panel.className = "polaroid-note-panel";

        const idx = Number(card.dataset.memory);
        const note = memoryNotesContent[idx] || { title: "A note", text: "" };

        panel.innerHTML = `
          <p class="note-panel-title">${note.title}</p>
          <p class="note-panel-text"></p>
        `;
        card.appendChild(panel);
      }

      // Pindahkan polaroid ke body supaya tidak kena blur main
      document.body.appendChild(card);
      // Pindahkan panel juga ke body supaya position:fixed bekerja di viewport
      

      card.classList.add("zoomed");
      memoryGrid.classList.add("has-zoomed");
      polaroidBackdrop.classList.add("active");
      document.body.classList.add("zoomed-mode");

      // Aktifkan panel + mulai typing
      window.setTimeout(() => {
        panel.classList.add("active");

        // Ambil teks dari memoryNotesContent
        const idx = Number(card.dataset.memory);
        const note = memoryNotesContent[idx] || { title: "A note", text: "" };
        const textEl = panel.querySelector(".note-panel-text");

        // Mulai typing setelah panel muncul
        window.setTimeout(() => typeText(textEl, note.text, 28), 350);
      }, 280);

    } else {
      // Zoom out
      if (typingTimer) clearTimeout(typingTimer);

      const panel = card.querySelector(".polaroid-note-panel");
      if (panel) panel.classList.remove("active");

      window.setTimeout(() => {
        card.classList.remove("zoomed");

        // Kembalikan ke parent asli
        if (card._originalParent) {
          if (card._originalNext && card._originalNext.parentNode === card._originalParent) {
            card._originalParent.insertBefore(card, card._originalNext);
          } else {
            card._originalParent.appendChild(card);
          }
        }

        // Kembalikan panel ke dalam card
        

        memoryGrid.classList.remove("has-zoomed");
        polaroidBackdrop.classList.remove("active");
        document.body.classList.remove("zoomed-mode");
      }, 200);
    }
  });
});

// Backdrop & ESC
polaroidBackdrop.addEventListener("click", closeAllZoom);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllZoom();
});

// Klik backdrop → tutup semua
polaroidBackdrop.addEventListener("click", closeAllZoom);

// Tekan ESC → tutup semua
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllZoom();
});

// Klik backdrop → zoom out semua polaroid
polaroidBackdrop.addEventListener("click", () => {
  $$(".memory.polaroid.zoomed").forEach(card => {
    card.classList.remove("zoomed");
  });
  memoryGrid.classList.remove("has-zoomed");
  polaroidBackdrop.classList.remove("active");
});

// Tekan ESC → zoom out semua
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $$(".memory.polaroid.zoomed").forEach(card => card.classList.remove("zoomed"));
    memoryGrid.classList.remove("has-zoomed");
    polaroidBackdrop.classList.remove("active");
  }
});

$("#modalClose").addEventListener("click", () => { modal.hidden = true; });
modal.addEventListener("click", event => { if (event.target === modal) modal.hidden = true; });
document.addEventListener("keydown", event => { if (event.key === "Escape") modal.hidden = true; });

const secretCards = $$(".secret-card");
secretCards.forEach(card => {
  card.addEventListener("click", () => {
    card.classList.toggle("revealed");
    const opened = secretCards.filter(item => item.classList.contains("revealed")).length;
    $("#secretProgress").textContent = `${opened} dari 3 rahasia terbuka ♡`;
    if (card.classList.contains("revealed")) makeHearts(3);
  });
});

const quizReplies = {
  me: "Jawaban penuh NPD ya! Sayang sekali, juri (aku) menyatakan kamu emang tetap menggemaskan. 💗",
  you: "Kelas king jawaban benar. Kamu menang hadiah berupa... kasih sayang tanpa batas dan gangguan kecil setiap hari. 😌",
  both: "Egiluy diplomatis dan romantis. Nilai sempurna! Duo gemas ini (km lebih gemas) memang susah dikalahkan. 🏆"
};
$$(".quiz-option").forEach(button => {
  button.addEventListener("click", () => {
    $("#quizResult").textContent = quizReplies[button.dataset.answer];
    $("#quizResult").hidden = false;
    $$(".quiz-option").forEach(item => item.classList.toggle("chosen", item === button));
    makeHearts(8);
  });
});

const letterLines = $$(".letter-line");
const letterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      letterLines.forEach((line, index) => window.setTimeout(() => line.classList.add("visible"), index * 450));
      letterObserver.disconnect();
    }
  });
}, { threshold: 0.18 });
letterObserver.observe($("#letter"));

$("#surpriseButton").addEventListener("click", () => {
  $("#finalMessage").hidden = false;
  $("#surpriseButton").textContent = "surprise delivered ♡";
  makeHearts(22);
});

$("#restartButton").addEventListener("click", () => {
  story.hidden = true;
  intro.hidden = false;
  intro.classList.remove("leaving");
  envelope.classList.remove("opened");
  envelope.setAttribute("aria-label", "Buka amplop surat");
  memoryReveal.hidden = true;
  $("#finalMessage").hidden = true;
  $("#surpriseButton").textContent = "one last tiny surprise ♡";
  $("#quizResult").hidden = true;
  $$(".secret-card").forEach(card => card.classList.remove("revealed"));
  $("#secretProgress").textContent = "0 dari 3 rahasia terbuka ♡";
  letterLines.forEach(line => line.classList.remove("visible"));
  $$(".quiz-option").forEach(item => item.classList.remove("chosen"));
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function makeHearts(count) {
  const hearts = ["♡", "♥", "✦", "✧"];
  for (let i = 0; i < count; i++) {
    const heart = document.createElement("span");
    heart.className = "burst-heart";
    heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.setProperty("--drift", `${Math.random() * 130 - 65}px`);
    heart.style.setProperty("--spin", `${Math.random() * 90 - 45}deg`);
    heart.style.animationDelay = `${Math.random() * .35}s`;
    heartBurst.appendChild(heart);
    window.setTimeout(() => heart.remove(), 2300);
  }
}

window.addEventListener("scroll", () => {
  if (story.hidden) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}, { passive: true });

/* =========================================================
   Auto-scroll — 5 detik per section
   Berhenti otomatis kalau user scroll manual
   ========================================================= */
(function autoScroll() {
  const SECTIONS = [
    ".hero-section",
    "#memories",
    "#secrets",
    "#quiz",
    "#letter",
    "#finale"
  ];
  const DELAY = 4000;      // 4 detik per section

  let currentIndex = -1;
  let timerId = null;
  let userInterrupted = false;
  let started = false;

  function scrollToSection(index) {
    if (index >= SECTIONS.length) {
      stopAutoScroll();
      return;
    }
    const el = document.querySelector(SECTIONS[index]);
    if (!el) {
      scrollToSection(index + 1);
      return;
    }

    currentIndex = index;

    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Jadwalkan section berikutnya
    timerId = window.setTimeout(() => {
      scrollToSection(index + 1);
    }, DELAY);
  }

  function stopAutoScroll() {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  function startAutoScroll() {
    if (started) return;
    started = true;

    // Mulai dari section pertama (hero)
    timerId = window.setTimeout(() => {
      scrollToSection(0);
    }, DELAY);
  }

  // Deteksi scroll manual user → stop auto-scroll
  let userScrollTimeout = null;
  window.addEventListener("wheel", () => {
    if (!started) return;
    userInterrupted = true;
    stopAutoScroll();
  }, { passive: true });

  window.addEventListener("touchmove", () => {
    if (!started) return;
    userInterrupted = true;
    stopAutoScroll();
  }, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (!started) return;
    // Panah atas/bawah, PageUp/PageDown, Space
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(e.key)) {
      userInterrupted = true;
      stopAutoScroll();
    }
  });

  // Tunggu sampai story muncul, baru mulai auto-scroll
  const observer = new MutationObserver(() => {
    const story = document.getElementById("story");
    if (story && !story.hidden) {
      startAutoScroll();
      observer.disconnect();
    }
  });

  const story = document.getElementById("story");
  if (story) {
    observer.observe(story, { attributes: true, attributeFilter: ["hidden"] });
    // Kalau story sudah kelihatan dari awal (misal restart)
    if (!story.hidden) {
      startAutoScroll();
    }
  }
})();