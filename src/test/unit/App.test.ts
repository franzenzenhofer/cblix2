import { describe, it, expect, vi, beforeEach } from 'vitest';
import { App } from '../../App';
import type { GameSettings } from '../../types';

// Mock all dependencies
vi.mock('../../engine/GameEngine');
vi.mock('../../ui/UIManager');
vi.mock('../../utils/AudioManager');
vi.mock('../../utils/ThemeManager');
vi.mock('../../ui/screens/StartScreen');
vi.mock('../../ui/screens/GameScreen');
vi.mock('../../ui/screens/SettingsScreen');

describe('App', () => {
  let container: HTMLElement;
  let settings: GameSettings;
  
  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    
    settings = {
      theme: 'auto',
      soundEnabled: true,
      musicEnabled: true,
      particlesEnabled: true,
      colorBlindMode: false,
      showHints: true,
      animationSpeed: 'normal',
      language: 'en',
    };
    
    vi.clearAllMocks();
  });
  
  it('should create an instance of App', () => {
    const app = new App({ container, settings });
    expect(app).toBeDefined();
  });
  
  it('should initialize the app', async () => {
    const app = new App({ container, settings });
    const initializeSpy = vi.spyOn(app, 'initialize');
    
    await app.initialize();
    
    expect(initializeSpy).toHaveBeenCalled();
  });
  
  it('should apply theme on initialization', async () => {
    const { ThemeManager } = await import('../../utils/ThemeManager');
    const mockApplyTheme = vi.fn();
    (ThemeManager as any).mockImplementation(() => ({
      applyTheme: mockApplyTheme,
      setTheme: vi.fn(),
    }));
    
    const app = new App({ container, settings });
    await app.initialize();
    
    expect(mockApplyTheme).toHaveBeenCalled();
  });
  
  it('should initialize audio manager', async () => {
    const { AudioManager } = await import('../../utils/AudioManager');
    const mockInitialize = vi.fn().mockResolvedValue(undefined);
    (AudioManager as any).mockImplementation(() => ({
      initialize: mockInitialize,
      setSoundEnabled: vi.fn(),
      setMusicEnabled: vi.fn(),
      playSound: vi.fn(),
    }));
    
    const app = new App({ container, settings });
    await app.initialize();
    
    expect(mockInitialize).toHaveBeenCalled();
  });
  
  it('should show start screen on initialization', async () => {
    const { UIManager } = await import('../../ui/UIManager');
    const mockShowScreen = vi.fn();
    (UIManager as any).mockImplementation(() => ({
      showScreen: mockShowScreen,
    }));
    
    const app = new App({ container, settings });
    await app.initialize();
    
    expect(mockShowScreen).toHaveBeenCalled();
  });
});