const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
const nextCanvas = document.getElementById("nextPiece");
const nextContext = nextCanvas.getContext("2d");

const BLOCK_SIZE = 20;
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 30;

// 方块颜色
const COLORS = [
  null,
  "#FF0D72", // T
  "#0DC2FF", // I
  "#0DFF72", // S
  "#F538FF", // Z
  "#FF8E0D", // L
  "#FFE138", // J
  "#3877FF", // O
];

// 方块形状
const PIECES = [
  [
    [1, 1, 1],
    [0, 1, 0],
  ],
  [
    [0, 2, 0, 0],
    [0, 2, 0, 0],
    [0, 2, 0, 0],
    [0, 2, 0, 0],
  ],
  [
    [0, 3, 3],
    [3, 3, 0],
  ],
  [
    [4, 4, 0],
    [0, 4, 4],
  ],
  [
    [0, 0, 5],
    [5, 5, 5],
  ],
  [
    [6, 0, 0],
    [6, 6, 6],
  ],
  [
    [7, 7],
    [7, 7],
  ],
];

// 初始化游戏板
const board = Array(BOARD_HEIGHT)
  .fill()
  .map(() => Array(BOARD_WIDTH).fill(0));

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
  level: 1,
  nextPiece: null,
};

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let paused = false;
let gameOver = false;

// 基本绘制函数
function drawBlock(x, y, color, ctx = context) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = "#888";
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// 绘制游戏板
function draw() {
  // 清除画布
  context.fillStyle = "#000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制已固定的方块
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        drawBlock(x, y, COLORS[value]);
      }
    });
  });

  // 绘制当前方块
  if (player.matrix) {
    player.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(x + player.pos.x, y + player.pos.y, COLORS[value]);
        }
      });
    });
  }
}

// 碰撞检测
function collide() {
  if (!player.matrix) return false;

  for (let y = 0; y < player.matrix.length; y++) {
    for (let x = 0; x < player.matrix[y].length; x++) {
      if (
        player.matrix[y][x] !== 0 &&
        (board[y + player.pos.y] === undefined ||
          board[y + player.pos.y][x + player.pos.x] === undefined ||
          board[y + player.pos.y][x + player.pos.x] !== 0)
      ) {
        return true;
      }
    }
  }
  return false;
}

// 合并方块到游戏板
function merge() {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        board[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// 创建新方块
function createPiece() {
  const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
  return JSON.parse(JSON.stringify(piece));
}

// 重置玩家
function playerReset() {
  player.matrix = player.nextPiece || createPiece();
  player.nextPiece = createPiece();
  player.pos.y = 0;
  player.pos.x = Math.floor((BOARD_WIDTH - player.matrix[0].length) / 2);

  // 游戏结束检测
  if (collide()) {
    gameOver = true;
    alert("游戏结束！得分：" + player.score);
    return;
  }

  drawNextPiece();
}

// 绘制下一个方块
function drawNextPiece() {
  nextContext.fillStyle = "#000";
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (player.nextPiece) {
    const offsetX = 1;
    const offsetY = 1;
    player.nextPiece.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          drawBlock(x + offsetX, y + offsetY, COLORS[value], nextContext);
        }
      });
    });
  }
}

// 移动方块
function playerMove(dir) {
  player.pos.x += dir;
  if (collide()) {
    player.pos.x -= dir;
  }
}

// 下落方块
function playerDrop() {
  player.pos.y++;
  if (collide()) {
    player.pos.y--;
    merge();

    // 立即检查消行
    let sweepComplete = false;
    const checkSweep = () => {
      if (!sweepComplete) {
        arenaSweep();
        sweepComplete = true;
        playerReset();
      }
    };

    // 如果没有需要消除的行，立即重置玩家
    if (!board.some((row) => row.every((value) => value !== 0))) {
      playerReset();
    } else {
      // 否则等待消行动画完成
      setTimeout(checkSweep, 0);
    }
    return true;
  }
  return false;
}

