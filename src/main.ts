import "./styles.css";

type Stats = {
  courage: number;
  heartbeat: number;
  transmission: number;
};

type Choice = {
  text: string;
  isCorrect: boolean;
  codePatch: string;
  effectText: string;
  statChange: Partial<Stats>;
};

type Question = {
  id: string;
  errorMessage: string;
  choices: Choice[];
};

type Result = {
  id: string;
  title: string;
  body: string;
};

type PatchOverlay = {
  status: "success" | "error";
  title: string;
  patch: string;
  log: string;
};

type CodeSlot = "courage" | "heartbeat" | "message" | "eyeContact";

const initialCodeSlots: Record<CodeSlot, string[]> = {
  courage: ["let courage = undefined;"],
  heartbeat: ["let heartbeat = 180;"],
  message: ['let message = "";'],
  eyeContact: ["let eyeContact = false;"]
};

const codeSlotOrder: CodeSlot[] = ["courage", "heartbeat", "message", "eyeContact"];
const finalCodeLines = [
  "",
  'if (courage && message !== "" && eyeContact && heartbeat < 150) {',
  "  confession.send(message);",
  "}"
];

const questions: Question[] = [
  {
    id: "courage",
    errorMessage: "Error: courage is undefined / 勇気が未定義です",
    choices: [
      {
        text: "深呼吸する",
        isCorrect: true,
        codePatch: "let courage = true;\nlet heartbeat = 145;",
        effectText: "courage initialized. heartbeat stabilized.",
        statChange: { courage: 20, heartbeat: -35, transmission: 5 }
      },
      {
        text: "逃げる",
        isCorrect: false,
        codePatch: "let courage = false;\nlet distance = 999;\nconfession.cancel();",
        effectText: "process aborted. distance overflow.",
        statChange: { courage: -25, heartbeat: 20, transmission: -10 }
      },
      {
        text: "話題を変える",
        isCorrect: false,
        codePatch: 'let message = "今日の課題やった？";\nconfession.delay();',
        effectText: "confession delayed.",
        statChange: { courage: -10, heartbeat: 10, transmission: -5 }
      }
    ]
  },
  {
    id: "message",
    errorMessage: "Warning: message is empty / 伝える言葉が空です",
    choices: [
      {
        text: "好きです、と言う",
        isCorrect: true,
        codePatch: 'let message = "好きです";',
        effectText: "message assigned.",
        statChange: { courage: 10, heartbeat: 15, transmission: 30 }
      },
      {
        text: "今日の天気を聞く",
        isCorrect: false,
        codePatch: 'let message = "今日、晴れてるね";',
        effectText: "message mismatch.",
        statChange: { courage: -5, heartbeat: 5, transmission: -10 }
      },
      {
        text: "黙る",
        isCorrect: false,
        codePatch: 'let message = "";\nwhile(silence) { heartbeat++; }',
        effectText: "silence loop detected.",
        statChange: { courage: -10, heartbeat: 25, transmission: -15 }
      }
    ]
  },
  {
    id: "eyeContact",
    errorMessage: "Warning: eyeContact is false / 視線が合っていません",
    choices: [
      {
        text: "相手を見る",
        isCorrect: true,
        codePatch: "let eyeContact = true;",
        effectText: "eyeContact enabled.",
        statChange: { courage: 10, heartbeat: 10, transmission: 20 }
      },
      {
        text: "床を見る",
        isCorrect: false,
        codePatch: "let eyeContact = false;\nlet target = floor;",
        effectText: "target mismatch.",
        statChange: { courage: -5, heartbeat: 10, transmission: -10 }
      },
      {
        text: "スマホを見る",
        isCorrect: false,
        codePatch: "let eyeContact = false;\nnotification.focus();",
        effectText: "focus interrupted.",
        statChange: { courage: -10, heartbeat: 5, transmission: -15 }
      }
    ]
  },
  {
    id: "heartbeat",
    errorMessage: "Warning: heartbeat is too high / 心拍数が高すぎます",
    choices: [
      {
        text: "ゆっくり息を吸う",
        isCorrect: true,
        codePatch: "heartbeat -= 40;",
        effectText: "heartbeat normalized.",
        statChange: { courage: 10, heartbeat: -40, transmission: 10 }
      },
      {
        text: "早口で言う",
        isCorrect: false,
        codePatch: "speech.rate = 999;\nheartbeat += 30;",
        effectText: "buffer overflow: words.",
        statChange: { courage: 5, heartbeat: 30, transmission: -20 }
      },
      {
        text: "走って逃げる",
        isCorrect: false,
        codePatch: "heartbeat += 60;\nconfession.terminate();",
        effectText: "runtime interrupted.",
        statChange: { courage: -30, heartbeat: 60, transmission: -30 }
      }
    ]
  }
];

