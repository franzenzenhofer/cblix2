import { describe, it, expect } from 'vitest';
import { 
  TileType
} from '../../types';
import type { 
  Position, 
  GameState, 
  GameSettings,
  Board,
  Cell,
  SpecialTileConfig,
  SaveData,
  Statistics,
  Achievement,
  GameEvent,
  TilePlugin
} from '../../types';

describe('Types', () => {
  it('should correctly type Position', () => {
    const position: Position = { x: 0, y: 0 };
    expect(position.x).toBe(0);
    expect(position.y).toBe(0);
  });
  
  it('should correctly type GameSettings', () => {
    const settings: GameSettings = {
      theme: 'dark',
      soundEnabled: true,
      musicEnabled: false,
      particlesEnabled: true,
      colorBlindMode: false,
      showHints: true,
      animationSpeed: 'fast',
      language: 'en',
      analyticsEnabled: true,
    };
    
    expect(settings.theme).toBe('dark');
    expect(settings.soundEnabled).toBe(true);
    expect(settings.animationSpeed).toBe('fast');
  });
  
  it('should correctly type Board', () => {
    const board: Board = {
      size: 5,
      cells: [],
      startPosition: { x: 0, y: 0 },
      goalPosition: { x: 4, y: 4 },
    };
    
    expect(board.size).toBe(5);
    expect(board.startPosition.x).toBe(0);
    expect(board.goalPosition.x).toBe(4);
  });
  
  it('should correctly type TileType enum values', () => {
    const normalTile = TileType.NORMAL;
    const wanderingTile = TileType.WANDERING;
    const oneWayTile = TileType.ONE_WAY;
    
    expect(normalTile).toBe('normal');
    expect(wanderingTile).toBe('wandering');
    expect(oneWayTile).toBe('one_way');
  });
  
  it('should correctly type SpecialTileConfig', () => {
    const specialTileConfig: SpecialTileConfig = {
      type: TileType.TELEPORTER,
      probability: 0.1,
      minLevel: 5,
      maxCount: 2
    };
    
    expect(specialTileConfig.type).toBe('teleporter');
    expect(specialTileConfig.probability).toBe(0.1);
    expect(specialTileConfig.minLevel).toBe(5);
  });
  
  it('should correctly type GameState', () => {
    const gameState: GameState = {
      board: {
        size: 5,
        cells: [],
        startPosition: { x: 0, y: 0 },
        goalPosition: { x: 4, y: 4 }
      },
      currentLevel: 1,
      moves: 0,
      moveLimit: 15,
      gameOver: false,
      victory: false,
      selectedColor: '#FF0000',
      controlledRegion: [{ x: 0, y: 0 }],
      visitedSpecialCells: new Set(['0,0']),
      undoStack: [],
      redoStack: [],
      score: 0,
    };
    
    expect(gameState.currentLevel).toBe(1);
    expect(gameState.visitedSpecialCells).toBeInstanceOf(Set);
    expect(gameState.undoStack).toHaveLength(0);
  });
  
  it('should handle all theme options', () => {
    const themes: GameSettings['theme'][] = ['light', 'dark', 'auto'];
    themes.forEach(theme => {
      const settings: GameSettings = {
        theme,
        soundEnabled: false,
        musicEnabled: false,
        particlesEnabled: false,
        colorBlindMode: false,
        showHints: false,
        animationSpeed: 'normal',
        language: 'en',
        analyticsEnabled: false,
      };
      expect(['light', 'dark', 'auto']).toContain(settings.theme);
    });
  });
  
  it('should handle all animation speed options', () => {
    const speeds: GameSettings['animationSpeed'][] = ['slow', 'normal', 'fast'];
    speeds.forEach(speed => {
      const settings: GameSettings = {
        theme: 'auto',
        soundEnabled: false,
        musicEnabled: false,
        particlesEnabled: false,
        colorBlindMode: false,
        showHints: false,
        animationSpeed: speed,
        language: 'en',
        analyticsEnabled: false,
      };
      expect(['slow', 'normal', 'fast']).toContain(settings.animationSpeed);
    });
  });
  
  it('should correctly type Cell', () => {
    const cell: Cell = {
      position: { x: 2, y: 3 },
      color: '#FF0000',
      type: TileType.NORMAL,
      metadata: {
        magneticRadius: 2,
        magneticStrength: 1.5
      }
    };
    
    expect(cell.position.x).toBe(2);
    expect(cell.color).toBe('#FF0000');
    expect(cell.type).toBe(TileType.NORMAL);
    expect(cell.metadata?.magneticRadius).toBe(2);
  });
  
  it('should correctly type Achievement', () => {
    const achievement: Achievement = {
      id: 'first-win',
      name: 'First Victory',
      description: 'Win your first game',
      icon: '🏆',
      unlocked: true,
      unlockedAt: new Date('2025-01-01'),
      progress: 1,
      maxProgress: 1
    };
    
    expect(achievement.id).toBe('first-win');
    expect(achievement.unlocked).toBe(true);
    expect(achievement.progress).toBe(1);
  });
  
  it('should correctly type Statistics', () => {
    const stats: Statistics = {
      gamesPlayed: 10,
      gamesWon: 5,
      totalMoves: 150,
      totalScore: 5000,
      averageMovesPerGame: 15,
      bestScore: 1500,
      currentStreak: 2,
      bestStreak: 5,
      achievements: [],
      playTime: 3600
    };
    
    expect(stats.gamesPlayed).toBe(10);
    expect(stats.gamesWon).toBe(5);
    expect(stats.currentStreak).toBe(2);
  });
  
  it('should correctly type SaveData', () => {
    const saveData: SaveData = {
      version: '2.0.0',
      gameState: {} as GameState,
      statistics: {} as Statistics,
      settings: {} as GameSettings,
      lastSaved: new Date()
    };
    
    expect(saveData.version).toBe('2.0.0');
    expect(saveData.lastSaved).toBeInstanceOf(Date);
  });
  
  it('should correctly type GameEvent', () => {
    const event: GameEvent = {
      type: 'game:start',
      timestamp: new Date(),
      data: { level: 1 }
    };
    
    expect(event.type).toBe('game:start');
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.data.level).toBe(1);
  });
  
  it('should correctly type TilePlugin', () => {
    const plugin: TilePlugin = {
      type: TileType.MAGNETIC,
      name: 'Magnetic Tile',
      description: 'Attracts colors',
      canPlaceAt: (pos) => pos.x >= 0 && pos.y >= 0,
      blocksFloodFill: () => false
    };
    
    expect(plugin.type).toBe(TileType.MAGNETIC);
    expect(plugin.name).toBe('Magnetic Tile');
    expect(plugin.canPlaceAt).toBeDefined();
  });
});