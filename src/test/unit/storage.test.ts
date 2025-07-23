import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadGameSettings, saveGameSettings } from '../../utils/storage';
import type { GameSettings } from '../../types';

describe('Storage utilities', () => {
  beforeEach(() => {
    // Reset localStorage mock
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    vi.clearAllMocks();
  });
  
  describe('loadGameSettings', () => {
    it('should return default settings when no saved settings exist', async () => {
      (localStorage.getItem as any).mockReturnValue(null);
      
      const settings = await loadGameSettings();
      
      expect(settings).toEqual({
        theme: 'auto',
        soundEnabled: true,
        musicEnabled: true,
        particlesEnabled: true,
        colorBlindMode: false,
        showHints: true,
        animationSpeed: 'normal',
        language: 'en',
        analyticsEnabled: true,
      });
    });
    
    it('should load saved settings from localStorage', async () => {
      const savedSettings: GameSettings = {
        theme: 'dark',
        soundEnabled: false,
        musicEnabled: false,
        particlesEnabled: false,
        colorBlindMode: true,
        showHints: false,
        animationSpeed: 'fast',
        language: 'de',
      };
      
      (localStorage.getItem as any).mockReturnValue(JSON.stringify(savedSettings));
      
      const settings = await loadGameSettings();
      
      expect(settings).toEqual({
        ...savedSettings,
        analyticsEnabled: true, // Default value added
      });
    });
    
    it('should return default settings when localStorage contains invalid JSON', async () => {
      (localStorage.getItem as any).mockReturnValue('invalid json');
      
      const consoleSpy = vi.spyOn(console, 'warn');
      const settings = await loadGameSettings();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(settings).toEqual({
        theme: 'auto',
        soundEnabled: true,
        musicEnabled: true,
        particlesEnabled: true,
        colorBlindMode: false,
        showHints: true,
        animationSpeed: 'normal',
        language: 'en',
        analyticsEnabled: true,
      });
    });
  });
  
  describe('saveGameSettings', () => {
    it('should save settings to localStorage', async () => {
      const settings: GameSettings = {
        theme: 'light',
        soundEnabled: true,
        musicEnabled: false,
        particlesEnabled: true,
        colorBlindMode: false,
        showHints: true,
        animationSpeed: 'slow',
        language: 'fr',
      };
      
      await saveGameSettings(settings);
      
      expect(localStorage.setItem).toHaveBeenCalledWith('cblix2_settings', JSON.stringify(settings));
    });
    
    it('should handle localStorage errors gracefully', async () => {
      const settings: GameSettings = {
        theme: 'auto',
        soundEnabled: true,
        musicEnabled: true,
        particlesEnabled: true,
        colorBlindMode: false,
        showHints: true,
        animationSpeed: 'normal',
        language: 'en',
      };
      
      // Mock localStorage.setItem to throw an error
      (localStorage.setItem as any).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const consoleSpy = vi.spyOn(console, 'error');
      
      await saveGameSettings(settings);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save settings:', expect.any(Error));
    });
  });
});