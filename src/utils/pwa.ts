export async function initializeServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      // Service Worker registered successfully
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}