import type { GameSettings } from '@types';

const SETTINGS_KEY = 'cblix2_settings';
const SAVE_DATA_KEY = 'cblix2_save';

export async function loadGameSettings(): Promise<GameSettings> {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all properties exist (add defaults for missing ones)
      return {
        ...getDefaultSettings(),
        ...parsed,
      };
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  
  // Return defaults
  return getDefaultSettings();
}

function getDefaultSettings(): GameSettings {
  return {
    theme: 'auto',
    soundEnabled: true,
    musicEnabled: true,
    particlesEnabled: true,
    colorBlindMode: false,
    showHints: true,
    animationSpeed: 'normal',
    language: 'en',
    analyticsEnabled: true,
  };
}

export async function saveGameSettings(settings: GameSettings): Promise<void> {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}