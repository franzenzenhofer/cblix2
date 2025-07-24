export interface TutorialScreenConfig {
  onBack: () => void;
  onStartGame: () => void;
}

export class TutorialScreen {
  private container: HTMLDivElement;
  private currentStep: number = 0;
  
  private steps = [
    {
      title: "Welcome to CBLIX2!",
      content: "Connect the corners by filling the board with colors.",
      image: "🎯"
    },
    {
      title: "How to Play",
      content: "Tap a color to fill all connected tiles of your current color. Your goal is to connect from S (start) to E (end).",
      image: "🎨"
    },
    {
      title: "Limited Moves",
      content: "You have a limited number of moves. Plan your path carefully to reach the end before running out!",
      image: "🔢"
    },
    {
      title: "Special Tiles (Coming Soon)",
      content: "Watch out for special tiles like one-way paths, teleporters, and color locks in future levels!",
      image: "✨"
    },
    {
      title: "Ready to Play!",
      content: "That's all! Start with Level 1 and work your way up. Good luck!",
      image: "🚀"
    }
  ];
  
  constructor(private config: TutorialScreenConfig) {
    this.container = document.createElement('div');
    this.container.className = 'tutorial-screen';
    this.render();
  }
  
  getElement(): HTMLDivElement {
    return this.container;
  }
  
  private render(): void {
    this.updateContent();
  }
  
  private updateContent(): void {
    const step = this.steps[this.currentStep];
    const isLastStep = this.currentStep === this.steps.length - 1;
    
    this.container.innerHTML = `
      <div class="tutorial-header">
        <button class="btn-secondary" id="back-btn">← Back</button>
        <div class="tutorial-progress">
          ${this.steps.map((_, i) => `
            <div class="progress-dot ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}"></div>
          `).join('')}
        </div>
      </div>
      
      <div class="tutorial-content">
        <div class="tutorial-step">
          <div class="tutorial-icon">${step.image}</div>
          <h2>${step.title}</h2>
          <p>${step.content}</p>
        </div>
        
        <div class="tutorial-navigation">
          ${this.currentStep > 0 ? '<button class="btn-secondary" id="prev-btn">Previous</button>' : '<div></div>'}
          ${isLastStep 
            ? '<button class="btn-primary" id="start-game-btn">Start Playing!</button>'
            : '<button class="btn-primary" id="next-btn">Next</button>'
          }
        </div>
      </div>
    `;
    
    this.attachEventListeners();
  }
  
  private attachEventListeners(): void {
    const backBtn = this.container.querySelector('#back-btn');
    const prevBtn = this.container.querySelector('#prev-btn');
    const nextBtn = this.container.querySelector('#next-btn');
    const startBtn = this.container.querySelector('#start-game-btn');
    
    backBtn?.addEventListener('click', () => this.config.onBack());
    prevBtn?.addEventListener('click', () => this.previousStep());
    nextBtn?.addEventListener('click', () => this.nextStep());
    startBtn?.addEventListener('click', () => this.config.onStartGame());
  }
  
  private nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.updateContent();
    }
  }
  
  private previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateContent();
    }
  }
}