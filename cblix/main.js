// main.js
import { vibrate, interpolateColor } from './utils.js';
import { isSoundOn, toggleSound, playSound, moveSound, successSound, failSound } from './audio.js';
import * as plugins from './plugins/index.js';
import rotationLeftPlugin from './plugins/rotationLeft.js';
import rotationRightPlugin from './plugins/rotationRight.js';
import flippingPlugin, { backupState, restoreState } from './plugins/flipping.js';

const BASE_COLORS = ["#F28B82","#CE93D8","#90CAF9","#A5D6A7","#FFCC80","#F48FB1","#80DEEA"];

let level = parseInt(localStorage.getItem('colorBridgeLevel'))||1;
if(isNaN(level)) level=1;
let soundOn = isSoundOn();

let GRID_SIZE, COLORS_COUNT;
let MOVE_LIMIT;
let initialMoveLimit;
let board = [];
let moves=0;
let gameOver=false;
let puzzleReady = false;

let visitedPenaltyCells = new Set();
let visitedRotationCells = new Set();
let visitedSpecialCells = new Set();

let startCellX=0, startCellY=0;
let endCellX=0, endCellY=0;
let minStepsUsed=0;
let initialBoard=null; 
let initialFlippingCells=null; 

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const colorBar = document.getElementById('colorBar');
const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const endMessage = document.getElementById('endMessage');
const endStats = document.getElementById('endStats');
const infoPanel = document.getElementById('infoPanel');
const muteBtn = document.getElementById('muteBtn');
const startButton = document.getElementById('startButton');
const resetBtn = document.getElementById('resetBtn');
const reloadBtn = document.getElementById('reloadBtn');
const movesMessage = document.getElementById('movesMessage');

const howToLink = document.getElementById('howToLink');
const howToOverlay = document.getElementById('howToOverlay');
const closeHowToBtn = howToOverlay.querySelector('.close-btn');

let highlightPhase=0;
let highlightSpeed=0.05;
let animationFrameId=null;
let currentRotation = 0;
let currentScaleX = 1; 
let currentScaleY = 1; 

howToLink.addEventListener('click', (e) => {
  e.preventDefault();
  howToOverlay.style.display = 'flex';
});

closeHowToBtn.addEventListener('click', () => {
  howToOverlay.style.display = 'none';
});

howToOverlay.addEventListener('click', () => {
  howToOverlay.style.display = 'none';
});

function updateDifficulty(){
  GRID_SIZE = 5 + Math.floor((level-1)/3);
  GRID_SIZE = Math.min(GRID_SIZE, 20);
  COLORS_COUNT = 5 + Math.floor((level-1)/5);
  if(COLORS_COUNT>7) COLORS_COUNT=7;
}

function setStartEndCells(){
  if(level <= 5){
    startCellX=0; startCellY=0;
    endCellX=GRID_SIZE-1; endCellY=GRID_SIZE-1;
    return;
  }
  let corners = [
    {sx:0,sy:0, ex:GRID_SIZE-1,ey:GRID_SIZE-1},
    {sx:GRID_SIZE-1,sy:0, ex:0,ey:GRID_SIZE-1},
    {sx:0,sy:GRID_SIZE-1, ex:GRID_SIZE-1,ey:0},
    {sx:GRID_SIZE-1,sy:GRID_SIZE-1, ex:0,ey:0}
  ];
  let choice = corners[Math.floor(Math.random()*corners.length)];
  startCellX = choice.sx;
  startCellY = choice.sy;
  endCellX = choice.ex;
  endCellY = choice.ey;
}

function invertColorMapping() {
  const COLORS = BASE_COLORS.slice(0,COLORS_COUNT);
  const reversed = COLORS.slice().reverse();
  let map = {};
  for (let i=0; i<COLORS.length; i++) {
    map[COLORS[i]] = reversed[i];
  }
  for (let y=0; y<GRID_SIZE; y++) {
    for (let x=0; x<GRID_SIZE; x++) {
      if (map[board[y][x]]) {
        board[y][x] = map[board[y][x]];
      }
    }
  }
  const canvasContainer = document.getElementById('gameCanvas');
  canvasContainer.classList.add('inversion-effect');
  setTimeout(() => {
    canvasContainer.classList.remove('inversion-effect');
  }, 1200);
}