// 修改旋转函数
function rotate(matrix) {
  // 处理特殊情况：长条形方块（I型方块）
  if (matrix.length === 4) {
    const N = matrix.length;
    const rotated = Array(N)
      .fill()
      .map(() => Array(N).fill(0));

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        rotated[x][N - 1 - y] = matrix[y][x];
      }
    }
    return rotated;
  }

  // 处理其他形状的方块
  const N = matrix.length;
  const M = matrix[0].length;
  const rotated = Array(M)
    .fill()
    .map(() => Array(N).fill(0));

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < M; x++) {
      rotated[x][N - 1 - y] = matrix[y][x];
    }
  }
  return rotated;
}

// 游戏主循环
function update(time = 0) {
  if (gameOver || paused) return;

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    playerDrop();
    dropCounter = 0;
  }

  draw();
  requestAnimationFrame(update);
}

// 键盘控制
document.addEventListener("keydown", (event) => {
  switch (event.keyCode) {
    case 37: // 左箭头
      if (!gameOver && !paused) {
        playerMove(-1);
      }
      break;
    case 39: // 右箭头
      if (!gameOver && !paused) {
        playerMove(1);
      }
      break;
    case 40: // 下箭头
      if (!gameOver && !paused) {
        playerDrop();
      }
      break;
    case 38: // 上箭头
      if (!gameOver && !paused) {
        const originalMatrix = JSON.parse(JSON.stringify(player.matrix));
        const rotated = rotate(player.matrix);
        const originalX = player.pos.x;
        const originalY = player.pos.y;

        player.matrix = rotated;

        // 如果旋转后发生碰撞，尝试调整位置
        let offset = 0;
        let success = false;

        // 尝试不同的水平偏移
        for (let i = 0; i < 2; i++) {
          offset = i * (offset <= 0 ? 1 : -1);
          player.pos.x += offset;

          if (!collide()) {
            success = true;
            break;
          }
          player.pos.x = originalX;

          // 尝试向上移动一格
          player.pos.y--;
          if (!collide()) {
            success = true;
            break;
          }
          player.pos.y = originalY;
        }

        // 如果所有尝试都失败，恢复原始状态
        if (!success) {
          player.matrix = originalMatrix;
          player.pos.x = originalX;
          player.pos.y = originalY;
        }
      }
      break;
    case 32: // 空格键
      paused = !paused;
      if (!paused) {
        lastTime = performance.now();
        update();
      }
      break;
  }
  draw();
});

// 开始游戏
playerReset();
update();

// 添加消行检测和处理函数
function arenaSweep() {
  let linesCleared = 0;
  let linesToClear = [];

  // 检查需要消除的行
  for (let y = board.length - 1; y >= 0; y--) {
    if (board[y].every((value) => value !== 0)) {
      linesToClear.push(y);
    }
  }

  if (linesToClear.length > 0) {
    // 逐行处理消除动画
    const processLine = (lineIndex) => {
      const y = linesToClear[lineIndex];

      // 单行闪烁动画
      let flashCount = 0;
      const flash = setInterval(() => {
        const row = board[y];
        for (let x = 0; x < row.length; x++) {
          if (row[x] !== 0) {
            context.fillStyle = flashCount % 2 === 0 ? "#FFF" : "#FF0";
            context.fillRect(
              x * BLOCK_SIZE,
              y * BLOCK_SIZE,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
          }
        }
        draw();

        flashCount++;
        if (flashCount >= 4) {
          clearInterval(flash);

          // ��除当前行
          const row = board.splice(y, 1)[0];
          board.unshift(row.fill(0));
          linesCleared++;

          // 处理下一行
          if (lineIndex + 1 < linesToClear.length) {
            setTimeout(() => {
              processLine(lineIndex + 1);
            }, 200);
          } else {
            // 所有行处理完毕，更新分数
            const scores = [0, 100, 300, 500, 800];
            player.score += scores[linesCleared] * player.level;

            // 更新等级
            const newLevel = Math.floor(player.score / 1000) + 1;
            if (newLevel !== player.level) {
              player.level = newLevel;
              dropInterval = Math.max(1000 - (player.level - 1) * 50, 100);
            }

            // 更新显示
            document.getElementById("score").textContent = player.score;
            document.getElementById("level").textContent = player.level;
          }
        }
      }, 150);
    };

    // 开始处理第一行
    processLine(0);
  }
}
