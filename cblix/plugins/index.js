// plugins/index.js
import lockedPlugin from './locked.js';
import penaltyPlugin from './penalty.js';
import rotationLeftPlugin from './rotationLeft.js';
import rotationRightPlugin from './rotationRight.js';
import mirrorVerticalPlugin from './mirrorVertical.js';
import mirrorHorizontalPlugin from './mirrorHorizontal.js';
import inversionPlugin from './inversion.js';
import flippingPlugin from './flipping.js';
import chaosPlugin from './chaos.js';

const plugins = [
  penaltyPlugin,
  rotationLeftPlugin,
  rotationRightPlugin,
  mirrorVerticalPlugin,
  mirrorHorizontalPlugin,
  inversionPlugin,
  flippingPlugin,
  chaosPlugin,
  lockedPlugin
];

// Removed rotateBoardLeft, rotateBoardRight, flipBoardVertically, flipBoardHorizontally functions
// since we no longer manipulate the board array for visual effects.

export function addCellsForAll(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE, COLORS_COUNT, BASE_COLORS){
  plugins.forEach(plugin => {
    plugin.addCells(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE, COLORS_COUNT, BASE_COLORS);
  });
  
  const invalidCells = new Set();
  for (let y=0; y<GRID_SIZE; y++){
    for (let x=0; x<GRID_SIZE; x++){
      let count=0;
      for (let plugin of plugins) {
        if (plugin.isCellType(x,y)) count++;
      }

      const isStartOrEnd = (x===startCellX && y===startCellY) || (x===endCellX && y===endCellY);
      if (count > 1 || isStartOrEnd) {
        invalidCells.add(`${x}_${y}`);
      }
    }
  }

  if (invalidCells.size > 0) {
    for (let i=0; i<plugins.length; i++){
      const plugin = plugins[i];

      if (plugin.drawCell) {
        const originalDrawCell = plugin.drawCell;
        plugin.drawCell = function(ctx, cellSize, x, y, ...rest) {
          if (invalidCells.has(`${x}_${y}`)) {
            return;
          }
          return originalDrawCell.call(plugin, ctx, cellSize, x, y, ...rest);
        };
      }

      if (plugin.applyEffects) {
        const originalApplyEffects = plugin.applyEffects;
        plugin.applyEffects = function(x, y, board, effects, ...rest) {
          if (invalidCells.has(`${x}_${y}`)) {
            return;
          }
          return originalApplyEffects.call(plugin, x, y, board, effects, ...rest);
        };
      }

      const originalIsCellType = plugin.isCellType;
      plugin.isCellType = function(x,y) {
        if (invalidCells.has(`${x}_${y}`)) {
          return false;
        }
        return originalIsCellType.call(plugin,x,y);
      };
    }
  }
}

export function drawAllSpecialCells(ctx, cellSize, x, y, board, startCellX, startCellY, endCellX, endCellY){
  plugins.forEach(plugin=>{
    plugin.drawCell(ctx, cellSize, x, y, board, startCellX, startCellY, endCellX, endCellY);
  });
}

export function applyEffectsToRegion(region, board, MOVE_LIMIT, currentRotation, currentScaleX, currentScaleY, invertColorMappingFn, vibrateFn, canvas, shuffleColorMappingFn) {
  let effects = {
    MOVE_LIMIT, currentRotation, currentScaleX, currentScaleY
  };
  for (let [x, y] of region) {
    applyEffectsToCell(x, y, board, effects, invertColorMappingFn, vibrateFn, canvas, shuffleColorMappingFn);
  }
  return effects;
}

export function applyEffectsToCell(x, y, board, effects, invertColorMappingFn, vibrateFn, canvas, shuffleColorMappingFn) {
  plugins.forEach(plugin => {
    if (plugin.isCellType(x, y) && plugin.applyEffects) {
      plugin.applyEffects(x, y, board, effects, invertColorMappingFn, vibrateFn, canvas, shuffleColorMappingFn);
    }
  });
}

export function canFloodChangeColor(x,y,fromC,toC, board) {
  for (let plugin of plugins) {
    if (plugin.blocksFloodChange && plugin.blocksFloodChange(x,y,fromC,toC, board)) {
      // Return the plugin name that blocked the change
      return plugin.pluginName || 'unknownPlugin';
    }
  }
  return true;
}

export function isGoalReached(board, startCellX, startCellY, endCellX, endCellY) {
  return false; 
}

export function isPenaltyCell(x,y) {
  return penaltyPlugin.isCellType(x,y);
}

export function isLockedCell(x,y) {
  return lockedPlugin.isCellType(x,y);
}

export function isAnyRotationCell(x,y) {
  return rotationLeftPlugin.isCellType(x,y) || rotationRightPlugin.isCellType(x,y);
}

export function isInversionCell(x,y) {
  return inversionPlugin.isCellType(x,y);
}

export function isMirrorVerticalCell(x,y) {
  return mirrorVerticalPlugin.isCellType(x,y);
}

export function isMirrorHorizontalCell(x,y) {
  return mirrorHorizontalPlugin.isCellType(x,y);
}
