import { describe, it, expect } from 'vitest';
import { initializeAnalytics } from '../../utils/analytics';

describe('analytics', () => {
  it('should initialize analytics', async () => {
    await expect(initializeAnalytics()).resolves.toBeUndefined();
  });
});