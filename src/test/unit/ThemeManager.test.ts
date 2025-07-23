import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeManager } from '../../utils/ThemeManager';

describe('ThemeManager', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.removeAttribute('data-theme');
    
    // Create meta theme-color tag
    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTag);
    }
  });
  
  it('should create a ThemeManager instance', () => {
    const manager = new ThemeManager('light');
    expect(manager).toBeDefined();
  });
  
  it('should apply light theme', () => {
    const manager = new ThemeManager('light');
    manager.applyTheme();
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#ffffff');
  });
  
  it('should apply dark theme', () => {
    const manager = new ThemeManager('dark');
    manager.applyTheme();
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#0f0f23');
  });
  
  it('should apply auto theme', () => {
    const manager = new ThemeManager('auto');
    manager.applyTheme();
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('auto');
  });
  
  it('should detect dark mode preference in auto mode', () => {
    // Mock matchMedia to return dark mode preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    const manager = new ThemeManager('auto');
    manager.applyTheme();
    
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#0f0f23');
  });
  
  it('should detect light mode preference in auto mode', () => {
    // Mock matchMedia to return light mode preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    const manager = new ThemeManager('auto');
    manager.applyTheme();
    
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#ffffff');
  });
  
  it('should change theme', () => {
    const manager = new ThemeManager('light');
    manager.applyTheme();
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    
    manager.setTheme('dark');
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});