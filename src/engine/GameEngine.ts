import type { Position, GameSettings } from '../types';

interface SimpleGameConfig {
  colors: string[];
  settings?: GameSettings;
}

interface SimpleGameState {
  board: string[][];
  currentColor: string;
  moves: number;
  moveLimit: number;
  gameOver: boolean;
  won: boolean;
  startPosition: Position;
  endPosition: Position;
  controlledRegion: Position[];
  score: number;
  level: number;
  selectedPowerUp: null;
  activePowerUps: unknown[];
  achievements: unknown[];
  settings: GameSettings;
}

export class GameEngine {
  private gameState: SimpleGameState | null = null;
  private initialBoard: string[][] | null = null;
  private visitedSpecialCells: Set<string> = new Set();
  
  constructor(private config: SimpleGameConfig) {}
  
  async startNewGame(level: number = 1): Promise<void> {
    const gridSize = this.calculateGridSize(level);
    const colorsCount = this.calculateColorsCount(level);
    const moveLimit = this.calculateMoveLimit(level);
    
    // Set start and end positions
    const { start, end } = this.getStartEndPositions(level, gridSize);
    
    // Generate board
    const board = this.generateBoard(gridSize, colorsCount, level);
    
    // Ensure solvability
    const solvableBoard = this.ensureSolvable(board, start, end, colorsCount);
    
    this.initialBoard = solvableBoard.map(row => [...row]);
    
    this.gameState = {
      board: solvableBoard,
      currentColor: solvableBoard[start.y][start.x],
      moves: 0,
      moveLimit,
      gameOver: false,
      won: false,
      startPosition: start,
      endPosition: end,
      controlledRegion: this.getControlledRegion(solvableBoard, start),
      score: 0,
      level,
      selectedPowerUp: null,
      activePowerUps: [],
      achievements: [],
      settings: this.config.settings || {
        theme: 'auto',
        soundEnabled: true,
        musicEnabled: true,
        particlesEnabled: true,
        colorBlindMode: false,
        showHints: true,
        animationSpeed: 'normal',
        language: 'en',
      }
    };
  }
  
  private calculateGridSize(level: number): number {
    const size = 5 + Math.floor((level - 1) / 3);
    return Math.min(size, 20);
  }
  
  private calculateColorsCount(level: number): number {
    const count = 5 + Math.floor((level - 1) / 5);
    return Math.min(count, 7);
  }
  
  private calculateMoveLimit(level: number): number {
    const gridSize = this.calculateGridSize(level);
    const colorsCount = this.calculateColorsCount(level);
    return Math.floor(gridSize * colorsCount * 0.8);
  }
  
  private getStartEndPositions(level: number, gridSize: number): { start: Position, end: Position } {
    if (level <= 5) {
      return {
        start: { x: 0, y: 0 },
        end: { x: gridSize - 1, y: gridSize - 1 }
      };
    }
    
    const corners = [
      { start: { x: 0, y: 0 }, end: { x: gridSize - 1, y: gridSize - 1 } },
      { start: { x: gridSize - 1, y: 0 }, end: { x: 0, y: gridSize - 1 } },
      { start: { x: 0, y: gridSize - 1 }, end: { x: gridSize - 1, y: 0 } },
      { start: { x: gridSize - 1, y: gridSize - 1 }, end: { x: 0, y: 0 } }
    ];
    
    return corners[Math.floor(Math.random() * corners.length)];
  }
  
  private generateBoard(gridSize: number, colorsCount: number, _level: number): string[][] {
    const colors = this.config.colors.slice(0, colorsCount);
    const board: string[][] = [];
    
    for (let y = 0; y < gridSize; y++) {
      const row: string[] = [];
      for (let x = 0; x < gridSize; x++) {
        row.push(colors[Math.floor(Math.random() * colors.length)]);
      }
      board.push(row);
    }
    
    // TODO: Add special tiles based on level
    // For now, returning basic board
    return board;
  }
  
  private ensureSolvable(
    board: string[][], 
    _start: Position, 
    _end: Position, 
    _colorsCount: number
  ): string[][] {
    // Simple solvability check - ensure path exists
    // In a real implementation, we'd use A* or similar
    // For now, just return the board
    return board;
  }
  
