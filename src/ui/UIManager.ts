interface Screen {
  getElement(): HTMLElement;
}

export class UIManager {
  private container: HTMLElement;
  // private currentScreen: Screen | null = null; // Will be used for screen transitions
  
  constructor(container: HTMLElement) {
    this.container = container;
  }
  
  showScreen(screen: Screen): void {
    // Clear current screen
    this.container.innerHTML = '';
    
    // Add new screen
    // this.currentScreen = screen; // Will be used for screen transitions
    const element = screen.getElement();
    element.style.opacity = '0';
    this.container.appendChild(element);
    
    // Add fade-in animation
    requestAnimationFrame(() => {
      element.style.transition = 'opacity 0.3s ease-in-out';
      element.style.opacity = '1';
    });
  }
  
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // TODO: Implement notification system
    if (type === 'error') {
      console.error(message);
    }
    // Will implement visual notifications later
  }
}