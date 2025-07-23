// plugins/locked.js
// Handles locked cells
let lockedCells = [];

export default {
  pluginName: 'lockedPlugin',

  addCells(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE) {
    if(level > 1){
      lockedCells = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
      let count = Math.min((level-2), Math.floor(GRID_SIZE*GRID_SIZE*0.08));
      for(let i=0; i<count; i++){
        let x,y;
        do {
          x=Math.floor(Math.random()*GRID_SIZE);
          y=Math.floor(Math.random()*GRID_SIZE);
        } while((x===startCellX && y===startCellY) || lockedCells[y][x]); 
        lockedCells[y][x] = true;
      }
    } else {
      lockedCells = Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
    }
  },
  drawCell(ctx, cellSize, x, y) {
    if(lockedCells[y] && lockedCells[y][x]){
      ctx.strokeStyle='rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(x*cellSize,y*cellSize);
      ctx.lineTo((x+1)*cellSize,(y+1)*cellSize);
      ctx.moveTo((x+1)*cellSize,y*cellSize);
      ctx.lineTo(x*cellSize,(y+1)*cellSize);
      ctx.stroke();
    }
  },
  applyEffects(x,y, board, effects) {
    // Locked cells have no effects on region
  },
  blocksFloodChange(x,y,fromC,toC, board) {
    // Use isCellType for consistency, and add debug logging if blocked
    if (this.isCellType(x,y) && fromC!==toC) {
      console.log('Locked plugin blocking color change', {x, y, fromC, toC});
      return true;
    }
    return false;
  },
  isCellType(x,y) {
    return lockedCells[y] && lockedCells[y][x];
  }
};
