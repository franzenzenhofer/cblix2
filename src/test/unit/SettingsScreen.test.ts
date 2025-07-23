import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsScreen } from '../../ui/screens/SettingsScreen';
import type { GameSettings } from '../../types';

describe('SettingsScreen', () => {
  let mockSettings: GameSettings;
  let mockOnSave: ReturnType<typeof vi.fn>;
  let mockOnBack: ReturnType<typeof vi.fn>;
  let screen: SettingsScreen;
  
  beforeEach(() => {
    mockSettings = {
      theme: 'auto',
      soundEnabled: true,
      musicEnabled: false,
      particlesEnabled: true,
      colorBlindMode: false,
      showHints: true,
      animationSpeed: 'normal',
      language: 'en',
      analyticsEnabled: false,
    };
    
    mockOnSave = vi.fn();
    mockOnBack = vi.fn();
  });
  
  it('should create a SettingsScreen instance', () => {
    screen = new SettingsScreen({
      settings: mockSettings,
      onSave: mockOnSave,
      onBack: mockOnBack,
    });
    
    expect(screen).toBeDefined();
    expect(screen.getElement()).toBeInstanceOf(HTMLElement);
  });
  
  it('should render all settings UI elements', () => {
    screen = new SettingsScreen({
      settings: mockSettings,
      onSave: mockOnSave,
      onBack: mockOnBack,
    });
    
    const element = screen.getElement();
    expect(element.querySelector('.settings-header')).toBeTruthy();
    expect(element.querySelector('#theme-select')).toBeTruthy();
    expect(element.querySelector('#sound-checkbox')).toBeTruthy();
    expect(element.querySelector('#music-checkbox')).toBeTruthy();
    expect(element.querySelector('#colorblind-checkbox')).toBeTruthy();
    expect(element.querySelector('#hints-checkbox')).toBeTruthy();
    expect(element.querySelector('#save-btn')).toBeTruthy();
  });
  
  it('should display current settings values', () => {
    screen = new SettingsScreen({
      settings: mockSettings,
      onSave: mockOnSave,
      onBack: mockOnBack,
    });
    
    const element = screen.getElement();
    const themeSelect = element.querySelector('#theme-select') as HTMLSelectElement;
    const soundCheckbox = element.querySelector('#sound-checkbox') as HTMLInputElement;
    const musicCheckbox = element.querySelector('#music-checkbox') as HTMLInputElement;
    const colorblindCheckbox = element.querySelector('#colorblind-checkbox') as HTMLInputElement;
    const hintsCheckbox = element.querySelector('#hints-checkbox') as HTMLInputElement;
    
    expect(themeSelect.value).toBe('auto');
    expect(soundCheckbox.checked).toBe(true);
    expect(musicCheckbox.checked).toBe(false);
    expect(colorblindCheckbox.checked).toBe(false);
    expect(hintsCheckbox.checked).toBe(true);
  });
  
  it('should handle back button click', () => {
    screen = new SettingsScreen({
      settings: mockSettings,
      onSave: mockOnSave,
      onBack: mockOnBack,
    });
    
    const backBtn = screen.getElement().querySelector('#back-btn') as HTMLButtonElement;
    backBtn.click();
    
    expect(mockOnBack).toHaveBeenCalled();
  });
  
  it('should collect and save settings changes', () => {
    screen = new SettingsScreen({
      settings: mockSettings,
      onSave: mockOnSave,
      onBack: mockOnBack,
    });
    
    const element = screen.getElement();
    
    // Change some settings
    const themeSelect = element.querySelector('#theme-select') as HTMLSelectElement;
    const soundCheckbox = element.querySelector('#sound-checkbox') as HTMLInputElement;
    const hintsCheckbox = element.querySelector('#hints-checkbox') as HTMLInputElement;
    
    themeSelect.value = 'dark';
    soundCheckbox.checked = false;
    hintsCheckbox.checked = false;
    
    // Click save
    const saveBtn = element.querySelector('#save-btn') as HTMLButtonElement;
    saveBtn.click();
    
    expect(mockOnSave).toHaveBeenCalledWith({
      theme: 'dark',
      soundEnabled: false,
      musicEnabled: false,
      showHints: false,
      colorBlindMode: false,
      particlesEnabled: true,
      animationSpeed: 'normal',
      language: 'en',
    });
  });
  
  it('should handle theme selection change', () => {
    screen = new SettingsScreen({
      settings: mockSettings,
      onSave: mockOnSave,
      onBack: mockOnBack,
    });
    
    const element = screen.getElement();
    const themeSelect = element.querySelector('#theme-select') as HTMLSelectElement;
    
    // Change theme
    themeSelect.value = 'light';
    themeSelect.dispatchEvent(new Event('change'));
    
    // Save settings
    const saveBtn = element.querySelector('#save-btn') as HTMLButtonElement;
    saveBtn.click();
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'light' })
    );
  });
  
  it('should handle checkbox toggles', () => {
    screen = new SettingsScreen({
      settings: mockSettings,
      onSave: mockOnSave,
      onBack: mockOnBack,
    });
    
    const element = screen.getElement();
    const musicCheckbox = element.querySelector('#music-checkbox') as HTMLInputElement;
    const colorblindCheckbox = element.querySelector('#colorblind-checkbox') as HTMLInputElement;
    
    // Toggle checkboxes
    musicCheckbox.checked = true;
    colorblindCheckbox.checked = true;
    
    // Save settings
    const saveBtn = element.querySelector('#save-btn') as HTMLButtonElement;
    saveBtn.click();
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        musicEnabled: true,
        colorBlindMode: true,
      })
    );
  });
  
  
  it('should preserve unchanged settings', () => {
    screen = new SettingsScreen({
      settings: mockSettings,
      onSave: mockOnSave,
      onBack: mockOnBack,
    });
    
    const element = screen.getElement();
    
    // Only change one setting
    const hintsCheckbox = element.querySelector('#hints-checkbox') as HTMLInputElement;
    hintsCheckbox.checked = false;
    
    // Save settings
    const saveBtn = element.querySelector('#save-btn') as HTMLButtonElement;
    saveBtn.click();
    
    // All other settings should remain unchanged
    expect(mockOnSave).toHaveBeenCalledWith({
      theme: 'auto',
      soundEnabled: true,
      musicEnabled: false,
      showHints: false,
      colorBlindMode: false,
      particlesEnabled: true,
      animationSpeed: 'normal',
      language: 'en',
    });
  });
});