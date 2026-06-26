import { describe, it, expect } from 'vitest';
import { calculateViewport } from '../../src/orientation/OrientationController';

const DESIGN_W = 1080;
const DESIGN_H = 1920;
const DESIGN_ASPECT = DESIGN_W / DESIGN_H; // 0.5625

describe('calculateViewport', () => {
  it('fills width in a narrow-portrait container', () => {
    const vp = calculateViewport(390, 844, DESIGN_W, DESIGN_H);
    expect(vp.width).toBeCloseTo(390);
    expect(vp.height).toBeCloseTo(390 / DESIGN_ASPECT);
  });

  it('never exceeds container width', () => {
    const vp = calculateViewport(390, 844, DESIGN_W, DESIGN_H);
    expect(vp.width).toBeLessThanOrEqual(390 + 0.01);
    expect(vp.height).toBeLessThanOrEqual(844 + 0.01);
  });

  it('preserves 9:16 aspect ratio in portrait', () => {
    const vp = calculateViewport(390, 844, DESIGN_W, DESIGN_H);
    expect(vp.width / vp.height).toBeCloseTo(DESIGN_ASPECT, 5);
  });

  it('preserves 9:16 aspect ratio in landscape', () => {
    const vp = calculateViewport(844, 390, DESIGN_W, DESIGN_H);
    expect(vp.width / vp.height).toBeCloseTo(DESIGN_ASPECT, 5);
  });

  it('landscape: canvas is constrained by height', () => {
    const vp = calculateViewport(844, 390, DESIGN_W, DESIGN_H);
    expect(vp.height).toBeCloseTo(390);
    expect(vp.width).toBeCloseTo(390 * DESIGN_ASPECT);
  });

  it('landscape: viewport is portrait-oriented (height > width)', () => {
    const vp = calculateViewport(844, 390, DESIGN_W, DESIGN_H);
    expect(vp.height).toBeGreaterThan(vp.width);
  });

  it('landscape: viewport does not exceed container bounds', () => {
    const vp = calculateViewport(844, 390, DESIGN_W, DESIGN_H);
    expect(vp.width).toBeLessThanOrEqual(844 + 0.01);
    expect(vp.height).toBeLessThanOrEqual(390 + 0.01);
  });

  it('landscape: viewport is centered horizontally', () => {
    const vp = calculateViewport(844, 390, DESIGN_W, DESIGN_H);
    expect(vp.x).toBeCloseTo((844 - vp.width) / 2);
  });

  it('landscape: viewport is centered vertically (y ≈ 0 when height fills container)', () => {
    const vp = calculateViewport(844, 390, DESIGN_W, DESIGN_H);
    expect(vp.y).toBeCloseTo(0, 1);
  });

  it('portrait: viewport is centered horizontally (x ≈ 0 when width fills container)', () => {
    const vp = calculateViewport(390, 844, DESIGN_W, DESIGN_H);
    expect(vp.x).toBeCloseTo(0, 1);
  });

  it('portrait: viewport is centered vertically', () => {
    const vp = calculateViewport(390, 844, DESIGN_W, DESIGN_H);
    expect(vp.y).toBeCloseTo((844 - vp.height) / 2);
  });

  it('exact design size: fills exactly', () => {
    const vp = calculateViewport(DESIGN_W, DESIGN_H, DESIGN_W, DESIGN_H);
    expect(vp.width).toBeCloseTo(DESIGN_W);
    expect(vp.height).toBeCloseTo(DESIGN_H);
    expect(vp.x).toBeCloseTo(0);
    expect(vp.y).toBeCloseTo(0);
  });
});
