import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeServiceWorker } from '../../utils/pwa';

describe('pwa', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });
  
  it('should register service worker when available', async () => {
    const mockRegister = vi.fn().mockResolvedValue({ scope: '/' });
    
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
      configurable: true,
    });
    
    await initializeServiceWorker();
    
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });
  
  it('should handle service worker registration errors', async () => {
    const mockError = new Error('Registration failed');
    const mockRegister = vi.fn().mockRejectedValue(mockError);
    
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
      configurable: true,
    });
    
    await initializeServiceWorker();
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Service Worker registration failed:', mockError);
  });
  
  it('should do nothing when service worker is not available', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    
    await expect(initializeServiceWorker()).resolves.toBeUndefined();
  });
});