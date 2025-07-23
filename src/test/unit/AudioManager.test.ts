import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioManager } from '../../utils/AudioManager';

describe('AudioManager', () => {
  let manager: AudioManager;
  let consoleSpy: any;
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log');
  });
  
  it('should create an AudioManager instance', () => {
    manager = new AudioManager(true, true);
    expect(manager).toBeDefined();
  });
  
  it('should initialize audio manager', async () => {
    manager = new AudioManager(true, true);
    await manager.initialize();
    
    expect(consoleSpy).toHaveBeenCalledWith('Audio manager initialized');
  });
  
  it('should play sound when sound is enabled', () => {
    manager = new AudioManager(true, false);
    manager.playSound('click');
    
    expect(consoleSpy).toHaveBeenCalledWith('Playing sound:', 'click');
  });
  
  it('should not play sound when sound is disabled', () => {
    manager = new AudioManager(false, false);
    manager.playSound('click');
    
    expect(consoleSpy).not.toHaveBeenCalledWith('Playing sound:', 'click');
  });
  
  it('should play music when music is enabled', () => {
    manager = new AudioManager(false, true);
    manager.playMusic('theme');
    
    expect(consoleSpy).toHaveBeenCalledWith('Playing music:', 'theme');
  });
  
  it('should not play music when music is disabled', () => {
    manager = new AudioManager(false, false);
    manager.playMusic('theme');
    
    expect(consoleSpy).not.toHaveBeenCalledWith('Playing music:', 'theme');
  });
  
  it('should enable sound', () => {
    manager = new AudioManager(false, false);
    manager.setSoundEnabled(true);
    manager.playSound('test');
    
    expect(consoleSpy).toHaveBeenCalledWith('Playing sound:', 'test');
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
    manager.playMusic('test');
    
    expect(consoleSpy).toHaveBeenCalledWith('Playing music:', 'test');
  });
  
  it('should disable music', () => {
    manager = new AudioManager(false, true);
    manager.setMusicEnabled(false);
    manager.playMusic('test');
    
    expect(consoleSpy).not.toHaveBeenCalledWith('Playing music:', 'test');
  });
});