function shuffleColorMapping() {
  const COLORS = BASE_COLORS.slice(0, COLORS_COUNT);
  const shuffled = COLORS.slice().sort(() => Math.random() - 0.5);
  let map = {};
  for (let i = 0; i < COLORS.length; i++) {
    map[COLORS[i]] = shuffled[i];
  }
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (map[board[y][x]]) {
        board[y][x] = map[board[y][x]];
      }
    }
  }
  const canvasContainer = document.getElementById('gameCanvas');
  canvasContainer.classList.add('chaos-effect');
  setTimeout(() => {
    canvasContainer.classList.remove('chaos-effect');
  }, 1200);

  // Also randomize the order of the color buttons:
  const colorButtons = Array.from(document.querySelectorAll('#colorBar .color-button'));
  for (let i = colorButtons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colorButtons[i], colorButtons[j]] = [colorButtons[j], colorButtons[i]];
  }
  colorButtons.forEach(btn => colorBar.appendChild(btn));
}

function getControlledRegion(b=board){
  if(!b||!b[0]) return [];
  let startColor=b[startCellY][startCellX];
  let visited=Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
  let stack=[[startCellX,startCellY]];
  let region=[];
  while(stack.length){
    let [x,y]=stack.pop();
    if(x<0||y<0||x>=GRID_SIZE||y>=GRID_SIZE)continue;
    if(visited[y][x]) continue;
    if(b[y][x]!=startColor) continue;
    visited[y][x]=true;
    region.push([x,y]);
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  return region;
}

function checkWin(){
  let region = getControlledRegion();
  return region.some(([xx,yy]) => xx===endCellX && yy===endCellY);
}

function floodFill(b,fromColor,toColor){
  let visited=Array.from({length:GRID_SIZE},()=>Array(GRID_SIZE).fill(false));
  let stack=[[startCellX,startCellY]];
  while(stack.length){
    let [x,y]=stack.pop();
    if(x<0||y<0||x>=GRID_SIZE||y>=GRID_SIZE) {
      console.log('floodFill skip: out of bounds', {x,y});
      continue;
    }
    if(visited[y][x]) {
      console.log('floodFill skip: already visited', {x,y});
      continue;
    }
    if(b[y][x]!=fromColor) {
      console.log('floodFill skip: color mismatch', {x,y, cellColor: b[y][x], expected: fromColor});
      continue;
    }
    let checkResult = plugins.canFloodChangeColor(x,y,fromColor,toColor,b);
    if(checkResult !== true) {
      console.log(`floodFill skip: ${checkResult} blocked color change at {x:${x},y:${y},fromColor:${fromColor},toColor:${toColor}}`);
      continue;
    }
    visited[y][x]=true;
    b[y][x]=toColor;
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
}


function countPenaltiesInRegion(b) {
  let region = getControlledRegion(b);
  let count = 0;
  for (let [x,y] of region) {
    if (plugins.isPenaltyCell(x,y)) count++;
  }
  return count;
}

function isSolvable() {
  const COLORS = BASE_COLORS.slice(0, COLORS_COUNT);

  function heuristic(b) {
    let region = getControlledRegion(b);
    let minDist = Infinity;
    for (let [xx, yy] of region) {
      let dist = Math.abs(xx - endCellX) + Math.abs(yy - endCellY);
      if (dist < minDist) minDist=dist;
    }
    return minDist;
  }

  function boardToString(b) {
    return b.map(row => row.join('')).join('|');
  }

  function applyColor(b, fromC, toC) {
    let copy = b.map(r => r.slice());
    let visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    let stack = [[startCellX, startCellY]];
    while (stack.length) {
      let [xx, yy] = stack.pop();
      if (xx < 0 || yy < 0 || xx >= GRID_SIZE || yy >= GRID_SIZE) continue;
      if (visited[yy][xx]) continue;
      if (copy[yy][xx] !== fromC) continue;
      let checkResult = plugins.canFloodChangeColor(xx,yy,fromC,toC,copy);
      if(checkResult !== true) continue;
      visited[yy][xx] = true;
      copy[yy][xx] = toC;
      stack.push([xx + 1, yy], [xx - 1, yy], [xx, yy + 1], [xx, yy - 1]);
    }
    return copy;
  }

  function checkGoal(b) {
    let startColor = b[startCellY][startCellX];
    let visited = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));
    let stack = [[startCellX, startCellY]];
    while (stack.length) {
      let [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) continue;
      if (visited[y][x]) continue;
      if (b[y][x] !== startColor) continue;
      visited[y][x] = true;
      if (x === endCellX && y === endCellY) return true;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return false;
  }

  if (checkGoal(board)) {
    minStepsUsed = countPenaltiesInRegion(board);
    return true;
  }

  let initialPenaltyCount = countPenaltiesInRegion(board);
  let initialCost = initialPenaltyCount;
  let initialBoardStr = boardToString(board);

  let visitedStates = new Map();
  visitedStates.set(initialBoardStr, initialCost);

  let heap = [];
  function heapPush(state) {
    heap.push(state);
    let idx = heap.length - 1;
    while (idx > 0) {
      let parent = (idx - 1) >> 1;
      if (heap[parent].priority <= heap[idx].priority) break;
      [heap[parent], heap[idx]] = [heap[idx], heap[parent]];
      idx = parent;
    }
  }

  function heapPop() {
    if (heap.length === 0) return null;
    let top = heap[0];
    let end = heap.pop();
    if (heap.length > 0) {
      heap[0] = end;
      let idx = 0;
      let length = heap.length;
      while (true) {
        let left = (idx << 1) + 1, right = left + 1;
        let smallest = idx;
        if (left < length && heap[left].priority < heap[smallest].priority) smallest = left;
        if (right < length && heap[right].priority < heap[smallest].priority) smallest = right;
        if (smallest === idx) break;
        [heap[idx], heap[smallest]] = [heap[smallest], heap[idx]];
        idx = smallest;
      }
    }
    return top;
  }

  let initialHeur = heuristic(board);
  heapPush({ b: board.map(r => r.slice()), depth: 0, cost: initialCost, priority: initialCost + initialHeur });

  let bestSolutionCost = Infinity;
  let foundSolution = false; 
  const startTime = Date.now();
  const TIME_LIMIT_MS = 3500;
  const MAX_EXPANSIONS = 50000;
  let expansions = 0;
  const BATCH_SIZE = 50;

  while (heap.length > 0) {
    if (Date.now() - startTime > TIME_LIMIT_MS) {
      if (foundSolution) {
        minStepsUsed = bestSolutionCost;
        return true;
      } else {
        return false;
      }
    }

    let currentBatch = [];
    for (let i=0; i<BATCH_SIZE && heap.length>0; i++) {
      let state = heapPop();
      if (state) currentBatch.push(state);
    }

    for (let {b, depth, cost} of currentBatch) {
      expansions++;
      if (expansions > MAX_EXPANSIONS) {
        if (foundSolution) {
          minStepsUsed = bestSolutionCost;
          return true;
        } else {
          return false;
        }
      }

      if (cost >= bestSolutionCost) continue;

      let startColor = b[startCellY][startCellX];
      for (let c of COLORS) {
        if (c === startColor) continue;
        let newBoard = applyColor(b, startColor, c);
        let newBoardStr = boardToString(newBoard);
        if (newBoardStr === boardToString(b)) continue; 
        let newDepth = depth + 1;
        let newPenaltyCount = countPenaltiesInRegion(newBoard);
        let newCost = newDepth + newPenaltyCount;

        if (checkGoal(newBoard)) {
          if (newCost < bestSolutionCost) {
            bestSolutionCost = newCost;
            foundSolution = true;
          }
          continue;
        }

        let prevCost = visitedStates.get(newBoardStr);
        if (prevCost !== undefined && prevCost <= newCost) {
          continue;
        }

        visitedStates.set(newBoardStr, newCost);
        if (newCost < bestSolutionCost) {
          let h = heuristic(newBoard);
          heapPush({ b: newBoard, depth: newDepth, cost: newCost, priority: newCost + h });
        }
      }
    }
  }

  if (foundSolution) {
    minStepsUsed = bestSolutionCost;
    return true;
  }
  return false;
}

function computeMoveLimit(level, minSteps) {
  if (level <= 100) {
    let extraPercentage = 0.25 * (1 - (level - 1) / 99); 
    let extraMoves = minSteps * extraPercentage;
    return Math.ceil(minSteps + extraMoves);
  } else {
    return minSteps;
  }
}

function updateInfoPanel(){
  infoPanel.textContent = `Lv${level} | ${moves}/${MOVE_LIMIT}`;
  let remaining = MOVE_LIMIT - moves;
  if(moves===0){
    movesMessage.textContent = `${remaining} moves`;
  } else {
    movesMessage.textContent = `${remaining} moves left`;
  }
}

function afterMoveCheck() {
  const overlayContent = document.querySelector('#endOverlay .overlay-content');
  overlayContent.querySelectorAll('button').forEach(btn => btn.remove());

  if (checkWin()) {
    gameOver = true;
    successSound();
    endMessage.textContent = "Level completed.";
    endStats.textContent = `Lv${level} was completed in ${moves} moves.`;

    const nextLevelBtn = document.createElement('button');
    nextLevelBtn.setAttribute('aria-label','Next Level');
    nextLevelBtn.textContent = "Next Level";
    nextLevelBtn.style.margin = "10px";
    nextLevelBtn.addEventListener('click', () => {
      nextLevelBtn.disabled = true;
      let tempColor = nextLevelBtn.style.backgroundColor;
      nextLevelBtn.style.backgroundColor = 'gray';
      endOverlay.style.display = 'none';
      level++;
      localStorage.setItem('colorBridgeLevel', level.toString());
      level = parseInt(localStorage.getItem('colorBridgeLevel')) || 1;
      if (isNaN(level)) level = 1;
      newLevel();
      nextLevelBtn.disabled = false;
      nextLevelBtn.style.backgroundColor = tempColor;
    });
    overlayContent.appendChild(nextLevelBtn);

    startConfetti();

    setTimeout(() => {
      endOverlay.style.display = 'flex';
    }, 750);
    return;
  }

  if (moves >= MOVE_LIMIT) {
    gameOver = true;
    failSound();
    endMessage.textContent = "✖";
    endStats.textContent = "Out of moves.";

    const tryAgainBtn = document.createElement('button');
    tryAgainBtn.setAttribute('aria-label','Try Again');
    tryAgainBtn.textContent = "Try Again";
    tryAgainBtn.style.margin = "10px";
    tryAgainBtn.addEventListener('click', () => {
      endOverlay.style.display = 'none';
      reloadCurrentLevel();
    });
    overlayContent.appendChild(tryAgainBtn);

    const newLevelBtn = document.createElement('button');
    newLevelBtn.setAttribute('aria-label','New Level');
    newLevelBtn.textContent = "New Level";
    newLevelBtn.style.margin = "10px";
    newLevelBtn.addEventListener('click', () => {
      newLevelBtn.disabled = true;
      let tempColor = newLevelBtn.style.backgroundColor;
      newLevelBtn.style.backgroundColor = 'gray';
      endOverlay.style.display = 'none';
      newLevel();
      newLevelBtn.style.backgroundColor = tempColor;
      newLevelBtn.disabled = false;
    });

    overlayContent.appendChild(newLevelBtn);
    setTimeout(() => {
      endOverlay.style.display = 'flex';
    }, 750);
    return;
  }
}

function pickColor(color){
  if(gameOver || !puzzleReady)return;
  let current=board[startCellY][startCellX];
  if(color===current){
    moveSound();
    vibrate(20);
    return;
  }

  vibrate(30);
  floodFill(board,current,color);
  moves++;

  // Now we repeatedly apply special cells until stable
  applySpecialCellsEffects();
  moveSound();
  updateInfoPanel();
  afterMoveCheck();
}

// UPDATED: applySpecialCellsEffects to run until no new cells claimed
function applySpecialCellsEffects(){
  let changed = true;
  while(changed) {
    changed = false;
    let region = getControlledRegion();
    let effects = { MOVE_LIMIT, currentRotation, currentScaleX, currentScaleY };
    let newClaims = 0;

    region.forEach(([x, y]) => {
      const cellKey = `${x}_${y}`;
      if (!visitedSpecialCells.has(cellKey)) {
        plugins.applyEffectsToCell(
          x, y,
          board,
          effects,
          invertColorMapping,
          vibrate,
          canvas,
          shuffleColorMapping
        );
        visitedSpecialCells.add(cellKey); 
        newClaims++;
      }
    });

    MOVE_LIMIT = effects.MOVE_LIMIT;
    currentRotation = effects.currentRotation;
    currentScaleX = effects.currentScaleX;
    currentScaleY = effects.currentScaleY;

    const transformString = `rotate(${currentRotation}deg) scale(${currentScaleX}, ${currentScaleY})`;
    canvas.style.transform = transformString;

    if (newClaims > 0) {
      changed = true;
    }
  }

  updateInfoPanel();
}

function initColorBar(){
  colorBar.innerHTML='';
  const COLORS = BASE_COLORS.slice(0,COLORS_COUNT);
  COLORS.forEach(c=>{
    const btn=document.createElement('div');
    btn.className='color-button';
    btn.style.backgroundColor=c;
    btn.setAttribute('tabindex','0');
    btn.setAttribute('role','button');
    btn.setAttribute('aria-label','Color');
    btn.addEventListener('click',()=>pickColor(c));
    btn.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') pickColor(c);
    });
    colorBar.appendChild(btn);
  });
}