const results: Result[] = [
  {
    id: "success",
    title: "Compile Success",
    body: "告白は正常に実行されました。相手の心に、新しい変数が定義されました。"
  },
  {
    id: "warning",
    title: "Warning: 言葉が震えています",
    body: "少し不完全な実行でした。でも、気持ちは届いたようです。"
  },
  {
    id: "compileError",
    title: "Compile Error",
    body: "勇気が不足しています。もう一度、深呼吸してから実行してください。"
  },
  {
    id: "runtimeError",
    title: "Runtime Error",
    body: "心拍数が許容量を超えました。告白プロセスを一時停止します。"
  }
];

const appRoot = document.querySelector<HTMLDivElement>("#app");

if (!appRoot) {
  throw new Error("App root was not found.");
}

const app = appRoot;

const audio = {
  click: new Audio("/assets/click_001.ogg"),
  confirmation: new Audio("/assets/confirmation_001.ogg"),
  error: new Audio("/assets/error_003.ogg"),
  glitch: new Audio("/assets/glitch_001.ogg"),
  open: new Audio("/assets/open_001.ogg"),
  question: new Audio("/assets/question_001.ogg"),
  powerUp: new Audio("/assets/powerUp1.ogg"),
  zap: new Audio("/assets/zap1.ogg"),
  calmBgm: new Audio("/assets/bgm_relaxing.mp3"),
  compileBgm: new Audio("/assets/bgm_gasmask_love_loop.mp3")
};

audio.calmBgm.loop = true;
audio.compileBgm.loop = true;
audio.calmBgm.volume = 0.38;
audio.compileBgm.volume = 0.28;

let currentScreen: "title" | "dialogue" | "compile" | "result" = "title";
let currentQuestion = 0;
let stats: Stats = { courage: 40, heartbeat: 180, transmission: 0 };
let misses = 0;
let timeLeft = 30;
let timerId: number | undefined;
let codeSlots = cloneInitialCodeSlots();
let effectCodeLines: string[] = [];
let logLines = ["system idle.", "waiting confession input..."];
let lastPatch = "";
let isResolvingPatch = false;
let patchOverlay: PatchOverlay | null = null;
let lastPatchedSlots: CodeSlot[] = [];

function play(sound: HTMLAudioElement): void {
  sound.currentTime = 0;
  void sound.play().catch(() => undefined);
}

