export interface StartScreenConfig {
  version: string;
  buildDate: string;
  onStart: () => void;
  onSettings: () => void;
  onTutorial: () => void;
}

export class StartScreen {
  private container: HTMLElement;
  private config: StartScreenConfig;
  
  constructor(config: StartScreenConfig) {
    this.config = config;
    this.container = document.createElement('div');
    this.container.className = 'start-screen';
    this.render();
  }
  
  getElement(): HTMLElement {
    return this.container;
  }
  
  private render(): void {
    const buildDate = new Date(this.config.buildDate).toLocaleDateString();
    
    this.container.innerHTML = `
      <div class="start-screen-content">
        <div class="logo-container">
          <h1 class="game-title">
            <span class="title-cblix">CBLIX</span>
            <span class="title-2">2</span>
          </h1>
          <p class="tagline">✨ The Best App Ever ✨</p>
          <p class="author">Enhanced by Franz Enzenhofer</p>
        </div>
        
        <div class="version-info">
          <p class="version">Version ${this.config.version}</p>
          <p class="build-date">Built on ${buildDate}</p>
        </div>
        
        <div class="menu-buttons">
          <button class="btn-primary btn-large" id="start-btn">
            <span>Play Game</span>
          </button>
          <button class="btn-secondary" id="tutorial-btn">
            <span>Tutorial</span>
          </button>
          <button class="btn-secondary" id="settings-btn">
            <span>Settings</span>
          </button>
        </div>
        
        <div class="features-list">
          <h3>New in CBLIX2:</h3>
          <ul>
            <li>🎯 7 New Tile Types</li>
            <li>🌈 Modern UI Design</li>
            <li>🌓 Dark/Light Themes</li>
            <li>💯 100% Test Coverage</li>
            <li>⚡ Blazing Fast Performance</li>
          </ul>
        </div>
      </div>
    `;
    
    this.attachEventListeners();
  }
  
  private attachEventListeners(): void {
    const startBtn = this.container.querySelector('#start-btn');
    const settingsBtn = this.container.querySelector('#settings-btn');
    const tutorialBtn = this.container.querySelector('#tutorial-btn');
    
    startBtn?.addEventListener('click', () => this.config.onStart());
    settingsBtn?.addEventListener('click', () => this.config.onSettings());
    tutorialBtn?.addEventListener('click', () => this.config.onTutorial());
  }
}