function startGame(){
  startOverlay.style.display='none';
  newLevel();
}

function showTutorialHand() {
  try {
    if(level !== 1) return;
    const tutorialOverlay = document.getElementById('tutorialHandOverlay');
    const colorButtons = document.querySelectorAll('.color-button');
    if(!tutorialOverlay || colorButtons.length < 3) return;
    
    tutorialOverlay.style.display = 'block';
    tutorialOverlay.style.webkitTransform = 'translate(-50%, -50%)'; 
    
    const handIcon = tutorialOverlay.querySelector('.hand-icon');
    if(!handIcon) return;
    
    let step = 0;
    const steps = Array.from(colorButtons)
      .slice(0, 3)
      .map(btn => btn.getBoundingClientRect());

    function moveHandToRect(r) {
      if(!r) return;
      const top = (r.top + r.height/2 + 10);
      const left = (r.left + r.width/2);
      
      requestAnimationFrame(() => {
        tutorialOverlay.style.top = `${top}px`;
        tutorialOverlay.style.left = `${left}px`;
        tutorialOverlay.style.webkitTransform = `translate(-50%, -50%)`;
        tutorialOverlay.style.transform = `translate(-50%, -50%)`;
      });
    }

    moveHandToRect(steps[0]);

    const interval = setInterval(() => {
      step++;
      if(step < steps.length) {
        moveHandToRect(steps[step]);
      } else {
        clearInterval(interval);
        if(handIcon && handIcon.classList) {
          handIcon.classList.add('wiggle');
        }
        setTimeout(() => {
          if(tutorialOverlay) {
            tutorialOverlay.style.display = 'none';
          }
        }, 200);
      }
    }, 1000);

  } catch(e) {
    const tutorialOverlay = document.getElementById('tutorialHandOverlay');
    if(tutorialOverlay) tutorialOverlay.style.display = 'none';
  }
}