function startBgm(track: "calm" | "compile"): void {
  const active = track === "calm" ? audio.calmBgm : audio.compileBgm;
  const inactive = track === "calm" ? audio.compileBgm : audio.calmBgm;
  inactive.pause();
  active.currentTime = active.paused ? 0 : active.currentTime;
  void active.play().catch(() => undefined);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function render(): void {
  app.className = `app app-${currentScreen}`;

  if (currentScreen === "title") {
    renderTitle();
    return;
  }

  if (currentScreen === "dialogue") {
    renderDialogue();
    return;
  }

  if (currentScreen === "compile") {
    renderCompile();
    return;
  }

  renderResult(selectResult());
}

function renderTitle(): void {
  app.innerHTML = `
    <main class="stage stage-title">
      <div class="ambient-hearts" aria-hidden="true"></div>
      <section class="title-block">
        <p class="system-label">Kokuhaku Runtime v0.1</p>
        <h1>告白したら<br />プログラミングが始まるゲーム</h1>
        <button class="primary-action" data-action="start">告白プロセスを起動</button>
      </section>
    </main>
  `;

  app.querySelector<HTMLButtonElement>("[data-action='start']")?.addEventListener("click", () => {
    play(audio.open);
    startBgm("calm");
    currentScreen = "dialogue";
    render();
  });
}

function renderDialogue(): void {
  app.innerHTML = `
    <main class="stage stage-dialogue">
      <img class="character character-normal" src="/assets/pl4-normal.png" alt="相手の立ち絵" />
      <section class="dialogue-box">
        <div class="speaker">相手</div>
        <p>どうしたの？ 何か話したいことがあるの？</p>
        <button class="confess-button" data-action="confess">好きです</button>
      </section>
    </main>
  `;

  app.querySelector<HTMLButtonElement>("[data-action='confess']")?.addEventListener("click", () => {
    play(audio.glitch);
    triggerConfession();
  });
}

function triggerConfession(): void {
  app.classList.add("transitioning");
  setTimeout(() => {
    currentScreen = "compile";
    currentQuestion = 0;
    misses = 0;
    timeLeft = 30;
    stats = { courage: 40, heartbeat: 180, transmission: 0 };
    codeSlots = cloneInitialCodeSlots();
    effectCodeLines = [];
    logLines = ["confession input detected.", "Compiling confession..."];
    lastPatch = "";
    isResolvingPatch = false;
    patchOverlay = null;
    lastPatchedSlots = [];
    startBgm("compile");
    startTimer();
    render();
  }, 900);
}

function startTimer(): void {
  if (timerId !== undefined) {
    window.clearInterval(timerId);
  }

  timerId = window.setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endGame();
      return;
    }
    updateCompileDynamicParts();
  }, 1000);
}

function stopTimer(): void {
  if (timerId !== undefined) {
    window.clearInterval(timerId);
    timerId = undefined;
  }
}

function renderCompile(): void {
  const question = questions[currentQuestion];
  const targetSlot = isCodeSlot(question.id) ? question.id : null;
  const choices = question.choices
    .map((choice, index) => `<button class="choice" data-choice="${index}">${choice.text}</button>`)
    .join("");

  app.innerHTML = `
    <main class="stage stage-compile">
      <div class="matrix-bg" aria-hidden="true">${createCodeRain()}</div>
      <div class="scanline" aria-hidden="true"></div>
      <section class="runtime-layout">
        <div class="portrait-panel">
          <img class="character character-compile ${stats.heartbeat > 205 ? "is-panic" : ""}" src="${characterForState()}" alt="相手の立ち絵" />
          <div class="heartbeat-line" aria-hidden="true"></div>
        </div>
        <section class="code-panel">
          <header class="panel-header">
            <span>confession.ts</span>
            <span class="target-indicator">${targetSlot ? `TARGET: ${targetSlot}` : "TARGET: runtime"}</span>
            <span class="timer" data-timer>${timeLeft.toString().padStart(2, "0")}s</span>
          </header>
          <div class="code-output" data-code>${renderCode(targetSlot)}</div>
        </section>
        <aside class="status-panel">
          ${renderGauge("勇気", stats.courage, 0, 100)}
          ${renderGauge("心拍", stats.heartbeat, 80, 240)}
          ${renderGauge("伝達率", stats.transmission, 0, 100)}
          <div class="warning-window">
            <span class="target-chip">${targetSlot ? `現在の修正対象: ${targetSlot}` : "現在の修正対象: runtime"}</span>
            <strong>${question.errorMessage}</strong>
            <span>${lastPatch || "修正候補を選択してください。"}</span>
          </div>
        </aside>
      </section>
      <section class="choice-bar">
        ${choices}
      </section>
      <section class="log-panel" data-log>
        ${logLines.slice(-5).map((line) => `<p>&gt; ${line}</p>`).join("")}
      </section>
      ${patchOverlay ? renderPatchOverlay(patchOverlay) : ""}
    </main>
  `;

  app.querySelectorAll<HTMLButtonElement>("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.choice);
      choose(index);
    });
  });
}

