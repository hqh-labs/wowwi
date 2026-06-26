export type Orientation = 'portrait' | 'landscape';

export interface ViewportSize {
  width: number;
  height: number;
  x: number;
  y: number;
}

/** Returns 'portrait' when width <= height, 'landscape' otherwise. */
export function classifyOrientation(width: number, height: number): Orientation {
  return width <= height ? 'portrait' : 'landscape';
}

/**
 * Computes the largest axis-aligned rectangle with the design aspect ratio
 * that fits inside the given container, and its top-left position.
 */
export function calculateViewport(
  containerWidth: number,
  containerHeight: number,
  designWidth: number,
  designHeight: number
): ViewportSize {
  const designAspect = designWidth / designHeight;
  const containerAspect = containerWidth / containerHeight;

  let vpWidth: number;
  let vpHeight: number;

  if (containerAspect > designAspect) {
    // Container is wider than the design → height is the binding constraint.
    vpHeight = containerHeight;
    vpWidth = vpHeight * designAspect;
  } else {
    // Container is taller than the design → width is the binding constraint.
    vpWidth = containerWidth;
    vpHeight = vpWidth / designAspect;
  }

  const x = (containerWidth - vpWidth) / 2;
  const y = (containerHeight - vpHeight) / 2;

  return { width: vpWidth, height: vpHeight, x, y };
}

type OrientationCallback = (orientation: Orientation) => void;

/**
 * Manages the full-screen DOM background layer and emits orientation-change
 * events.  The Phaser canvas is not touched here — Phaser's own Scale Manager
 * handles canvas sizing.
 */
export class OrientationController {
  private readonly bgLayer: HTMLElement;
  private readonly backgroundPath: string;
  private readonly backgroundFit: string;
  private changeCallbacks: OrientationCallback[] = [];

  constructor(backgroundPath: string, backgroundFit: string) {
    this.backgroundPath = backgroundPath;
    this.backgroundFit = backgroundFit;
    this.bgLayer = this.getOrCreateBgLayer();
    this.applyBackground();
    window.addEventListener('resize', this.onResize);
  }

  private getOrCreateBgLayer(): HTMLElement {
    const existing = document.getElementById('bg-layer');
    if (existing) return existing;
    const layer = document.createElement('div');
    layer.id = 'bg-layer';
    document.body.insertBefore(layer, document.body.firstChild);
    return layer;
  }

  private applyBackground(): void {
    this.bgLayer.style.backgroundImage = `url(${this.backgroundPath})`;
    this.bgLayer.style.backgroundSize = this.backgroundFit;
  }

  private readonly onResize = (): void => {
    const orientation = classifyOrientation(window.innerWidth, window.innerHeight);
    for (const cb of this.changeCallbacks) cb(orientation);
  };

  public get currentOrientation(): Orientation {
    return classifyOrientation(window.innerWidth, window.innerHeight);
  }

  public onOrientationChange(callback: OrientationCallback): void {
    this.changeCallbacks.push(callback);
  }

  public destroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.changeCallbacks = [];
  }
}
