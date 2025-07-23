import type { GameEngine } from '@engine/GameEngine';
import type { AudioManager } from '@utils/AudioManager';

interface GameScreenConfig {
  gameEngine: GameEngine;
  audioManager: AudioManager;
  onBack: () => void;
  onGameOver: (victory: boolean, score: number) => void;
}

export class GameScreen {
  private container: HTMLElement;
  private config: GameScreenConfig;
  
  constructor(config: GameScreenConfig) {
    this.config = config;
    this.container = document.createElement('div');
    this.container.className = 'game-screen';
    this.render();
  }
  
  getElement(): HTMLElement {
    return this.container;
  }
  
  private render(): void {
    this.container.innerHTML = `
      <div class="game-header">
        <button class="btn-secondary" id="back-btn">← Back</button>
        <div class="game-info">
          <span>Level: 1</span>
          <span>Moves: 0</span>
          <span>Score: 0</span>
        </div>
      </div>
      
      <div class="game-board-container">
        <canvas id="game-canvas" width="600" height="600"></canvas>
      </div>
      
      <div class="color-palette">
        <!-- Color buttons will be added dynamically -->
      </div>
      
      <div class="game-controls">
        <button class="btn-secondary">Undo</button>
        <button class="btn-secondary">Redo</button>
        <button class="btn-secondary">Hint</button>
      </div>
    `;
    
    this.attachEventListeners();
  }
  
  private attachEventListeners(): void {
    const backBtn = this.container.querySelector('#back-btn');
    backBtn?.addEventListener('click', () => this.config.onBack());
  }
}