// Load blocked count
document.addEventListener('DOMContentLoaded', () => {
  const countElement = document.getElementById('blockedCount');
  chrome.storage.local.get(['blockedCount'], (result) => {
    const count = (result.blockedCount as number) || 0;
    if (countElement) {
      countElement.textContent = count.toLocaleString();
    }
  });
});

// Tetris Game
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 15;
const COLORS = [
  '#000000',
  '#00f0f0', // I - cyan
  '#0000f0', // J - blue
  '#f0a000', // L - orange
  '#f0f000', // O - yellow
  '#00f000', // S - green
  '#a000f0', // T - purple
  '#f00000', // Z - red
];

const SHAPES: number[][][] = [
  [], // empty for index 0
  [[1, 1, 1, 1]], // I
  [[2, 0, 0], [2, 2, 2]], // J
  [[0, 0, 3], [3, 3, 3]], // L
  [[4, 4], [4, 4]], // O
  [[0, 5, 5], [5, 5, 0]], // S
  [[0, 6, 0], [6, 6, 6]], // T
  [[7, 7, 0], [0, 7, 7]], // Z
];

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  color: number;
}

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let nextCanvas: HTMLCanvasElement;
let nextCtx: CanvasRenderingContext2D;
let board: number[][];
let currentPiece: Piece;
let nextPiece: Piece;
let score: number;
let lines: number;
let level: number;
let gameLoop: number | null;
let gameRunning: boolean;

function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function createPiece(typeIndex?: number): Piece {
  const type = typeIndex ?? Math.floor(Math.random() * 7) + 1;
  const shape = SHAPES[type].map(row => [...row]);
  return {
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
    color: type,
  };
}

function drawBlock(context: CanvasRenderingContext2D, x: number, y: number, color: number, size: number): void {
  context.fillStyle = COLORS[color];
  context.fillRect(x * size, y * size, size - 1, size - 1);

  // Add highlight
  context.fillStyle = 'rgba(255, 255, 255, 0.3)';
  context.fillRect(x * size, y * size, size - 1, 2);
  context.fillRect(x * size, y * size, 2, size - 1);

  // Add shadow
  context.fillStyle = 'rgba(0, 0, 0, 0.3)';
  context.fillRect(x * size + size - 3, y * size, 2, size - 1);
  context.fillRect(x * size, y * size + size - 3, size - 1, 2);
}

function drawBoard(): void {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw placed blocks
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        drawBlock(ctx, x, y, board[y][x], BLOCK_SIZE);
      }
    }
  }

  // Draw current piece
  if (currentPiece) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          drawBlock(ctx, currentPiece.x + x, currentPiece.y + y, currentPiece.color, BLOCK_SIZE);
        }
      }
    }
  }

  // Draw grid lines
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, 0);
    ctx.lineTo(x * BLOCK_SIZE, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK_SIZE);
    ctx.lineTo(canvas.width, y * BLOCK_SIZE);
    ctx.stroke();
  }
}

function drawNextPiece(): void {
  nextCtx.fillStyle = '#000';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (nextPiece) {
    const offsetX = (4 - nextPiece.shape[0].length) / 2;
    const offsetY = (4 - nextPiece.shape.length) / 2;

    for (let y = 0; y < nextPiece.shape.length; y++) {
      for (let x = 0; x < nextPiece.shape[y].length; x++) {
        if (nextPiece.shape[y][x]) {
          drawBlock(nextCtx, offsetX + x, offsetY + y, nextPiece.color, 15);
        }
      }
    }
  }
}

function collision(piece: Piece, offsetX = 0, offsetY = 0, newShape?: number[][]): boolean {
  const shape = newShape || piece.shape;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const newX = piece.x + x + offsetX;
        const newY = piece.y + y + offsetY;

        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }
        if (newY >= 0 && board[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

function rotate(piece: Piece): number[][] {
  const rotated: number[][] = [];
  for (let x = 0; x < piece.shape[0].length; x++) {
    const row: number[] = [];
    for (let y = piece.shape.length - 1; y >= 0; y--) {
      row.push(piece.shape[y][x]);
    }
    rotated.push(row);
  }
  return rotated;
}

function mergePiece(): void {
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        const boardY = currentPiece.y + y;
        if (boardY >= 0) {
          board[boardY][currentPiece.x + x] = currentPiece.color;
        }
      }
    }
  }
}

