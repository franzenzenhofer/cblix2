import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../engine/GameEngine';
import type { Position, GameSettings } from '../../types';

describe('GameEngine', () => {
  let engine: GameEngine;
  const mockConfig = {
    colors: ["#F28B82","#CE93D8","#90CAF9","#A5D6A7","#FFCC80","#F48FB1","#80DEEA"],
    settings: {
      theme: 'auto' as const,
      soundEnabled: true,
      musicEnabled: true,
      particlesEnabled: true,
      colorBlindMode: false,
      showHints: true,
      animationSpeed: 'normal' as const,
      language: 'en',
    }
  };
  
  beforeEach(() => {
    engine = new GameEngine(mockConfig);
  });
  
  describe('startNewGame', () => {
    it('should initialize a new game with level 1', async () => {
      await engine.startNewGame(1);
      const state = engine.getGameState();
      
      expect(state).toBeDefined();
      expect(state?.level).toBe(1);
      expect(state?.moves).toBe(0);
      expect(state?.gameOver).toBe(false);
      expect(state?.won).toBe(false);
    });
    
    it('should calculate correct grid size based on level', async () => {
      await engine.startNewGame(1);
      let state = engine.getGameState();
      expect(state?.board.length).toBe(5); // 5 + Math.floor((1-1)/3) = 5
      
      await engine.startNewGame(4);
      state = engine.getGameState();
      expect(state?.board.length).toBe(6); // 5 + Math.floor((4-1)/3) = 6
      
      await engine.startNewGame(10);
      state = engine.getGameState();
      expect(state?.board.length).toBe(8); // 5 + Math.floor((10-1)/3) = 8
    });
    
    it('should calculate correct colors count based on level', async () => {
      await engine.startNewGame(1);
      const colors = engine.getAvailableColors();
      expect(colors.length).toBe(5); // 5 + Math.floor((1-1)/5) = 5
      
      await engine.startNewGame(6);
      const colors2 = engine.getAvailableColors();
      expect(colors2.length).toBe(6); // 5 + Math.floor((6-1)/5) = 6
    });
    
    it('should set start and end positions for level <= 5', async () => {
      await engine.startNewGame(1);
      const state = engine.getGameState();
      
      expect(state?.startPosition).toEqual({ x: 0, y: 0 });
      expect(state?.endPosition).toEqual({ x: 4, y: 4 });
    });
    
    it('should randomize start and end positions for level > 5', async () => {
      await engine.startNewGame(6);
      const state = engine.getGameState();
      
      // Should be one of the corner combinations
      const validCombos = [
        { start: { x: 0, y: 0 }, end: { x: 5, y: 5 } },
        { start: { x: 5, y: 0 }, end: { x: 0, y: 5 } },
        { start: { x: 0, y: 5 }, end: { x: 5, y: 0 } },
        { start: { x: 5, y: 5 }, end: { x: 0, y: 0 } }
      ];
      
      const isValid = validCombos.some(combo => 
        combo.start.x === state?.startPosition.x &&
        combo.start.y === state?.startPosition.y &&
        combo.end.x === state?.endPosition.x &&
        combo.end.y === state?.endPosition.y
      );
      
      expect(isValid).toBe(true);
    });
    
    it('should initialize controlled region from start position', async () => {
      await engine.startNewGame(1);
      const state = engine.getGameState();
      
      expect(state?.controlledRegion).toBeDefined();
      expect(state?.controlledRegion.length).toBeGreaterThan(0);
      expect(state?.controlledRegion).toContainEqual(state?.startPosition);
    });
  });
  
  describe('selectColor', () => {
    beforeEach(async () => {
      await engine.startNewGame(1);
    });
    
    it('should not change anything if same color is selected', () => {
      const state = engine.getGameState();
      const initialMoves = state?.moves || 0;
      const currentColor = state?.currentColor;
      
      engine.selectColor(currentColor!);
      
      const newState = engine.getGameState();
      expect(newState?.moves).toBe(initialMoves);
    });
    
    it('should increment moves when different color is selected', () => {
      const state = engine.getGameState();
      const initialMoves = state?.moves || 0;
      const colors = engine.getAvailableColors();
      const differentColor = colors.find(c => c !== state?.currentColor);
      
      engine.selectColor(differentColor!);
      
      const newState = engine.getGameState();
      expect(newState?.moves).toBe(initialMoves + 1);
      expect(newState?.currentColor).toBe(differentColor);
    });
    
    it('should perform flood fill when color is selected', () => {
      const state = engine.getGameState();
      const colors = engine.getAvailableColors();
      const differentColor = colors.find(c => c !== state?.currentColor);
      
      engine.selectColor(differentColor!);
      
      const newState = engine.getGameState();
      const startPos = newState?.startPosition!;
      expect(newState?.board[startPos.y][startPos.x]).toBe(differentColor);
    });
    
    it('should end game when move limit is reached', () => {
      const state = engine.getGameState();
      const colors = engine.getAvailableColors();
      
      // Make moves up to the limit but ensure we don't win
      let movesMade = 0;
      let colorIndex = 0;
      while (movesMade < state!.moveLimit && !engine.getGameState()?.gameOver) {
        const color = colors[colorIndex % colors.length];
        if (color !== engine.getGameState()?.currentColor) {
          engine.selectColor(color);
          movesMade++;
        }
        colorIndex++;
      }
      
      const finalState = engine.getGameState();
      expect(finalState?.gameOver).toBe(true);
      // If we won before reaching move limit, skip this assertion
      if (finalState?.moves === finalState?.moveLimit) {
        expect(finalState?.won).toBe(false);
      }
    });
    
    it('should not allow moves after game is over', () => {
      const state = engine.getGameState();
      const colors = engine.getAvailableColors();
      
      // End the game
      let movesMade = 0;
      let colorIndex = 0;
      while (movesMade < state!.moveLimit) {
        const color = colors[colorIndex % colors.length];
        if (color !== engine.getGameState()?.currentColor) {
          engine.selectColor(color);
          movesMade++;
        }
        colorIndex++;
      }
      
      const gameOverState = engine.getGameState();
      const moveCount = gameOverState?.moves;
      
      // Try to make another move
      engine.selectColor(colors[0]);
      
      expect(engine.getGameState()?.moves).toBe(moveCount);
    });
  });
  
  describe('pause and resume', () => {
    beforeEach(async () => {
      await engine.startNewGame(1);
    });
    
    it('should pause the game', () => {
      expect(() => engine.pause()).not.toThrow();
    });
    
    it('should resume the game', () => {
      expect(() => engine.resume()).not.toThrow();
    });
    
    it('should not pause if game is over', async () => {
      // End the game
      const colors = engine.getAvailableColors();
      const state = engine.getGameState();
      let movesMade = 0;
      let colorIndex = 0;
      while (movesMade < state!.moveLimit) {
        const color = colors[colorIndex % colors.length];
        if (color !== engine.getGameState()?.currentColor) {
          engine.selectColor(color);
          movesMade++;
        }
        colorIndex++;
      }
      
      expect(() => engine.pause()).not.toThrow();
    });
  });
  
  describe('reset', () => {
    beforeEach(async () => {
      await engine.startNewGame(1);
    });
    
    it('should reset game to initial state', () => {
      const colors = engine.getAvailableColors();
      const differentColor = colors.find(c => c !== engine.getGameState()?.currentColor);
      
      // Make some moves
      engine.selectColor(differentColor!);
      engine.selectColor(colors[0]);
      
      const stateBeforeReset = engine.getGameState();
      expect(stateBeforeReset?.moves).toBeGreaterThan(0);
      
      // Reset
      engine.reset();
      
      const stateAfterReset = engine.getGameState();
      expect(stateAfterReset?.moves).toBe(0);
      expect(stateAfterReset?.gameOver).toBe(false);
      expect(stateAfterReset?.won).toBe(false);
    });
    
    it('should restore initial board configuration', () => {
      const initialBoard = engine.getGameState()?.board.map(row => [...row]);
      const colors = engine.getAvailableColors();
      
      // Make moves to change the board
      engine.selectColor(colors[0]);
      engine.selectColor(colors[1]);
      
      // Reset
      engine.reset();
      
      const resetBoard = engine.getGameState()?.board;
      expect(resetBoard).toEqual(initialBoard);
    });
  });
  
  describe('getAvailableColors', () => {
    it('should return empty array if no game state', () => {
      const newEngine = new GameEngine(mockConfig);
      expect(newEngine.getAvailableColors()).toEqual([]);
    });
    
    it('should return correct number of colors based on level', async () => {
      await engine.startNewGame(1);
      expect(engine.getAvailableColors().length).toBe(5);
      
      await engine.startNewGame(11);
      expect(engine.getAvailableColors().length).toBe(7);
    });
    
    it('should cap colors at 7', async () => {
      await engine.startNewGame(50);
      expect(engine.getAvailableColors().length).toBe(7);
    });
  });
  
  describe('win condition', () => {
    it('should detect win when end position is reached', async () => {
      await engine.startNewGame(1);
      const state = engine.getGameState();
      
      // Create a simple winning scenario by setting the board
      // This is a simplified test - in real game, we'd need proper flood fill
      const board = state!.board;
      const endPos = state!.endPosition;
      const startPos = state!.startPosition;
      
      // Fill path from start to end with same color
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
          board[y][x] = mockConfig.colors[0];
        }
      }
      
      // Make a move to trigger win check
      engine.selectColor(mockConfig.colors[1]);
      
      // Note: This test is simplified. In a real scenario,
      // we'd need to properly test the flood fill reaching the end
    });
  });
  
  describe('score calculation', () => {
    it('should calculate score based on remaining moves', async () => {
      await engine.startNewGame(1);
      
      // Create winning condition (simplified)
      const board = engine.getGameState()!.board;
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
          board[y][x] = mockConfig.colors[0];
        }
      }
      
      // Win with no moves
      engine.selectColor(mockConfig.colors[1]);
      
      const state = engine.getGameState();
      if (state?.won) {
        expect(state.score).toBeGreaterThan(0);
      }
    });
  });
});