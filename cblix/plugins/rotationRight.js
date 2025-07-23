// plugins/rotationRight.js

let rotationCellsRight = [];

export default {
  addCells(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE) {
    rotationCellsRight = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
    if (level > 0) {
      const probability = 0.15;
      for (let y=0; y<GRID_SIZE; y++){
        for (let x=0; x<GRID_SIZE; x++){
          if ((x===startCellX && y===startCellY)) continue;
          if (Math.random() < probability) {
            if (Math.random()>=0.5) {
              rotationCellsRight[y][x] = true;
            }
          }
        }
      }
    }
  },
  drawCell(ctx, cellSize, x, y) {
    if(rotationCellsRight[y] && rotationCellsRight[y][x]){
      ctx.fillText("↻", x*cellSize+cellSize/2,y*cellSize+cellSize/2);
    }
  },
  applyEffects(x,y, board, effects) {
    if(rotationCellsRight[y] && rotationCellsRight[y][x]){
      // Increase visual rotation only, do not change the board array
      effects.currentRotation += 90;
    }
  },
  isCellType(x,y) {
    return rotationCellsRight[y] && rotationCellsRight[y][x];
  }
};