function startConfetti() {
  const confettiContainer = document.getElementById('confettiContainer');
  confettiContainer.innerHTML = '';
  const colors = ['#F28B82', '#CE93D8', '#90CAF9', '#A5D6A7', '#FFCC80', '#F48FB1', '#80DEEA'];
  const confettiCount = 100;

  for (let i = 0; i < confettiCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * 360;
    const distance = Math.random() * 200 + 50;

    piece.style.backgroundColor = color;
    piece.style.left = '50%';
    piece.style.top = '50%';
    piece.style.setProperty('--translate-x', `${distance * Math.cos(angle * Math.PI / 180)}px`);
    piece.style.setProperty('--translate-y', `${distance * Math.sin(angle * Math.PI / 180)}px`);
    piece.style.setProperty('--animation-duration', `${Math.random() * 1 + 2}s`);

    confettiContainer.appendChild(piece);
  }

  setTimeout(() => {
    confettiContainer.innerHTML = '';
  }, 3000);
}

function generateBoard(){
  board = [];
  const COLORS = BASE_COLORS.slice(0,COLORS_COUNT);
  for(let y=0; y<GRID_SIZE;y++){
    let row = [];
    for(let x=0;x<GRID_SIZE;x++){
      row.push(COLORS[Math.floor(Math.random()*COLORS.length)]);
    }
    board.push(row);
  }

  plugins.addCellsForAll(board, level, startCellX, startCellY, endCellX, endCellY, GRID_SIZE, COLORS_COUNT, BASE_COLORS);
}

