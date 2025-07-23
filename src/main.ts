import './styles/global.css';
import './styles/themes.css';
import { App } from './App';
import { initializeServiceWorker } from './utils/pwa';
import { loadGameSettings } from './utils/storage';
import { initializeAnalytics } from './utils/analytics';

// Declare global version info
declare global {
  interface Window {
    CBLIX2_VERSION: string;
    CBLIX2_BUILD_DATE: string;
  }
}

// Initialize the app
async function main(): Promise<void> {
  try {
    // Load saved settings
    const settings = await loadGameSettings();
    
    // Initialize analytics (if enabled)
    if (settings.analyticsEnabled) {
      await initializeAnalytics();
    }
    
    // Initialize service worker for PWA
    await initializeServiceWorker();
    
    // Create and mount the app
    const app = new App({
      container: document.getElementById('app') as HTMLElement,
      settings,
    });
    
    await app.initialize();
    
    // Log version info
    console.log(`🎮 CBLIX2 - The Best App Ever v${window.CBLIX2_VERSION || import.meta.env.VITE_APP_VERSION}`);
    console.log(`📅 Build Date: ${window.CBLIX2_BUILD_DATE || import.meta.env.VITE_BUILD_DATE}`);
    
  } catch (error) {
    console.error('Failed to initialize CBLIX2:', error);
    // Show error screen
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `
        <div class="error-screen">
          <h1>😢 Oops! Something went wrong</h1>
          <p>Failed to load CBLIX2. Please refresh the page.</p>
          <button onclick="location.reload()">Refresh</button>
        </div>
      `;
    }
  }
}

// Start the app when DOM is ready
if (document.readyState !== 'loading') {
  void main();
} else {
  document.addEventListener('DOMContentLoaded', () => void main());
}