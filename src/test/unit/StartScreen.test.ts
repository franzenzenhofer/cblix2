import { describe, it, expect, vi } from 'vitest';
import { StartScreen } from '../../ui/screens/StartScreen';

describe('StartScreen', () => {
  const mockConfig = {
    version: '2.0.0',
    buildDate: '2025-01-01T00:00:00Z',
    onStart: vi.fn(),
    onSettings: vi.fn(),
    onTutorial: vi.fn(),
  };
  
  it('should create a StartScreen instance', () => {
    const screen = new StartScreen(mockConfig);
    expect(screen).toBeDefined();
    expect(screen.getElement()).toBeInstanceOf(HTMLElement);
  });
  
  it('should display version number', () => {
    const screen = new StartScreen(mockConfig);
    const element = screen.getElement();
    
    expect(element.querySelector('.version')?.textContent).toContain('Version 2.0.0');
  });
  
  it('should display build date', () => {
    const screen = new StartScreen(mockConfig);
    const element = screen.getElement();
    
    expect(element.querySelector('.build-date')?.textContent).toContain('Built on');
  });
  
  it('should display game title and branding', () => {
    const screen = new StartScreen(mockConfig);
    const element = screen.getElement();
    
    expect(element.querySelector('.title-cblix')?.textContent).toBe('CBLIX');
    expect(element.querySelector('.title-2')?.textContent).toBe('2');
    expect(element.querySelector('.tagline')?.textContent).toBe('✨ The Best App Ever ✨');
    expect(element.querySelector('.author')?.textContent).toBe('Enhanced by Franz Enzenhofer');
  });
  
  it('should have all menu buttons', () => {
    const screen = new StartScreen(mockConfig);
    const element = screen.getElement();
    
    expect(element.querySelector('#start-btn')).toBeTruthy();
    expect(element.querySelector('#tutorial-btn')).toBeTruthy();
    expect(element.querySelector('#settings-btn')).toBeTruthy();
  });
  
  it('should call onStart when play button is clicked', () => {
    const screen = new StartScreen(mockConfig);
    const element = screen.getElement();
    const startBtn = element.querySelector('#start-btn') as HTMLButtonElement;
    
    startBtn.click();
    
    expect(mockConfig.onStart).toHaveBeenCalled();
  });
  
  it('should call onSettings when settings button is clicked', () => {
    const screen = new StartScreen(mockConfig);
    const element = screen.getElement();
    const settingsBtn = element.querySelector('#settings-btn') as HTMLButtonElement;
    
    settingsBtn.click();
    
    expect(mockConfig.onSettings).toHaveBeenCalled();
  });
  
  it('should call onTutorial when tutorial button is clicked', () => {
    const screen = new StartScreen(mockConfig);
    const element = screen.getElement();
    const tutorialBtn = element.querySelector('#tutorial-btn') as HTMLButtonElement;
    
    tutorialBtn.click();
    
    expect(mockConfig.onTutorial).toHaveBeenCalled();
  });
  
  it('should display features list', () => {
    const screen = new StartScreen(mockConfig);
    const element = screen.getElement();
    const featuresList = element.querySelector('.features-list');
    
    expect(featuresList).toBeTruthy();
    expect(featuresList?.textContent).toContain('7 New Tile Types');
    expect(featuresList?.textContent).toContain('Modern UI Design');
    expect(featuresList?.textContent).toContain('Dark/Light Themes');
    expect(featuresList?.textContent).toContain('100% Test Coverage');
    expect(featuresList?.textContent).toContain('Blazing Fast Performance');
  });
});