function newLevel() {
  visitedPenaltyCells.clear();
  visitedRotationCells.clear();
  visitedSpecialCells.clear();
  gameOver = false;
  moves = 0;

  currentRotation = 0;
  currentScaleX = 1;
  currentScaleY = 1;
  canvas.style.transform = 'none';

  updateDifficulty();
  setStartEndCells();

  const startTime = Date.now();
  const MAX_LOAD_TIME = 3500;

  let attempt = 0;
  let solved = false;

  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'none';
  let overlayShown = false;
  
  const overlayTimeout = setTimeout(() => {
    loadingOverlay.style.display = 'flex';
    overlayShown = true;
  }, 200);

  while (!solved && attempt < 300) {
    generateBoard();
    if (level > 3 && !hasRotationCells()) {
      attempt++;
      continue;
    }
    if (level >= 10 && (!hasLeftRotationCell() || !hasRightRotationCell())) {
      attempt++;
      continue;
    }
    if (isSolvable()) {
      solved = true;
    } else {
      attempt++;
    }
    if (Date.now() - startTime > MAX_LOAD_TIME) {
      break;
    }
  }

  initialBoard = board.map(row => [...row]);
  MOVE_LIMIT = computeMoveLimit(level, minStepsUsed);
  initialMoveLimit = MOVE_LIMIT;

  puzzleReady = true;
  initColorBar();
  updateInfoPanel();

  initialFlippingCells = backupState();

  clearTimeout(overlayTimeout);
  loadingOverlay.style.display = 'none';

  if (level === 1) {
    showTutorialHand();
  }
}