function updateCompileDynamicParts(): void {
  app.querySelector<HTMLElement>("[data-timer]")?.replaceChildren(`${timeLeft.toString().padStart(2, "0")}s`);
}

function choose(index: number): void {
  if (isResolvingPatch) {
    return;
  }

  const question = questions[currentQuestion];
  const choice = question.choices[index];
  if (!choice) {
    return;
  }

  isResolvingPatch = true;
  stopTimer();
  play(choice.isCorrect ? audio.confirmation : audio.error);
  if (!choice.isCorrect) {
    misses += 1;
    timeLeft = clamp(timeLeft - 3, 0, 30);
  } else {
    play(audio.zap);
  }

  applyStats(choice.statChange);
  lastPatchedSlots = patchCode(question.id, choice.codePatch);
  lastPatch = choice.effectText;
  logLines.push(choice.effectText);
  patchOverlay = {
    status: choice.isCorrect ? "success" : "error",
    title: choice.isCorrect ? "PATCH APPLIED" : "BAD PATCH",
    patch: choice.codePatch,
    log: choice.effectText
  };
  render();

  if (!choice.isCorrect) {
    spawnWarning();
  } else {
    spawnHearts();
  }

  window.setTimeout(() => {
    patchOverlay = null;
    isResolvingPatch = false;

    if (stats.heartbeat >= 240 || misses >= 3 || timeLeft <= 0) {
      endGame();
      return;
    }

    currentQuestion += 1;
    if (currentQuestion >= questions.length) {
      endGame();
      return;
    }

    play(audio.question);
    startTimer();
    render();
  }, 1500);
}

function renderPatchOverlay(overlay: PatchOverlay): string {
  const patchLines = overlay.patch
    .split("\n")
    .map((line) => `<code>${line}</code>`)
    .join("");

  return `
    <section class="patch-overlay patch-${overlay.status}" aria-live="polite">
      <div class="patch-rings" aria-hidden="true"></div>
      <div class="patch-card">
        <span class="patch-label">${overlay.status === "success" ? "Emotion Code Update" : "Exception Raised"}</span>
        <h2>${overlay.title}</h2>
        <div class="patch-code">${patchLines}</div>
        <p>${overlay.log}</p>
      </div>
    </section>
  `;
}

function applyStats(change: Partial<Stats>): void {
  stats = {
    courage: clamp(stats.courage + (change.courage ?? 0), 0, 100),
    heartbeat: clamp(stats.heartbeat + (change.heartbeat ?? 0), 80, 260),
    transmission: clamp(stats.transmission + (change.transmission ?? 0), 0, 100)
  };
}

function cloneInitialCodeSlots(): Record<CodeSlot, string[]> {
  return {
    courage: [...initialCodeSlots.courage],
    heartbeat: [...initialCodeSlots.heartbeat],
    message: [...initialCodeSlots.message],
    eyeContact: [...initialCodeSlots.eyeContact]
  };
}

function patchCode(id: string, patch: string): CodeSlot[] {
  if (!isCodeSlot(id)) {
    return [];
  }

  const extraLines: string[] = [];
  const patchedSlots = new Set<CodeSlot>();

  patch.split("\n").forEach((line) => {
    const matchedSlot = line.match(/^(?:let\s+)?(courage|heartbeat|message|eyeContact)\s*(?:=|\+=|-=)/)?.[1];

    if (matchedSlot && isCodeSlot(matchedSlot)) {
      codeSlots[matchedSlot] = [line];
      patchedSlots.add(matchedSlot);
      return;
    }

    extraLines.push(line);
  });

  if (!patchedSlots.has(id) && extraLines.length > 0) {
    codeSlots[id] = extraLines;
    effectCodeLines = [];
    return [id];
  }

  effectCodeLines = extraLines;
  return [...patchedSlots];
}

function isCodeSlot(id: string): id is CodeSlot {
  return codeSlotOrder.includes(id as CodeSlot);
}