  private getControlledRegion(board: string[][], start: Position): Position[] {
    const startColor = board[start.y][start.x];
    const visited: boolean[][] = Array(board.length).fill(null)
      .map(() => Array(board[0].length).fill(false));
    const stack: Position[] = [start];
    const region: Position[] = [];
    
    while (stack.length > 0) {
      const pos = stack.pop();
      if (!pos) {
        continue;
      }
      
      if (pos.x < 0 || pos.y < 0 || pos.x >= board[0].length || pos.y >= board.length) {
        continue;
      }
      
      if (visited[pos.y][pos.x]) {
        continue;
      }
      
      if (board[pos.y][pos.x] !== startColor) {
        continue;
      }
      
      visited[pos.y][pos.x] = true;
      region.push(pos);
      
      // Add adjacent cells
      stack.push(
        { x: pos.x + 1, y: pos.y },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x, y: pos.y - 1 }
      );
    }
    
    return region;
  }
  
  selectColor(color: string): void {
    if (!this.gameState || this.gameState.gameOver) {
      return;
    }
    
    const currentColor = this.gameState.currentColor;
    if (color === currentColor) {
      return; // No change needed
    }
    
    // Perform flood fill
    this.floodFill(this.gameState.board, currentColor, color);
    
    // Update game state
    this.gameState.currentColor = color;
    this.gameState.moves++;
    this.gameState.controlledRegion = this.getControlledRegion(
      this.gameState.board, 
      this.gameState.startPosition
    );
    
    // Check win condition
    if (this.checkWin()) {
      this.gameState.gameOver = true;
      this.gameState.won = true;
      this.gameState.score = this.calculateScore();
    } else if (this.gameState.moves >= this.gameState.moveLimit) {
      this.gameState.gameOver = true;
      this.gameState.won = false;
    }
  }
  
  private floodFill(board: string[][], fromColor: string, toColor: string): void {
    if (!this.gameState) {return;}
    
    const visited: boolean[][] = Array(board.length).fill(null)
      .map(() => Array(board[0].length).fill(false));
    const stack: Position[] = [this.gameState.startPosition];
    
    while (stack.length > 0) {
      const pos = stack.pop();
      if (!pos) {
        continue;
      }
      
      if (pos.x < 0 || pos.y < 0 || pos.x >= board[0].length || pos.y >= board.length) {
        continue;
      }
      
      if (visited[pos.y][pos.x]) {
        continue;
      }
      
      if (board[pos.y][pos.x] !== fromColor) {
        continue;
      }
      
      visited[pos.y][pos.x] = true;
      board[pos.y][pos.x] = toColor;
      
      // Add adjacent cells
      stack.push(
        { x: pos.x + 1, y: pos.y },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x, y: pos.y - 1 }
      );
    }
  }
  
  private checkWin(): boolean {
    if (!this.gameState) {return false;}
    
    return this.gameState.controlledRegion.some(
      pos => this.gameState && pos.x === this.gameState.endPosition.x && 
             pos.y === this.gameState.endPosition.y
    );
  }
  
  private calculateScore(): number {
    if (!this.gameState) {return 0;}
    
    const baseScore = 1000;
    const moveBonus = Math.max(0, this.gameState.moveLimit - this.gameState.moves) * 10;
    const levelMultiplier = this.gameState.level;
    
    return (baseScore + moveBonus) * levelMultiplier;
  }
  
  pause(): void {
    if (this.gameState && !this.gameState.gameOver) {
      // TODO: Implement pause timer
    }
  }
  
  resume(): void {
    if (this.gameState && !this.gameState.gameOver) {
      // TODO: Resume timer
    }
  }
  
  reset(): void {
    if (this.gameState && this.initialBoard) {
      this.gameState.board = this.initialBoard.map(row => [...row]);
      this.gameState.currentColor = this.gameState.board[this.gameState.startPosition.y][this.gameState.startPosition.x];
      this.gameState.moves = 0;
      this.gameState.gameOver = false;
      this.gameState.won = false;
      this.gameState.controlledRegion = this.getControlledRegion(
        this.gameState.board,
        this.gameState.startPosition
      );
      this.visitedSpecialCells.clear();
    }
  }
  
  getGameState(): SimpleGameState | null {
    return this.gameState;
  }
  
  getAvailableColors(): string[] {
    if (!this.gameState) {return [];}
    
    const colorsCount = this.calculateColorsCount(this.gameState.level);
    return this.config.colors.slice(0, colorsCount);
  }
}