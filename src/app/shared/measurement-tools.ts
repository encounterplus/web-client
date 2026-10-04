export function measurementDistance(data: Array<number>, pixelRatio: number): number {
  if (!Array.isArray(data) || data.length < 4 || !Number.isFinite(pixelRatio) || pixelRatio <= 0) {
    return 0;
  }

  let pixels = 0;
  for (let i = 2; i + 1 < data.length; i += 2) {
    const dx = data[i] - data[i - 2];
    const dy = data[i + 1] - data[i - 1];
    pixels += Math.hypot(dx, dy);
  }

  return pixels / pixelRatio;
}

export function formatMeasurementDistance(distance: number, units: string): string {
  const rounded = Math.round(Math.max(0, distance) * 10) / 10;
  const value = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${value} ${units || ''}`.trim();
}

export interface GridMovementSegment {
  horizontal: number;
  vertical: number;
}

export function alternatingDiagonalMovement(segments: Array<GridMovementSegment>): number {
  let straightSteps = 0;
  let diagonalSteps = 0;

  for (const segment of segments) {
    const horizontal = Math.abs(Math.round(segment.horizontal));
    const vertical = Math.abs(Math.round(segment.vertical));
    const diagonal = Math.min(horizontal, vertical);

    diagonalSteps += diagonal;
    straightSteps += Math.max(horizontal, vertical) - diagonal;
  }

  // PF2E alternates diagonal movement between one and two grid steps:
  // 5 feet, then 10 feet, then 5 feet, and so on.
  return straightSteps + diagonalSteps + Math.floor(diagonalSteps / 2);
}