function hasRotationCells(){
  for (let y=0;y<GRID_SIZE;y++){
    for(let x=0;x<GRID_SIZE;x++){
      if(plugins.isAnyRotationCell(x,y)) return true;
    }
  }
  return false;
}

function hasLeftRotationCell(){
  for (let y=0;y<GRID_SIZE;y++){
    for (let x=0;x<GRID_SIZE;x++){
      if(rotationLeftPlugin.isCellType(x, y)) return true; 
    }
  }
  return false;
}

function hasRightRotationCell(){
  for (let y=0;y<GRID_SIZE;y++){
    for (let x=0;x<GRID_SIZE;x++){
      if(rotationRightPlugin.isCellType(x,y)) return true;
    }
  }
  return false;
}

function reloadCurrentLevel(){
  if(!initialBoard) return;
  board = initialBoard.map(row=>[...row]);
  visitedPenaltyCells.clear();
  visitedRotationCells.clear();
  visitedSpecialCells.clear();
  moves=0;
  gameOver=false;
  puzzleReady=true;
  currentRotation=0;
  currentScaleX=1;
  currentScaleY=1;
  canvas.style.transform='none';
  MOVE_LIMIT = initialMoveLimit; 
  updateInfoPanel();
  restoreState(initialFlippingCells);
}

startButton.addEventListener('click',startGame);

muteBtn.addEventListener('click',()=>{
  toggleSound();
  muteBtn.textContent = isSoundOn()?'🔊':'🔇';
});

if(!soundOn) muteBtn.textContent='🔇';

resetBtn.addEventListener('click',()=>{
  level=1;
  localStorage.setItem('colorBridgeLevel','1');
  newLevel();
});

reloadBtn.addEventListener('click',()=>{
  reloadCurrentLevel();
});

