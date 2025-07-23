// plugins/penalty.js
let penaltyCells = [];

export default {
  addCells(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE) {
    penaltyCells = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
    if(level > 7) {
      let count = Math.floor(GRID_SIZE*GRID_SIZE*0.05);
      for (let i=0; i<count; i++){
        let x,y;
        do {
          x=Math.floor(Math.random()*GRID_SIZE);
          y=Math.floor(Math.random()*GRID_SIZE);
        } while(( (x===startCellX && y===startCellY)||(x===endCellX && y===endCellY) )|| penaltyCells[y][x]);
        penaltyCells[y][x] = true;
      }
    }
  },
  drawCell(ctx, cellSize, x, y) {
    if(penaltyCells[y] && penaltyCells[y][x]){
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.arc(x*cellSize+cellSize/2,y*cellSize+cellSize/2,cellSize*0.1,0,Math.PI*2);
      ctx.fill();
      // restore to original color done by main
      ctx.fillStyle=''; 
    }
  },
  applyEffects(x,y, board, effects) {
    if(penaltyCells[y] && penaltyCells[y][x]) {
      effects.MOVE_LIMIT = Math.max(effects.MOVE_LIMIT-1,1);
    }
  },
  isCellType(x,y) {
    return penaltyCells[y] && penaltyCells[y][x];
  }
};
