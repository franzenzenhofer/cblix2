// plugins/inversion.js
let inversionCells = [];

export default {
  addCells(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE) {
    inversionCells = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
    if(level > 3){
      const probability=0.05;
      for (let y=0; y<GRID_SIZE; y++){
        for (let x=0; x<GRID_SIZE; x++){
          if((x===startCellX && y===startCellY)) continue;
          if(Math.random()<probability){
            inversionCells[y][x]=true;
          }
        }
      }
    }
  },
  drawCell(ctx, cellSize, x, y) {
    if(inversionCells[y] && inversionCells[y][x]){
      ctx.fillText("∞", x*cellSize+cellSize/2,y*cellSize+cellSize/2);
    }
  },
  applyEffects(x, y, board, effects, invertColorMappingFn, vibrateFn, canvas, shuffleColorMappingFn) {
    if (inversionCells[y] && inversionCells[y][x]) {
      invertColorMappingFn();

      const canvasContainer = document.getElementById('gameCanvas');
      canvasContainer.classList.add('inversion-effect');
      setTimeout(() => {
        canvasContainer.classList.remove('inversion-effect');
      }, 1200);
    }
  },  blocksFloodChange(x, y, fromC, toC, board) {
    return false;
  },
  isCellType(x,y) {
    return inversionCells[y] && inversionCells[y][x];
  }
};
