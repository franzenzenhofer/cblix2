import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all imports
vi.mock('../../styles/global.css', () => ({}));
vi.mock('../../styles/themes.css', () => ({}));
vi.mock('../../styles/screens.css', () => ({}));
vi.mock('../../App', () => ({
  App: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined)
  }))
}));
vi.mock('../../utils/pwa', () => ({
  initializeServiceWorker: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../../utils/storage', () => ({
  loadGameSettings: vi.fn().mockResolvedValue({
    theme: 'auto',
    soundEnabled: true,
    musicEnabled: true,
    particlesEnabled: true,
    colorBlindMode: false,
    showHints: true,
    animationSpeed: 'normal',
    language: 'en',
    analyticsEnabled: true,
  })
}));
vi.mock('../../utils/analytics', () => ({
  initializeAnalytics: vi.fn().mockResolvedValue(undefined)
}));

describe('main.ts', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    // Create app container
    const appDiv = document.createElement('div');
    appDiv.id = 'app';
    document.body.appendChild(appDiv);
    
    // Mock window properties
    window.CBLIX2_VERSION = '2.0.0';
    window.CBLIX2_BUILD_DATE = '2025-01-01T00:00:00.000Z';
    
    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    consoleErrorSpy.mockRestore();
  });
  
  it('should initialize the app when DOM is ready', async () => {
    const { App } = await import('../../App');
    const { initializeServiceWorker } = await import('../../utils/pwa');
    const { loadGameSettings } = await import('../../utils/storage');
    const { initializeAnalytics } = await import('../../utils/analytics');
    
    // Import main.ts to trigger initialization
    await import('../../main');
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(loadGameSettings).toHaveBeenCalled();
    expect(initializeAnalytics).toHaveBeenCalled();
    expect(initializeServiceWorker).toHaveBeenCalled();
    expect(App).toHaveBeenCalled();
  });
  
  it('should not initialize analytics if disabled in settings', async () => {
    const { loadGameSettings } = await import('../../utils/storage');
    const { initializeAnalytics } = await import('../../utils/analytics');
    
    // Mock settings with analytics disabled
    (loadGameSettings as ReturnType<typeof vi.fn>).mockResolvedValue({
      theme: 'auto',
      soundEnabled: true,
      musicEnabled: true,
      particlesEnabled: true,
      colorBlindMode: false,
      showHints: true,
      animationSpeed: 'normal',
      language: 'en',
      analyticsEnabled: false,
    });
    
    // Re-import main.ts
    vi.resetModules();
    await import('../../main');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(initializeAnalytics).not.toHaveBeenCalled();
  });
  
  it('should handle initialization errors gracefully', async () => {
    const { App } = await import('../../App');
    
    // Make App throw an error
    (App as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Initialization failed');
    });
    
    // Re-import main.ts
    vi.resetModules();
    await import('../../main');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize CBLIX2:', expect.any(Error));
    
    // Check error screen is displayed
    const errorScreen = document.querySelector('.error-screen');
    expect(errorScreen).toBeTruthy();
    expect(errorScreen?.textContent).toContain('Oops! Something went wrong');
  });
  
  it('should handle document ready state', async () => {
    // Test when document is already loaded
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
    });
    
    vi.resetModules();
    await import('../../main');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { App } = await import('../../App');
    expect(App).toHaveBeenCalled();
  });
});