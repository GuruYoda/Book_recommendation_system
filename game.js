const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const startBtn = document.getElementById("start-btn");

const GRID = 20;
const CELL = canvas.width / GRID;
const TICK_MS = 110;
const HIGH_SCORE_KEY = "snake-high-score";

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

let snake;
let direction;
let nextDirection;
let food;
let score;
let highScore;
let loopId;
let state;

function loadHighScore() {
  const saved = Number(localStorage.getItem(HIGH_SCORE_KEY));
  highScore = Number.isFinite(saved) ? saved : 0;
  highScoreEl.textContent = String(highScore);
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  score = 0;
  scoreEl.textContent = "0";
  spawnFood();
}

function spawnFood() {
  let spot;
  do {
    spot = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  } while (snake.some((segment) => segment.x === spot.x && segment.y === spot.y));
  food = spot;
}

function showOverlay(title, message, buttonText) {
  overlayTitle.textContent = title;
  overlayMessage.innerHTML = message;
  startBtn.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function setState(nextState) {
  state = nextState;
}

function startLoop() {
  clearInterval(loopId);
  loopId = setInterval(tick, TICK_MS);
}

function stopLoop() {
  clearInterval(loopId);
  loopId = null;
}

function tick() {
  if (state !== "playing") return;

  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    return gameOver();
  }

  if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 1;
    scoreEl.textContent = String(score);
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = String(highScore);
      localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
    }
    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function gameOver() {
  stopLoop();
  setState("gameover");
  showOverlay(
    "Game Over",
    `Score: <strong>${score}</strong><br>Press Play or <kbd>R</kbd> to try again.`,
    "Play Again"
  );
}

function pauseGame() {
  if (state !== "playing") return;
  stopLoop();
  setState("paused");
  showOverlay("Paused", "Press Space or click Play to continue.", "Resume");
}

function resumeGame() {
  hideOverlay();
  setState("playing");
  startLoop();
}

function startGame() {
  resetGame();
  hideOverlay();
  setState("playing");
  draw();
  startLoop();
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--grid");
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i += 1) {
    const pos = i * CELL;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawCell(x, y, color) {
  const padding = 1;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + padding, y * CELL + padding, CELL - padding * 2, CELL - padding * 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  snake.forEach((segment, index) => {
    drawCell(
      segment.x,
      segment.y,
      index === 0
        ? getComputedStyle(document.documentElement).getPropertyValue("--snake-head")
        : getComputedStyle(document.documentElement).getPropertyValue("--snake-body")
    );
  });

  drawCell(
    food.x,
    food.y,
    getComputedStyle(document.documentElement).getPropertyValue("--food")
  );
}

function queueDirection(key) {
  const next = DIRECTIONS[key];
  if (!next) return;

  const combined = nextDirection || direction;
  const opposite = combined.x + next.x === 0 && combined.y + next.y === 0;
  if (!opposite) {
    nextDirection = next;
  }
}

function handleKeydown(event) {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === " " || key === "Spacebar") {
    event.preventDefault();
    if (state === "idle" || state === "gameover") {
      startGame();
    } else if (state === "playing") {
      pauseGame();
    } else if (state === "paused") {
      resumeGame();
    }
    return;
  }

  if (key === "r" || key === "R") {
    startGame();
    return;
  }

  if (state === "playing") {
    queueDirection(key);
  }
}

startBtn.addEventListener("click", () => {
  if (state === "paused") {
    resumeGame();
  } else {
    startGame();
  }
});

document.addEventListener("keydown", handleKeydown);

loadHighScore();
resetGame();
draw();
setState("idle");
showOverlay(
  "Snake",
  "Eat the red food. Don't hit the walls or yourself.<br>Press Space or click Play to start.",
  "Play"
);