function drawBoard(){
  if(!puzzleReady || !board || !board[0]) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    animationFrameId=requestAnimationFrame(drawBoard);
    return;
  }

  let size = Math.min(window.innerWidth, window.innerHeight)*0.9;
  canvas.width=size;
  canvas.height=size; 
  let cellSize=canvas.width/GRID_SIZE;

  for(let y=0;y<GRID_SIZE;y++){
    for(let x=0;x<GRID_SIZE;x++){
      ctx.fillStyle=board[y][x];
      ctx.fillRect(x*cellSize,y*cellSize,cellSize,cellSize);

      ctx.font = `${Math.floor(cellSize*0.4)}px sans-serif`;
      ctx.fillStyle='rgba(255,255,255,0.9)';
      ctx.textAlign='center';
      ctx.textBaseline='middle';

      plugins.drawAllSpecialCells(ctx, cellSize, x, y, board, startCellX, startCellY, endCellX, endCellY);

      if(x===startCellX && y===startCellY){
        ctx.fillText("Start", x*cellSize+cellSize/2,y*cellSize+cellSize/2);
      }
      if(x===endCellX && y===endCellY){
        ctx.fillText("Goal", x*cellSize+cellSize/2,y*cellSize+cellSize/2);
      }

      ctx.strokeStyle='rgba(255,255,255,0.15)';
      ctx.strokeRect(x*cellSize,y*cellSize,cellSize,cellSize);
    }
  }

  highlightPhase+=highlightSpeed;
  let t = (Math.sin(highlightPhase)+1)/2;

  let region=getControlledRegion(board);
  let edges=getRegionPerimeter(region);
  let flashColor1 = `rgba(255,255,255,0.5)`;
  let flashColor2 = `rgba(255,255,255,1)`;
  let currentFlashColor = interpolateColor(flashColor1, flashColor2, t);

  ctx.strokeStyle=currentFlashColor;
  ctx.lineWidth=2;
  ctx.beginPath();
  for(let e of edges){
    let x=e.x; let y=e.y;
    if(e.dir==="top"){
      ctx.moveTo(x*cellSize,y*cellSize);
      ctx.lineTo((x+1)*cellSize,y*cellSize);
    } else if(e.dir==="bottom"){
      ctx.moveTo(x*cellSize,(y+1)*cellSize);
      ctx.lineTo((x+1)*cellSize,(y+1)*cellSize);
    } else if(e.dir==="left"){
      ctx.moveTo(x*cellSize,y*cellSize);
      ctx.lineTo(x*cellSize,(y+1)*cellSize);
    } else if(e.dir==="right"){
      ctx.moveTo((x+1)*cellSize,y*cellSize);
      ctx.lineTo((x+1)*cellSize,(y+1)*cellSize);
    }
  }
  ctx.stroke();

  let goalFlash1 = `rgba(0,160,255,0.5)`;
  let goalFlash2 = `rgba(0,160,255,1)`;
  let goalFlashColor = interpolateColor(goalFlash1, goalFlash2, t);

  ctx.strokeStyle=goalFlashColor;
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.rect(endCellX*cellSize, endCellY*cellSize, cellSize, cellSize);
  ctx.stroke();

  animationFrameId=requestAnimationFrame(drawBoard);
}

function getRegionPerimeter(region){
  let setR=new Set(region.map(([x,y])=>x+"_"+y));
  let edges=[];
  for(let [x,y] of region){
    if(y===0 || !setR.has(x+"_"+(y-1))) edges.push({x,y,dir:"top"});
    if(y===GRID_SIZE-1 || !setR.has(x+"_"+(y+1))) edges.push({x,y,dir:"bottom"});
    if(x===0 || !setR.has((x-1)+"_"+y)) edges.push({x,y,dir:"left"});
    if(x===GRID_SIZE-1 || !setR.has((x+1)+"_"+y)) edges.push({x,y,dir:"right"});
  }
  return edges;
}

window.addEventListener('resize',()=>{});
animationFrameId=requestAnimationFrame(drawBoard);

window.addEventListener('unload', () => {
  if(animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});


// Add click event listener to print cell info
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(window.innerWidth, window.innerHeight)*0.9;
  const cellSize = size / GRID_SIZE;
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  const x = Math.floor(clickX / cellSize);
  const y = Math.floor(clickY / cellSize);
  
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return;
  
  const cellColor = board[y][x];
  const cellKey = `${x}_${y}`;
  
  const info = {
    coords: { x, y },
    color: cellColor,
    startCell: (x===startCellX && y===startCellY),
    endCell: (x===endCellX && y===endCellY),
    visitedSpecial: visitedSpecialCells.has(cellKey),
    isLocked: plugins.isLockedCell(x,y),
    isPenalty: plugins.isPenaltyCell(x,y),
    isRotation: plugins.isAnyRotationCell(x,y),
    isInversion: plugins.isInversionCell(x,y),
    isMirrorVertical: plugins.isMirrorVerticalCell(x,y),
    isMirrorHorizontal: plugins.isMirrorHorizontalCell(x,y)
  };
  
  console.log("Cell info:", info);
});
