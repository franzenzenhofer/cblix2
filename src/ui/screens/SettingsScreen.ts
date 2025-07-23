import type { GameSettings } from '@types';

interface SettingsScreenConfig {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onBack: () => void;
}

export class SettingsScreen {
  private container: HTMLElement;
  private config: SettingsScreenConfig;
  
  constructor(config: SettingsScreenConfig) {
    this.config = config;
    this.container = document.createElement('div');
    this.container.className = 'settings-screen';
    this.render();
  }
  
  getElement(): HTMLElement {
    return this.container;
  }
  
  private render(): void {
    const { settings } = this.config;
    
    this.container.innerHTML = `
      <div class="settings-header">
        <button class="btn-secondary" id="back-btn">← Back</button>
        <h2>Settings</h2>
      </div>
      
      <div class="settings-content">
        <div class="settings-group">
          <h3>Appearance</h3>
          <label class="setting-item">
            <span>Theme</span>
            <select id="theme-select">
              <option value="auto" ${settings.theme === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
          </label>
        </div>
        
        <div class="settings-group">
          <h3>Audio</h3>
          <label class="setting-item">
            <span>Sound Effects</span>
            <input type="checkbox" id="sound-checkbox" ${settings.soundEnabled ? 'checked' : ''}>
          </label>
          <label class="setting-item">
            <span>Background Music</span>
            <input type="checkbox" id="music-checkbox" ${settings.musicEnabled ? 'checked' : ''}>
          </label>
        </div>
        
        <div class="settings-group">
          <h3>Gameplay</h3>
          <label class="setting-item">
            <span>Show Hints</span>
            <input type="checkbox" id="hints-checkbox" ${settings.showHints ? 'checked' : ''}>
          </label>
          <label class="setting-item">
            <span>Color Blind Mode</span>
            <input type="checkbox" id="colorblind-checkbox" ${settings.colorBlindMode ? 'checked' : ''}>
          </label>
        </div>
        
        <button class="btn-primary" id="save-btn">Save Settings</button>
      </div>
    `;
    
    this.attachEventListeners();
  }
  
  private attachEventListeners(): void {
    const backBtn = this.container.querySelector('#back-btn');
    const saveBtn = this.container.querySelector('#save-btn');
    
    backBtn?.addEventListener('click', () => this.config.onBack());
    saveBtn?.addEventListener('click', () => this.saveSettings());
  }
  
  private saveSettings(): void {
    const settings: GameSettings = {
      theme: (this.container.querySelector('#theme-select') as HTMLSelectElement).value as any,
      soundEnabled: (this.container.querySelector('#sound-checkbox') as HTMLInputElement).checked,
      musicEnabled: (this.container.querySelector('#music-checkbox') as HTMLInputElement).checked,
      showHints: (this.container.querySelector('#hints-checkbox') as HTMLInputElement).checked,
      colorBlindMode: (this.container.querySelector('#colorblind-checkbox') as HTMLInputElement).checked,
      particlesEnabled: true,
      animationSpeed: 'normal',
      language: 'en',
    };
    
    this.config.onSave(settings);
  }
}