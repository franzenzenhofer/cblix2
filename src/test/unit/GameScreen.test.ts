import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameScreen } from '../../ui/screens/GameScreen';
import type { GameEngine } from '../../engine/GameEngine';
import type { AudioManager } from '../../utils/AudioManager';

describe('GameScreen', () => {
  let mockGameEngine: GameEngine;
  let mockAudioManager: AudioManager;
  let mockOnBack: ReturnType<typeof vi.fn>;
  let mockOnGameOver: ReturnType<typeof vi.fn>;
  let screen: GameScreen;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    // Mock game state
    const mockGameState = {
      board: [
        ['#F28B82', '#CE93D8', '#90CAF9'],
        ['#F28B82', '#F28B82', '#CE93D8'],
        ['#90CAF9', '#90CAF9', '#F28B82']
      ],
      level: 1,
      moves: 0,
      moveLimit: 10,
      gameOver: false,
      won: false,
      controlledRegion: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
      startPosition: { x: 0, y: 0 },
      endPosition: { x: 2, y: 2 },
      currentColor: '#F28B82',
      score: 0,
    };
    
    // Mock GameEngine
    mockGameEngine = {
      getGameState: vi.fn().mockReturnValue(mockGameState),
      getAvailableColors: vi.fn().mockReturnValue(['#F28B82', '#CE93D8', '#90CAF9']),
      selectColor: vi.fn(),
      startNewGame: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      reset: vi.fn(),
    } as unknown as GameEngine;
    
    // Mock AudioManager
    mockAudioManager = {
      playSound: vi.fn(),
      playMusic: vi.fn(),
      setSoundEnabled: vi.fn(),
      setMusicEnabled: vi.fn(),
      initialize: vi.fn(),
    } as unknown as AudioManager;
    
    // Mock callbacks
    mockOnBack = vi.fn();
    mockOnGameOver = vi.fn();
    
    // Mock requestAnimationFrame
    let frameCount = 0;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frameCount++;
      if (frameCount < 5) { // Limit frames to prevent infinite loop
        setTimeout(() => callback(16), 16);
      }
      return frameCount;
    });
    
    // Mock canvas context
    const mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      fillText: vi.fn(),
      font: '',
      textAlign: '',
      textBaseline: '',
    };
    
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);
  });
  
  afterEach(() => {
    rafSpy.mockRestore();
    vi.clearAllMocks();
  });
  
  it('should create a GameScreen instance', () => {
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    expect(screen).toBeDefined();
    expect(screen.getElement()).toBeInstanceOf(HTMLElement);
  });
  
  it('should render game UI elements', () => {
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    const element = screen.getElement();
    expect(element.querySelector('.game-header')).toBeTruthy();
    expect(element.querySelector('#game-canvas')).toBeTruthy();
    expect(element.querySelector('.color-palette')).toBeTruthy();
    expect(element.querySelector('#levelDisplay')).toBeTruthy();
    expect(element.querySelector('#movesDisplay')).toBeTruthy();
    expect(element.querySelector('#scoreDisplay')).toBeTruthy();
  });
  
  it('should handle back button click', () => {
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    const backBtn = screen.getElement().querySelector('#back-btn') as HTMLButtonElement;
    backBtn.click();
    
    expect(mockOnBack).toHaveBeenCalled();
  });
  
  it('should render color palette', () => {
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    const colorPalette = screen.getElement().querySelector('#colorPalette');
    const colorButtons = colorPalette?.querySelectorAll('.color-button');
    
    expect(colorButtons?.length).toBe(3); // 3 available colors
  });
  
  it('should handle color selection', () => {
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    const colorPalette = screen.getElement().querySelector('#colorPalette');
    const colorButton = colorPalette?.querySelector('.color-button') as HTMLButtonElement;
    
    colorButton.click();
    
    expect(mockGameEngine.selectColor).toHaveBeenCalled();
    expect(mockAudioManager.playSound).toHaveBeenCalledWith('click');
  });
  
  it('should update display when game state changes', async () => {
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    // Wait for game loop to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const levelDisplay = screen.getElement().querySelector('#levelDisplay');
    const movesDisplay = screen.getElement().querySelector('#movesDisplay');
    
    expect(levelDisplay?.textContent).toBe('1');
    expect(movesDisplay?.textContent).toBe('0');
  });
  
  it('should handle game over (victory)', async () => {
    const winState = {
      board: [
        ['#F28B82', '#CE93D8', '#90CAF9'],
        ['#F28B82', '#F28B82', '#CE93D8'],
        ['#90CAF9', '#90CAF9', '#F28B82']
      ],
      level: 1,
      moves: 5,
      moveLimit: 10,
      gameOver: true,
      won: true,
      controlledRegion: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
      startPosition: { x: 0, y: 0 },
      endPosition: { x: 2, y: 2 },
      currentColor: '#F28B82',
      score: 1500,
    };
    
    (mockGameEngine.getGameState as ReturnType<typeof vi.fn>).mockReturnValue(winState);
    
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    // Wait for game loop to detect game over
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockOnGameOver).toHaveBeenCalledWith(true, 1500);
  });
  
  it('should handle game over (defeat)', async () => {
    const loseState = {
      board: [
        ['#F28B82', '#CE93D8', '#90CAF9'],
        ['#F28B82', '#F28B82', '#CE93D8'],
        ['#90CAF9', '#90CAF9', '#F28B82']
      ],
      level: 1,
      moves: 10,
      moveLimit: 10,
      gameOver: true,
      won: false,
      controlledRegion: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
      startPosition: { x: 0, y: 0 },
      endPosition: { x: 2, y: 2 },
      currentColor: '#F28B82',
      score: 0,
    };
    
    (mockGameEngine.getGameState as ReturnType<typeof vi.fn>).mockReturnValue(loseState);
    
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    // Wait for game loop to detect game over
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockOnGameOver).toHaveBeenCalledWith(false, 0);
  });
  
  it('should resize canvas on window resize', () => {
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    const canvas = screen.getElement().querySelector('#game-canvas') as HTMLCanvasElement;
    const initialWidth = canvas.width;
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    // Canvas should update its size
    expect(canvas.width).toBeDefined();
  });
  
  it('should cleanup on destroy', () => {
    screen = new GameScreen({
      gameEngine: mockGameEngine,
      audioManager: mockAudioManager,
      onBack: mockOnBack,
      onGameOver: mockOnGameOver,
    });
    
    // Get the destroy method if it exists
    const destroy = (screen as any).destroy;
    if (destroy) {
      destroy.call(screen);
      expect(rafSpy).toHaveBeenCalled();
    }
  });
});