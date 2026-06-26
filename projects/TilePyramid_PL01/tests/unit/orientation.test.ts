import { describe, it, expect } from 'vitest';
import { classifyOrientation } from '../../src/orientation/OrientationController';

describe('classifyOrientation', () => {
  it('returns portrait when width < height', () => {
    expect(classifyOrientation(390, 844)).toBe('portrait');
  });

  it('returns portrait when width === height (square)', () => {
    expect(classifyOrientation(768, 768)).toBe('portrait');
  });

  it('returns landscape when width > height', () => {
    expect(classifyOrientation(844, 390)).toBe('landscape');
  });

  it('returns portrait for iPhone 14 portrait (390×844)', () => {
    expect(classifyOrientation(390, 844)).toBe('portrait');
  });

  it('returns landscape for iPhone 14 landscape (844×390)', () => {
    expect(classifyOrientation(844, 390)).toBe('landscape');
  });

  it('returns portrait for a very tall viewport', () => {
    expect(classifyOrientation(100, 9000)).toBe('portrait');
  });

  it('returns landscape for a very wide viewport', () => {
    expect(classifyOrientation(9000, 100)).toBe('landscape');
  });
});