function renderCode(targetSlot: CodeSlot | null): string {
  const rows = [
    ...codeSlotOrder.flatMap((slot) => codeSlots[slot].map((line) => ({ line, slot }))),
    ...effectCodeLines.map((line) => ({ line, slot: "effect" as const })),
    ...finalCodeLines.map((line) => ({ line, slot: "final" as const }))
  ];

  return rows
    .map(({ line, slot }, index) => {
      const lineNumber = String(index + 1).padStart(2, "0");
      const isTarget = slot === targetSlot;
      const isPatched = slot !== "effect" && slot !== "final" && lastPatchedSlots.includes(slot);
      const marker = isTarget ? "CURRENT ERROR" : isPatched ? "PATCHED" : "";
      const classes = ["code-line", isTarget ? "is-target" : "", isPatched ? "is-patched" : ""].filter(Boolean).join(" ");

      return `
        <div class="${classes}">
          <span class="line-number">${lineNumber}</span>
          <span class="line-marker">${marker}</span>
          <code>${escapeHtml(line)}</code>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderGauge(label: string, value: number, min: number, max: number): string {
  const percent = clamp(((value - min) / (max - min)) * 100, 0, 100);
  return `
    <div class="gauge">
      <div class="gauge-label"><span>${label}</span><strong>${Math.round(value)}</strong></div>
      <div class="gauge-track"><span style="width: ${percent}%"></span></div>
    </div>
  `;
}

function characterForState(): string {
  if (stats.heartbeat > 210 || misses >= 2) {
    return "/assets/pl4-surprise.png";
  }
  if (stats.transmission >= 40) {
    return "/assets/pl4-shy.png";
  }
  return "/assets/pl4-normal.png";
}

function createCodeRain(): string {
  const snippets = ["const", "heart", "await", "勇気", "if", "send", "true", "好き", "compile", "0101"];
  return Array.from({ length: 42 }, (_, index) => {
    const left = (index * 13) % 100;
    const duration = 5 + (index % 7);
    const delay = -(index % 8);
    const text = snippets[index % snippets.length];
    return `<span style="left:${left}%; animation-duration:${duration}s; animation-delay:${delay}s">${text}</span>`;
  }).join("");
}

function spawnHearts(): void {
  const layer = document.createElement("div");
  layer.className = "heart-burst";
  layer.innerHTML = Array.from({ length: 18 }, (_, index) => `<i style="--i:${index}"></i>`).join("");
  app.append(layer);
  setTimeout(() => layer.remove(), 900);
}

function spawnWarning(): void {
  const warning = document.createElement("div");
  warning.className = "floating-warning";
  warning.textContent = "Syntax Error";
  app.append(warning);
  setTimeout(() => warning.remove(), 900);
}

function endGame(): void {
  stopTimer();
  currentScreen = "result";
  audio.compileBgm.pause();
  const result = selectResult();
  play(result.id === "success" ? audio.powerUp : audio.error);
  render();
}

function selectResult(): Result {
  if (stats.heartbeat >= 240 || timeLeft <= 0) {
    return results.find((result) => result.id === "runtimeError") ?? results[3];
  }

  if (misses >= 3 || stats.courage < 35) {
    return results.find((result) => result.id === "compileError") ?? results[2];
  }

  if (stats.transmission >= 60 && stats.courage >= 50 && stats.heartbeat < 190) {
    return results.find((result) => result.id === "success") ?? results[0];
  }

  return results.find((result) => result.id === "warning") ?? results[1];
}

function renderResult(result: Result): void {
  const success = result.id === "success" || result.id === "warning";
  app.innerHTML = `
    <main class="stage stage-result ${success ? "result-good" : "result-bad"}">
      <section class="result-panel">
        <p class="system-label">confession.result</p>
        <h1>${result.title}</h1>
        <p>${result.body}</p>
        <div class="result-stats">
          ${renderGauge("勇気", stats.courage, 0, 100)}
          ${renderGauge("心拍", stats.heartbeat, 80, 240)}
          ${renderGauge("伝達率", stats.transmission, 0, 100)}
        </div>
        <button class="primary-action" data-action="retry">再実行する</button>
      </section>
    </main>
  `;

  app.querySelector<HTMLButtonElement>("[data-action='retry']")?.addEventListener("click", () => {
    play(audio.click);
    currentScreen = "title";
    render();
  });
}

render();
