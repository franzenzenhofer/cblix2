import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIManager } from '../../ui/UIManager';

describe('UIManager', () => {
  let container: HTMLElement;
  let manager: UIManager;
  
  beforeEach(() => {
    container = document.createElement('div');
    manager = new UIManager(container);
  });
  
  it('should create a UIManager instance', () => {
    expect(manager).toBeDefined();
  });
  
  it('should show a screen', () => {
    const mockScreen = {
      getElement: () => {
        const element = document.createElement('div');
        element.className = 'test-screen';
        return element;
      },
    };
    
    manager.showScreen(mockScreen);
    
    expect(container.querySelector('.test-screen')).toBeTruthy();
  });
  
  it('should clear previous screen when showing new screen', () => {
    const mockScreen1 = {
      getElement: () => {
        const element = document.createElement('div');
        element.className = 'screen-1';
        return element;
      },
    };
    
    const mockScreen2 = {
      getElement: () => {
        const element = document.createElement('div');
        element.className = 'screen-2';
        return element;
      },
    };
    
    manager.showScreen(mockScreen1);
    expect(container.querySelector('.screen-1')).toBeTruthy();
    
    manager.showScreen(mockScreen2);
    expect(container.querySelector('.screen-1')).toBeFalsy();
    expect(container.querySelector('.screen-2')).toBeTruthy();
  });
  
  it('should apply fade-in animation to new screen', async () => {
    const mockScreen = {
      getElement: () => {
        const element = document.createElement('div');
        element.className = 'test-screen';
        return element;
      },
    };
    
    manager.showScreen(mockScreen);
    const element = container.querySelector('.test-screen') as HTMLElement;
    
    expect(element.style.opacity).toBe('0');
    
    // Wait for animation frames
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          expect(element.style.opacity).toBe('1');
          expect(element.style.transition).toContain('opacity');
          resolve(undefined);
        });
      });
    });
  });
  
  it('should show notification (console error for error type)', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    
    manager.showNotification('Test message', 'error');
    
    expect(consoleSpy).toHaveBeenCalledWith('Test message');
  });
  
  it('should not log for non-error notifications', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    const consoleErrorSpy = vi.spyOn(console, 'error');
    
    manager.showNotification('Test message', 'success');
    manager.showNotification('Test message');
    
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});