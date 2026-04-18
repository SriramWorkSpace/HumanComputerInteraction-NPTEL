/* ── app.js — HCI Quiz Logic ─────────────────────────────── */
(() => {
  "use strict";

  /* ─── State ──────────────────────────────────────────────── */
  let activeQuestions = [];
  let userAnswers     = {};        // { questionId: optionIndex }
  let selectedWeeks   = new Set(["all"]);
  let showWeekLabels  = false;     // true only when specific weeks are chosen

  /* ─── Helpers ────────────────────────────────────────────── */
  const $  = id => document.getElementById(id);
  const esc = s  => String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function animCount(el, from, to, suffix, ms) {
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / ms, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ─── Page navigation ────────────────────────────────────── */
  const pages = { home: $("page-home"), quiz: $("page-quiz"), results: $("page-results") };

  function showPage(name) {
    Object.values(pages).forEach(p => p.classList.remove("active"));
    pages[name].classList.add("active");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* ─── Week filter chips ──────────────────────────────────── */
  const filterCount = $("filter-count");

  function getPool() {
    if (selectedWeeks.has("all")) return [...questions];
    const weeks = [...selectedWeeks].map(Number);
    return questions.filter(q => weeks.includes(q.week));
  }

  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const w = chip.dataset.week;

      if (w === "all") {
        selectedWeeks = new Set(["all"]);
        document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        $("chip-all").classList.add("active");
      } else {
        selectedWeeks.delete("all");
        $("chip-all").classList.remove("active");

        if (chip.classList.contains("active")) {
          chip.classList.remove("active");
          selectedWeeks.delete(w);
          if (selectedWeeks.size === 0) {
            selectedWeeks.add("all");
            $("chip-all").classList.add("active");
          }
        } else {
          chip.classList.add("active");
          selectedWeeks.add(w);
        }
      }

      const n = getPool().length;
      filterCount.textContent = `${n} question${n !== 1 ? "s" : ""} selected`;
    });
  });

  /* ─── Start quiz ─────────────────────────────────────────── */
  $("btn-start").addEventListener("click", startQuiz);

  function startQuiz() {
    const pool = getPool();
    if (!pool.length) return;

    // Only show week dividers when user picked specific weeks
    showWeekLabels = !selectedWeeks.has("all");

    activeQuestions = shuffle(pool);
    userAnswers     = {};

    buildQuizDOM();
    showPage("quiz");
    updateProgress();
  }

  /* ─── Build quiz DOM ─────────────────────────────────────── */
  function buildQuizDOM() {
    const list = $("questions-list");
    list.innerHTML = "";

    const LABELS = ["A", "B", "C", "D"];
    let lastWeek  = null;

    activeQuestions.forEach((q, idx) => {
      /* Week divider — only when specific weeks selected */
      if (showWeekLabels && q.week !== lastWeek) {
        const div = document.createElement("div");
        div.className = "week-divider";
        div.innerHTML = `
          <div class="week-divider-line"></div>
          <span class="week-divider-pill">Week ${q.week}</span>
          <div class="week-divider-line"></div>`;
        list.appendChild(div);
        lastWeek = q.week;
      }

      const card = document.createElement("div");
      card.className = "q-card";
      card.id = `qcard-${q.id}`;

      card.innerHTML = `
        <div class="q-head">
          <div class="q-num">${idx + 1}</div>
          <p class="q-text">${esc(q.question)}</p>
        </div>
        <div class="q-options">
          ${q.options.map((opt, i) => `
            <button class="opt-btn" data-qid="${q.id}" data-idx="${i}" id="opt-${q.id}-${i}">
              <span class="opt-label">${LABELS[i]}</span>
              <span>${esc(opt)}</span>
            </button>`).join("")}
        </div>`;

      list.appendChild(card);
    });

    list.addEventListener("click", handleOptionClick);
  }

  function handleOptionClick(e) {
    const btn = e.target.closest(".opt-btn");
    if (!btn) return;

    const qid = Number(btn.dataset.qid);
    const idx  = Number(btn.dataset.idx);

    userAnswers[qid] = idx;

    document.querySelectorAll(`.opt-btn[data-qid="${qid}"]`)
      .forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");

    const card = $(`qcard-${qid}`);
    if (card) card.classList.add("answered");

    updateProgress();
  }

  /* ─── Progress ───────────────────────────────────────────── */
  function updateProgress() {
    const total    = activeQuestions.length;
    const answered = Object.keys(userAnswers).length;
    const pct      = total ? (answered / total) * 100 : 0;

    $("progress-fill").style.width = pct + "%";
    $("quiz-prog-label").textContent = `${answered} / ${total} answered`;

    const hint = $("finish-hint");
    if (answered === total) {
      hint.textContent = "All done — ready to submit!";
      hint.classList.add("ready");
    } else {
      const rem = total - answered;
      hint.textContent = `${rem} question${rem !== 1 ? "s" : ""} remaining`;
      hint.classList.remove("ready");
    }
  }

  /* ─── Finish & score ─────────────────────────────────────── */
  $("btn-finish").addEventListener("click", finishQuiz);

  function finishQuiz() {
    let correct = 0, wrong = 0, skipped = 0;

    activeQuestions.forEach(q => {
      const ua = userAnswers[q.id];
      if (ua === undefined) skipped++;
      else if (ua === q.answer) correct++;
      else wrong++;
    });

    const total = activeQuestions.length;
    const pct   = total ? Math.round((correct / total) * 100) : 0;

    renderResults(correct, wrong, skipped, total, pct);
    showPage("results");
  }

  /* ─── Results ────────────────────────────────────────────── */
  function renderResults(correct, wrong, skipped, total, pct) {
    /* Ring animation */
    const circumference = 327;
    setTimeout(() => {
      const fill  = $("ring-fill");
      fill.style.strokeDashoffset = circumference - (pct / 100) * circumference;
      fill.style.stroke =
        pct >= 75 ? "#22c55e" :
        pct >= 50 ? "#f59e0b" : "#ef4444";
    }, 80);

    /* Numbers */
    animCount($("score-pct"),    0, pct,     "%", 900);
    animCount($("bd-correct"),   0, correct, "",  700);
    animCount($("bd-wrong"),     0, wrong,   "",  700);
    animCount($("bd-skipped"),   0, skipped, "",  700);
    $("score-raw").textContent = `${correct}/${total}`;

    /* Verdict */
    const verdicts = [
      [90, "Outstanding!",  "#22c55e"],
      [75, "Great Job!",    "#4ade80"],
      [60, "Good Effort!",  "#f59e0b"],
      [40, "Keep Studying!","#fb923c"],
      [ 0, "Don\'t Give Up!","#ef4444"],
    ];
    const [, label, color] = verdicts.find(([min]) => pct >= min);
    const vd = $("score-verdict");
    vd.textContent = label;
    vd.style.color  = color;

    buildReview("all");
  }

  /* ─── Review list ────────────────────────────────────────── */
  function buildReview(filter) {
    const list   = $("review-list");
    const LABELS = ["A", "B", "C", "D"];
    list.innerHTML = "";
    let shown = 0;

    activeQuestions.forEach((q, idx) => {
      const ua     = userAnswers[q.id];
      const isSkip = ua === undefined;
      const isOk   = !isSkip && ua === q.answer;
      const status = isSkip ? "skipped" : isOk ? "correct" : "wrong";

      if (filter !== "all" && filter !== status) return;
      shown++;

      const card = document.createElement("div");
      card.className = `rv-card rv-${status}`;

      const cLabel = LABELS[q.answer];
      const cText  = q.options[q.answer];
      const uLabel = isSkip ? null : LABELS[ua];
      const uText  = isSkip ? null : q.options[ua];

      const weekTag = `<span class="rv-week">Week ${q.week}</span>`;

      card.innerHTML = `
        <div class="rv-head">
          <span class="rv-badge">${status}</span>
          <span class="rv-qnum">Q${idx + 1}</span>
          ${weekTag}
        </div>
        <p class="rv-question">${esc(q.question)}</p>
        <div class="rv-answers">
          ${isSkip
            ? `<div class="rv-ans ra-skipped"><span class="ra-icon">—</span><span class="rv-ans-text">Not answered</span></div>
               <div class="rv-ans ra-correct"><span class="ra-icon">✓</span><span class="rv-ans-text"><strong>Correct:</strong> ${cLabel}. ${esc(cText)}</span></div>`
            : isOk
            ? `<div class="rv-ans ra-correct"><span class="ra-icon">✓</span><span class="rv-ans-text">${uLabel}. ${esc(uText)}</span></div>`
            : `<div class="rv-ans ra-wrong"><span class="ra-icon">✗</span><span class="rv-ans-text"><strong>Your answer:</strong> ${uLabel}. ${esc(uText)}</span></div>
               <div class="rv-ans ra-correct"><span class="ra-icon">✓</span><span class="rv-ans-text"><strong>Correct:</strong> ${cLabel}. ${esc(cText)}</span></div>`}
        </div>`;

      list.appendChild(card);
    });

    if (!shown) {
      list.innerHTML = `<div class="review-empty">No questions in this category.</div>`;
    }
  }

  document.querySelectorAll(".rtab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".rtab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      buildReview(btn.dataset.filter);
    });
  });

  /* ─── Retake / Home ──────────────────────────────────────── */
  $("btn-retake").addEventListener("click", () => {
    resetReviewTabs();
    resetRing();
    startQuiz();
  });

  $("btn-home").addEventListener("click", () => {
    resetReviewTabs();
    resetRing();
    showPage("home");
  });

  function resetReviewTabs() {
    document.querySelectorAll(".rtab").forEach(b => b.classList.remove("active"));
    $("rt-all").classList.add("active");
  }
  function resetRing() {
    $("ring-fill").style.strokeDashoffset = 327;
    $("ring-fill").style.stroke = "#7c6fff";
  }

  /* ─── Quit modal ─────────────────────────────────────────── */
  $("btn-quit").addEventListener("click", () => $("modal-overlay").classList.add("open"));
  $("btn-modal-keep").addEventListener("click", () => $("modal-overlay").classList.remove("open"));
  $("btn-modal-quit").addEventListener("click", () => {
    $("modal-overlay").classList.remove("open");
    showPage("home");
  });
  $("modal-overlay").addEventListener("click", e => {
    if (e.target === $("modal-overlay")) $("modal-overlay").classList.remove("open");
  });

  /* ─── Init ───────────────────────────────────────────────── */
  showPage("home");
})();
