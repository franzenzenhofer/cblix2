// flipping.js
let flippingCells = [];
let initialFlippingCellsBackup = null;

export function backupState() {
  // Deep copy flippingCells
  return flippingCells.map(row => row.map(cell => {
    if (!cell) return null;
    return { ...cell };
  }));
}

export function restoreState(state) {
  // Set flippingCells from state
  flippingCells = state.map(row => row.map(cell => cell ? { ...cell } : null));

  // Reset lastFlipTimestamp to "now" for a fresh start
  const now = performance.now();
  for (let y=0; y<flippingCells.length; y++){
    for (let x=0; x<flippingCells[y].length; x++){
      if (flippingCells[y][x]) {
        flippingCells[y][x].lastFlipTimestamp = now;
        flippingCells[y][x].angle = 0;
        // Assume the cell starts flipping as initially set
      }
    }
  }
}

export default {
  addCells(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE, COLORS_COUNT, BASE_COLORS) {
    flippingCells = Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(null));
    if (level > 3) {
      const baseProb = 0.05 + ((level - 5)*0.01);
      const prob = Math.min(baseProb, 0.15);
      const availableColors = BASE_COLORS.slice(0, COLORS_COUNT);

      for (let y=0; y<GRID_SIZE; y++){
        for (let x=0; x<GRID_SIZE; x++){
          if (Math.random() < prob) {
            const frontIndex = Math.floor(Math.random()*availableColors.length);
            let backIndex;
            do {
              backIndex = Math.floor(Math.random()*availableColors.length);
            } while (backIndex === frontIndex);

            const frontColor = availableColors[frontIndex];
            const backColor = availableColors[backIndex];

            const interval = 2000 + Math.random()*2000; // 2-4s
            const flipSpeed = 0.05;

            flippingCells[y][x] = {
              frontColor,
              backColor,
              angle: 0,
              flipping: true,
              currentSide: 'front',
              flipSpeed,
              pauseDuration: interval,
              lastFlipTimestamp: performance.now(),
              claimed: false,
              waiting: false
            };

            // Initially, board shows the frontColor (stable)
            board[y][x] = frontColor;
          }
        }
      }
    }
  },

  drawCell(ctx, cellSize, x, y, board) {
    const cellData = flippingCells[y] && flippingCells[y][x];
    if (!cellData) return; // Not flipping cell

    if (cellData.claimed) {
      // Claimed means normal cell now. 
      // The board color was set to the final visible side at the moment of claiming.
      // Just draw the current board color.
      ctx.fillStyle = board[y][x];
      ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
      return;
    }

    const now = performance.now();

    // Handle waiting logic
    if (cellData.waiting) {
      if (now - cellData.lastFlipTimestamp >= cellData.pauseDuration) {
        cellData.flipping = true;
        cellData.waiting = false;
      }
    }

    // Perform flip if flipping
    if (cellData.flipping) {
      cellData.angle += cellData.flipSpeed;
      if (cellData.angle >= Math.PI) {
        // Completed a half-turn (front to back or back to front)
        cellData.angle = 0;
        cellData.currentSide = (cellData.currentSide === 'front') ? 'back' : 'front';
        cellData.flipping = false;
        cellData.waiting = true;
        cellData.lastFlipTimestamp = now;

        // Now update the board with the newly visible side's color
        const newColor = (cellData.currentSide === 'front') ? cellData.frontColor : cellData.backColor;
        board[y][x] = newColor;
      }
    }

    // Visual interpolation: 
    // Compute visibleColor based on angle, just for drawing, not for game logic
    const degrees = cellData.angle * (180 / Math.PI);
    let visibleColor;
    // If angle < 90°, show currentSide's color
    // If angle > 90°, show opposite side's color
    if (degrees < 90) {
      visibleColor = (cellData.currentSide === 'front') ? cellData.frontColor : cellData.backColor;
    } else {
      visibleColor = (cellData.currentSide === 'front') ? cellData.backColor : cellData.frontColor;
    }

    // Draw flipping animation
    ctx.fillStyle = "black";
    ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);

    ctx.save();
    const centerX = x*cellSize + cellSize/2;
    const centerY = y*cellSize + cellSize/2;
    const scaleX = Math.cos(cellData.angle);
    ctx.translate(centerX, centerY);
    ctx.scale(scaleX, 1);
    ctx.translate(-centerX, -centerY);

    ctx.fillStyle = visibleColor;
    ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
    ctx.restore();
  },

  applyEffects(x, y, board, effects) {
    const cellData = flippingCells[y] && flippingCells[y][x];
    if (!cellData) return;
    cellData.claimed = true;
    // Once claimed, remove from flippingCells so it's now just a normal cell
    flippingCells[y][x] = null;
    // board[y][x] is already set to the final visible color at last flip completion
  },

  blocksFloodChange(x, y, fromC, toC, board) {
    // Flipping cells do not block flood changes
    return false;
  },

  isCellType(x, y) {
    return flippingCells[y] && flippingCells[y][x] !== null;
  }
};
