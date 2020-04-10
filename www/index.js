import { Universe } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";
// import { fps } from "./src/profiling";

const CELL_SIZE = 5;
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";
const MAX_SLOWDOWN = 1000;

const universe = Universe.new();
universe.set_width(128);
universe.set_height(128);
universe.random_seed();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext("2d");

let speed = MAX_SLOWDOWN;
let intervalId = null;
let tickAwaitingRender = false;
const tick = () => {
  if (!intervalId) {
    intervalId = setInterval(() => {
      universe.tick();
      tickAwaitingRender = true;
    }, speed);
  }
};
const stopTicking = () => {
  clearInterval(intervalId);
  intervalId = null;
};
const startTicking = () => {
  clearInterval(intervalId);
  intervalId = null;
  tick();
};

let animationId = null;
const renderLoop = () => {
  // fps.render();

  if (tickAwaitingRender) {
    drawGrid();
    drawCells();
    tickAwaitingRender = false;
  }

  animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines
  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const getIndex = (row, column) => {
  return row * width + column;
};

const bitIsSet = (n, arr) => {
  const byte = Math.floor(n / 8);
  const mask = 1 << n % 8;
  return (arr[byte] & mask) === mask;
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, (width * height) / 8);

  ctx.beginPath();

  ctx.fillStyle = ALIVE_COLOR;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);

      if (!bitIsSet(idx, cells)) continue;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.fillStyle = DEAD_COLOR;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = getIndex(row, col);

      if (bitIsSet(idx, cells)) continue;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

const isPaused = () => {
  return animationId === null;
};

const playPauseButton = document.getElementById("play-pause");

const play = () => {
  playPauseButton.textContent = "||";
  renderLoop();
  startTicking();
};

const pause = () => {
  playPauseButton.textContent = "▶";
  cancelAnimationFrame(animationId);
  animationId = null;
  stopTicking();
  drawGrid();
  drawCells();
};

playPauseButton.addEventListener("click", (event) => {
  if (isPaused()) {
    play();
  } else {
    pause();
  }
});

const clearButton = document.getElementById("clear");
clearButton.addEventListener("click", () => {
  universe.clear();
  drawGrid();
  drawCells();
});

const seedButton = document.getElementById("seed");
seedButton.addEventListener("click", () => {
  universe.random_seed();
  drawGrid();
  drawCells();
});

const speedInput = document.getElementById("speed-input");
speed = MAX_SLOWDOWN - speedInput.value;
speedInput.addEventListener("input", (event) => {
  speed = MAX_SLOWDOWN - event.target.value;
  startTicking();
});

let glider = [
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 1],
];
let pulsar = [
  [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
];
const injectForm = (form, row, col) => {
  let formHeight = form.length;
  let midH = Math.floor(formHeight / 2);
  let formWidth = form[0].length;
  let midW = Math.floor(formWidth / 2);

  for (let i = 0; i < formHeight; i++) {
    for (let j = 0; j < formWidth; j++) {
      let xPos = (col - midW + j + width) % width;
      let yPos = (row - midH + i + height) % height;
      if (form[i][j]) {
        universe.turn_cell_on(yPos, xPos);
      } else {
        universe.turn_cell_off(yPos, xPos);
      }
    }
  }
};

canvas.addEventListener("click", (event) => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  if (event.metaKey) {
    injectForm(glider, row, col);
  } else if (event.shiftKey) {
    injectForm(pulsar, row, col);
  } else {
    universe.toggle_cell(row, col);
  }

  drawGrid();
  drawCells();
});

drawGrid();
drawCells();
play();
