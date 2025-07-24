import type { GameEngine } from '../../engine/GameEngine';
import type { AudioManager } from '../../utils/AudioManager';
import type { Position } from '../../types';

interface GameScreenConfig {
  gameEngine: GameEngine;
  audioManager: AudioManager;
  onBack: () => void;
  onGameOver: (victory: boolean, score: number) => void;
}

export class GameScreen {
  private container: HTMLElement;
  private config: GameScreenConfig;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private cellSize: number = 60;
  private padding: number = 20;
  private animationFrameId: number | null = null;
  
  constructor(config: GameScreenConfig) {
    this.config = config;
    this.container = document.createElement('div');
    this.container.className = 'game-screen';
    this.render();
    this.startGameLoop();
  }
  
  getElement(): HTMLElement {
    return this.container;
  }
  
  private render(): void {
    this.container.innerHTML = `
      <div class="game-header">
        <button class="btn-secondary" id="back-btn">← Back</button>
        <div class="game-info">
          <span>Level: <span id="levelDisplay">1</span></span>
          <span>Moves: <span id="movesDisplay">0</span>/<span id="limitDisplay">0</span></span>
          <span>Score: <span id="scoreDisplay">0</span></span>
        </div>
      </div>
      
      <div class="game-board-container">
        <canvas id="game-canvas"></canvas>
      </div>
      
      <div class="color-palette" id="colorPalette">
        <!-- Color buttons will be added dynamically -->
      </div>
      
      <div class="game-controls">
        <button class="btn-secondary" id="resetBtn">Reset</button>
        <button class="btn-secondary" id="undoBtn">Undo</button>
        <button class="btn-secondary" id="hintBtn">Hint</button>
      </div>
      
      <div class="game-message" id="gameMessage"></div>
    `;
    
    this.canvas = this.container.querySelector('#game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d') || null;
    
    this.attachEventListeners();
    this.updateColorPalette();
  }
  
  private attachEventListeners(): void {
    const backBtn = this.container.querySelector('#back-btn');
    backBtn?.addEventListener('click', () => this.config.onBack());
    
    const resetBtn = this.container.querySelector('#resetBtn');
    resetBtn?.addEventListener('click', () => {
      this.config.gameEngine.reset();
      this.updateDisplay();
    });
  }
  
  private startGameLoop(): void {
    const gameLoop = () => {
      this.updateDisplay();
      this.animationFrameId = requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }
  
  private updateDisplay(): void {
    const gameState = this.config.gameEngine.getGameState();
    if (!gameState) {return;}
    
    // Update info display
    const levelEl = this.container.querySelector('#levelDisplay');
    const movesEl = this.container.querySelector('#movesDisplay');
    const limitEl = this.container.querySelector('#limitDisplay');
    const scoreEl = this.container.querySelector('#scoreDisplay');
    
    if (levelEl) {levelEl.textContent = gameState.level.toString();}
    if (movesEl) {movesEl.textContent = gameState.moves.toString();}
    if (limitEl) {limitEl.textContent = gameState.moveLimit.toString();}
    if (scoreEl) {scoreEl.textContent = gameState.score.toString();}
    
    // Draw game board
    this.drawBoard(gameState);
    
    // Update color palette
    this.updateColorPalette();
    
    // Show game over message if needed
    if (gameState.gameOver) {
      this.showGameOverMessage(gameState.won, gameState.score);
    }
  }
  
  private drawBoard(gameState: { board: string[][], controlledRegion: Position[], startPosition: Position, endPosition: Position }): void {
    if (!this.canvas || !this.ctx) {return;}
    
    const board = gameState.board;
    const gridSize = board.length;
    
    // Make canvas responsive
    const container = this.canvas.parentElement;
    if (container) {
      const maxSize = Math.min(container.clientWidth - 40, container.clientHeight - 40, 600);
      this.cellSize = Math.floor((maxSize - 2 * this.padding) / gridSize);
    }
    
    const canvasSize = gridSize * this.cellSize + this.padding * 2;
    
    // Set canvas size
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;
    
    // Clear canvas
    this.ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-primary').trim() || '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw cells
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cellX = this.padding + x * this.cellSize;
        const cellY = this.padding + y * this.cellSize;
        
        // Draw cell background
        this.ctx.fillStyle = board[y][x];
        this.ctx.fillRect(cellX, cellY, this.cellSize - 2, this.cellSize - 2);
        
        // Highlight controlled region
        const isControlled = gameState.controlledRegion.some(
          (pos: Position) => pos.x === x && pos.y === y
        );
        if (isControlled) {
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 3;
          this.ctx.strokeRect(cellX + 1, cellY + 1, this.cellSize - 4, this.cellSize - 4);
        }
        
        // Draw start/end markers
        if (x === gameState.startPosition.x && y === gameState.startPosition.y) {
          this.drawMarker(cellX, cellY, 'S', '#000000');
        } else if (x === gameState.endPosition.x && y === gameState.endPosition.y) {
          this.drawMarker(cellX, cellY, 'E', '#000000');
        }
      }
    }
  }
  
  private drawMarker(x: number, y: number, text: string, color: string): void {
    if (!this.ctx) {return;}
    
    this.ctx.fillStyle = color;
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + this.cellSize / 2, y + this.cellSize / 2);
  }
  
  private updateColorPalette(): void {
    const palette = this.container.querySelector('#colorPalette');
    if (!palette) {return;}
    
    const colors = this.config.gameEngine.getAvailableColors();
    const gameState = this.config.gameEngine.getGameState();
    
    palette.innerHTML = '';
    colors.forEach((color: string) => {
      const button = document.createElement('button');
      button.className = 'color-button';
      button.style.backgroundColor = color;
      
      if (gameState && color === gameState.currentColor) {
        button.classList.add('selected');
      }
      
      button.addEventListener('click', () => {
        this.config.gameEngine.selectColor(color);
        this.config.audioManager.playSound('click');
        this.updateColorPalette();
      });
      
      palette.appendChild(button);
    });
  }
  
  private showGameOverMessage(won: boolean, score: number): void {
    const messageDiv = this.container.querySelector('#gameMessage') as HTMLDivElement;
    if (!messageDiv) {return;}
    
    messageDiv.innerHTML = `
      <div class="game-over-content">
        <h2>${won ? '🎉 You Won!' : '😢 Game Over'}</h2>
        <p>Score: ${score}</p>
        <button class="btn-primary" id="nextBtn">
          ${won ? 'Next Level' : 'Try Again'}
        </button>
      </div>
    `;
    
    messageDiv.style.display = 'flex';
    
    const nextBtn = messageDiv.querySelector('#nextBtn');
    nextBtn?.addEventListener('click', async () => {
      const gameState = this.config.gameEngine.getGameState();
      if (gameState) {
        await this.config.gameEngine.startNewGame(
          won ? gameState.level + 1 : gameState.level
        );
        messageDiv.style.display = 'none';
        this.updateColorPalette();
      }
    });
    
    this.config.onGameOver(won, score);
  }
  
  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}