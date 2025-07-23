import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioManager } from '../../utils/AudioManager';

describe('AudioManager', () => {
  let manager: AudioManager;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  it('should create an AudioManager instance', () => {
    manager = new AudioManager(true, true);
    expect(manager).toBeDefined();
  });
  
  it('should initialize audio manager', async () => {
    manager = new AudioManager(true, true);
    await expect(manager.initialize()).resolves.toBeUndefined();
  });
  
  it('should play sound when sound is enabled', () => {
    manager = new AudioManager(true, false);
    expect(() => manager.playSound('click')).not.toThrow();
  });
  
  it('should not play sound when sound is disabled', () => {
    manager = new AudioManager(false, false);
    expect(() => manager.playSound('click')).not.toThrow();
  });
  
  it('should play music when music is enabled', () => {
    manager = new AudioManager(false, true);
    expect(() => manager.playMusic('theme')).not.toThrow();
  });
  
  it('should not play music when music is disabled', () => {
    manager = new AudioManager(false, false);
    expect(() => manager.playMusic('theme')).not.toThrow();
  });
  
  it('should enable sound', () => {
    manager = new AudioManager(false, false);
    manager.setSoundEnabled(true);
    expect(() => manager.playSound('test')).not.toThrow();
  });
  
  it('should disable sound', () => {
    manager = new AudioManager(true, false);
    manager.setSoundEnabled(false);
    manager.playSound('test');
    
    expect(consoleSpy).not.toHaveBeenCalledWith('Playing sound:', 'test');
  });
  
  it('should enable music', () => {
    manager = new AudioManager(false, false);
    manager.setMusicEnabled(true);
    expect(() => manager.playMusic('test')).not.toThrow();
  });
  
  it('should disable music', () => {
    manager = new AudioManager(false, true);
    manager.setMusicEnabled(false);
    manager.playMusic('test');
    
    expect(consoleSpy).not.toHaveBeenCalledWith('Playing music:', 'test');
  });
});