function clearLines(): number {
  let linesCleared = 0;

  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      y++; // Check same row again
    }
  }

  return linesCleared;
}

function updateScore(linesCleared: number): void {
  const points = [0, 100, 300, 500, 800];
  score += points[linesCleared] * level;
  lines += linesCleared;
  level = Math.floor(lines / 10) + 1;

  const scoreEl = document.getElementById('score');
  const linesEl = document.getElementById('lines');
  const levelEl = document.getElementById('level');

  if (scoreEl) scoreEl.textContent = score.toString();
  if (linesEl) linesEl.textContent = lines.toString();
  if (levelEl) levelEl.textContent = level.toString();
}

function gameOver(): void {
  gameRunning = false;
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
  }

  const gameOverEl = document.getElementById('gameOver');
  if (gameOverEl) {
    gameOverEl.style.display = 'block';
  }
}

function drop(): void {
  if (!collision(currentPiece, 0, 1)) {
    currentPiece.y++;
  } else {
    mergePiece();
    const linesCleared = clearLines();
    if (linesCleared > 0) {
      updateScore(linesCleared);
    }

    currentPiece = nextPiece;
    nextPiece = createPiece();
    drawNextPiece();

    if (collision(currentPiece)) {
      gameOver();
    }
  }
  drawBoard();
}

function moveLeft(): void {
  if (!collision(currentPiece, -1, 0)) {
    currentPiece.x--;
    drawBoard();
  }
}

function moveRight(): void {
  if (!collision(currentPiece, 1, 0)) {
    currentPiece.x++;
    drawBoard();
  }
}

function rotatePiece(): void {
  const rotated = rotate(currentPiece);
  if (!collision(currentPiece, 0, 0, rotated)) {
    currentPiece.shape = rotated;
    drawBoard();
  } else if (!collision(currentPiece, -1, 0, rotated)) {
    currentPiece.x--;
    currentPiece.shape = rotated;
    drawBoard();
  } else if (!collision(currentPiece, 1, 0, rotated)) {
    currentPiece.x++;
    currentPiece.shape = rotated;
    drawBoard();
  }
}

function hardDrop(): void {
  while (!collision(currentPiece, 0, 1)) {
    currentPiece.y++;
    score += 2;
  }
  const scoreEl = document.getElementById('score');
  if (scoreEl) scoreEl.textContent = score.toString();
  drop();
}

function handleKeyPress(e: KeyboardEvent): void {
  if (!gameRunning) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      moveLeft();
      break;
    case 'ArrowRight':
      e.preventDefault();
      moveRight();
      break;
    case 'ArrowDown':
      e.preventDefault();
      hardDrop();
      break;
    case 'ArrowUp':
      e.preventDefault();
      rotatePiece();
      break;
  }
}

function startGame(): void {
  board = createBoard();
  currentPiece = createPiece();
  nextPiece = createPiece();
  score = 0;
  lines = 0;
  level = 1;
  gameRunning = true;

  const gameOverEl = document.getElementById('gameOver');
  const startBtn2 = document.getElementById('startBtn2');
  if (gameOverEl) gameOverEl.style.display = 'none';
  if (startBtn2) startBtn2.style.display = 'none';

  updateScore(0);
  drawBoard();
  drawNextPiece();

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = window.setInterval(() => {
    drop();
  }, Math.max(100, 1000 - (level - 1) * 100));
}

function initTetris(): void {
  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  nextCanvas = document.getElementById('nextCanvas') as HTMLCanvasElement;
  nextCtx = nextCanvas.getContext('2d')!;

  board = createBoard();
  drawBoard();

  document.addEventListener('keydown', handleKeyPress);

  const startBtn = document.getElementById('startBtn');
  const startBtn2 = document.getElementById('startBtn2');
  if (startBtn) startBtn.addEventListener('click', startGame);
  if (startBtn2) startBtn2.addEventListener('click', startGame);
}

document.addEventListener('DOMContentLoaded', initTetris);
