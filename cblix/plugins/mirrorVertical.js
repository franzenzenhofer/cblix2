// plugins/mirrorVertical.js

let mirrorVerticalCells = [];

export default {
  addCells(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE) {
    mirrorVerticalCells = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
    if(level > 2) {
      const probability=0.05;
      for (let y=0; y<GRID_SIZE; y++){
        for (let x=0; x<GRID_SIZE; x++){
          if((x===startCellX && y===startCellY)) continue;
          if(Math.random()<probability){
            mirrorVerticalCells[y][x]=true;
          }
        }
      }
    }
  },
  drawCell(ctx, cellSize, x, y) {
    if(mirrorVerticalCells[y] && mirrorVerticalCells[y][x]){
      ctx.fillText("⇵", x*cellSize+cellSize/2,y*cellSize+cellSize/2);
    }
  },
  applyEffects(x,y, board, effects) {
    if(mirrorVerticalCells[y] && mirrorVerticalCells[y][x]){
      // Flip visually only, do not change board coordinates
      effects.currentScaleY *= -1;
    }
  },
  isCellType(x,y) {
    return mirrorVerticalCells[y] && mirrorVerticalCells[y][x];
  }
};
