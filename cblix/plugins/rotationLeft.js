// plugins/rotationLeft.js

let rotationCellsLeft = [];

export default {
  addCells(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE) {
    rotationCellsLeft = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
    if (level > 0) {
      const probability = 0.15;
      for (let y=0; y<GRID_SIZE; y++){
        for (let x=0;x<GRID_SIZE;x++){
          if((x===startCellX && y===startCellY)) continue;
          if (Math.random() < probability) {
            if (Math.random()<0.5) {
              rotationCellsLeft[y][x] = true; 
            }
          }
        }
      }
    }
  },
  drawCell(ctx, cellSize, x, y) {
    if(rotationCellsLeft[y] && rotationCellsLeft[y][x]){
      ctx.fillText("↺", x*cellSize+cellSize/2,y*cellSize+cellSize/2);
    }
  },
  applyEffects(x,y, board, effects) {
    if(rotationCellsLeft[y] && rotationCellsLeft[y][x]){
      // Decrease visual rotation only, do not change the board array
      effects.currentRotation -= 90;
    }
  },
  isCellType(x,y) {
    return rotationCellsLeft[y] && rotationCellsLeft[y][x];
  }
};
