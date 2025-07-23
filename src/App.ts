import { GameEngine } from './engine/GameEngine';
import { UIManager } from './ui/UIManager';
import { AudioManager } from './utils/AudioManager';
import { ThemeManager } from './utils/ThemeManager';
import { StartScreen } from './ui/screens/StartScreen';
import { GameScreen } from './ui/screens/GameScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import type { GameSettings } from './types';

interface AppConfig {
  container: HTMLElement;
  settings: GameSettings;
}

export class App {
  private container: HTMLElement;
  private settings: GameSettings;
  private gameEngine: GameEngine;
  private uiManager: UIManager;
  private audioManager: AudioManager;
  private themeManager: ThemeManager;
  private currentScreen: 'start' | 'game' | 'settings' = 'start';
  
  constructor(config: AppConfig) {
    this.container = config.container;
    this.settings = config.settings;
    
    // Initialize managers
    this.gameEngine = new GameEngine({
      colors: ["#F28B82","#CE93D8","#90CAF9","#A5D6A7","#FFCC80","#F48FB1","#80DEEA"],
      settings: this.settings
    });
    this.uiManager = new UIManager(this.container);
    this.audioManager = new AudioManager(this.settings.soundEnabled, this.settings.musicEnabled);
    this.themeManager = new ThemeManager(this.settings.theme);
  }
  
  async initialize(): Promise<void> {
    // Apply theme
    this.themeManager.applyTheme();
    
    // Initialize audio
    await this.audioManager.initialize();
    
    // Show start screen
    await this.showStartScreen();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  private async showStartScreen(): Promise<void> {
    this.currentScreen = 'start';
    
    const startScreen = new StartScreen({
      version: import.meta.env.VITE_APP_VERSION || '2.0.0',
      buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
      onStart: () => this.startGame(),
      onSettings: () => this.showSettings(),
      onTutorial: () => this.showTutorial(),
    });
    
    this.uiManager.showScreen(startScreen);
  }
  
  private async startGame(): Promise<void> {
    this.currentScreen = 'game';
    
    const gameScreen = new GameScreen({
      gameEngine: this.gameEngine,
      audioManager: this.audioManager,
      onBack: () => this.showStartScreen(),
      onGameOver: (victory: boolean, score: number) => this.handleGameOver(victory, score),
    });
    
    this.uiManager.showScreen(gameScreen);
    await this.gameEngine.startNewGame();
  }
  
  private async showSettings(): Promise<void> {
    this.currentScreen = 'settings';
    
    const settingsScreen = new SettingsScreen({
      settings: this.settings,
      onSave: (newSettings: GameSettings) => this.updateSettings(newSettings),
      onBack: () => this.showStartScreen(),
    });
    
    this.uiManager.showScreen(settingsScreen);
  }
  
  private showTutorial(): void {
    // TODO: Implement tutorial
    this.uiManager.showNotification('Tutorial not yet implemented', 'info');
  }
  
  private handleGameOver(victory: boolean, _score: number): void {
    if (victory) {
      this.audioManager.playSound('victory');
      // TODO: Show victory screen with confetti
    } else {
      this.audioManager.playSound('defeat');
      // TODO: Show game over screen
    }
  }
  
  private updateSettings(newSettings: GameSettings): void {
    this.settings = newSettings;
    
    // Apply changes
    this.themeManager.setTheme(newSettings.theme);
    this.audioManager.setSoundEnabled(newSettings.soundEnabled);
    this.audioManager.setMusicEnabled(newSettings.musicEnabled);
    
    // Save to storage
    localStorage.setItem('cblix2_settings', JSON.stringify(newSettings));
    
    // Return to start screen
    void this.showStartScreen();
  }
  
  private setupEventListeners(): void {
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.currentScreen !== 'start') {
        void this.showStartScreen();
      }
    });
    
    // Handle visibility change for pausing
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.currentScreen === 'game') {
        this.gameEngine.pause();
      }
    });
  }
}