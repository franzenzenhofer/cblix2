export class ThemeManager {
  private theme: 'light' | 'dark' | 'auto';
  
  constructor(theme: 'light' | 'dark' | 'auto') {
    this.theme = theme;
  }
  
  applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.theme);
    
    // Update meta theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      const isDark = this.isDarkMode();
      metaTheme.setAttribute('content', isDark ? '#0f0f23' : '#ffffff');
    }
  }
  
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.theme = theme;
    this.applyTheme();
  }
  
  private isDarkMode(): boolean {
    if (this.theme === 'dark') return true;
    if (this.theme === 'light') return false;
    
    // Auto mode
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}