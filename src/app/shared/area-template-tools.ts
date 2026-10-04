import { AreaEffectShape } from './models/area-effect';

export interface AreaTemplatePoint {
  x: number;
  y: number;
}

export interface AreaTemplateDimensions {
  angle: number;
  length: number;
  radius: number;
  width: number;
}

interface Rectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Converts a player's origin-to-edge drag into Encounter+'s native area-effect
 * dimensions. The native renderer provides the important anchor semantics:
 * circles use their center, cones use their point, and cubes/lines use the
 * midpoint of their starting edge.
 */
export function areaTemplateDimensions(
  shape: AreaEffectShape,
  start: AreaTemplatePoint,
  end: AreaTemplatePoint,
  lineWidth: number
): AreaTemplateDimensions {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.hypot(deltaX, deltaY);

  return {
    angle: Math.atan2(deltaY, deltaX),
    length: distance,
    radius: shape == AreaEffectShape.sphere || shape == AreaEffectShape.cylinder ? distance : 0,
    width: Math.max(1, lineWidth)
  };
}

function rotatePoint(point: AreaTemplatePoint, origin: AreaTemplatePoint, angle: number): AreaTemplatePoint {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: origin.x + (point.x * cosine) - (point.y * sine),
    y: origin.y + (point.x * sine) + (point.y * cosine)
  };
}

function templatePolygon(
  shape: AreaEffectShape,
  start: AreaTemplatePoint,
  dimensions: AreaTemplateDimensions
): AreaTemplatePoint[] {
  if (shape == AreaEffectShape.cone) {
    const points: AreaTemplatePoint[] = [start];
    const halfAngle = 26.5 * Math.PI / 180;
    const segments = 32;
    for (let index = 0; index <= segments; index++) {
      const angle = dimensions.angle - halfAngle + ((halfAngle * 2 * index) / segments);
      points.push({
        x: start.x + dimensions.length * Math.cos(angle),
        y: start.y + dimensions.length * Math.sin(angle)
      });
    }
    return points;
  }

  const halfWidth = shape == AreaEffectShape.cube ? dimensions.length / 2 : dimensions.width / 2;
  return [
    rotatePoint({ x: 0, y: -halfWidth }, start, dimensions.angle),
    rotatePoint({ x: dimensions.length, y: -halfWidth }, start, dimensions.angle),
    rotatePoint({ x: dimensions.length, y: halfWidth }, start, dimensions.angle),
    rotatePoint({ x: 0, y: halfWidth }, start, dimensions.angle)
  ];
}

function pointInRectangle(point: AreaTemplatePoint, rectangle: Rectangle): boolean {
  return point.x > rectangle.left && point.x < rectangle.right && point.y > rectangle.top && point.y < rectangle.bottom;
}

function pointInPolygon(point: AreaTemplatePoint, polygon: AreaTemplatePoint[]): boolean {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const a = polygon[current];
    const b = polygon[previous];
    if (((a.y > point.y) != (b.y > point.y)) &&
        point.x < ((b.x - a.x) * (point.y - a.y) / (b.y - a.y)) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

function direction(a: AreaTemplatePoint, b: AreaTemplatePoint, c: AreaTemplatePoint): number {
  return ((c.x - a.x) * (b.y - a.y)) - ((b.x - a.x) * (c.y - a.y));
}

function segmentsCross(a: AreaTemplatePoint, b: AreaTemplatePoint, c: AreaTemplatePoint, d: AreaTemplatePoint): boolean {
  const abC = direction(a, b, c);
  const abD = direction(a, b, d);
  const cdA = direction(c, d, a);
  const cdB = direction(c, d, b);
  return ((abC > 0 && abD < 0) || (abC < 0 && abD > 0)) &&
    ((cdA > 0 && cdB < 0) || (cdA < 0 && cdB > 0));
}

function polygonIntersectsRectangle(polygon: AreaTemplatePoint[], rectangle: Rectangle): boolean {
  if (polygon.some(point => pointInRectangle(point, rectangle))) return true;

  const corners = [
    { x: rectangle.left, y: rectangle.top },
    { x: rectangle.right, y: rectangle.top },
    { x: rectangle.right, y: rectangle.bottom },
    { x: rectangle.left, y: rectangle.bottom }
  ];
  if (corners.some(point => pointInPolygon(point, polygon))) return true;

  for (let polygonIndex = 0; polygonIndex < polygon.length; polygonIndex++) {
    const polygonStart = polygon[polygonIndex];
    const polygonEnd = polygon[(polygonIndex + 1) % polygon.length];
    for (let rectangleIndex = 0; rectangleIndex < corners.length; rectangleIndex++) {
      if (segmentsCross(polygonStart, polygonEnd, corners[rectangleIndex], corners[(rectangleIndex + 1) % corners.length])) {
        return true;
      }
    }
  }
  return false;
}

function circleIntersectsRectangle(center: AreaTemplatePoint, radius: number, rectangle: Rectangle): boolean {
  const closestX = Math.max(rectangle.left, Math.min(center.x, rectangle.right));
  const closestY = Math.max(rectangle.top, Math.min(center.y, rectangle.bottom));
  return Math.hypot(center.x - closestX, center.y - closestY) < radius;
}

/** Returns the center of every square with a non-zero overlap with the template. */
export function affectedSquareCenters(
  shape: AreaEffectShape,
  start: AreaTemplatePoint,
  end: AreaTemplatePoint,
  gridSize: number,
  offsetX: number,
  offsetY: number,
  maximumWidth = Number.POSITIVE_INFINITY,
  maximumHeight = Number.POSITIVE_INFINITY
): AreaTemplatePoint[] {
  if (!Number.isFinite(gridSize) || gridSize <= 0) return [];

  const dimensions = areaTemplateDimensions(shape, start, end, gridSize);
  if (dimensions.length <= 0) return [];

  const polygon = shape == AreaEffectShape.sphere || shape == AreaEffectShape.cylinder
    ? null
    : templatePolygon(shape, start, dimensions);
  const extent = shape == AreaEffectShape.cube
    ? Math.hypot(dimensions.length, dimensions.length / 2)
    : shape == AreaEffectShape.line
      ? Math.hypot(dimensions.length, dimensions.width / 2)
      : dimensions.length;
  const minX = Math.max(0, start.x - extent);
  const maxX = Math.min(maximumWidth, start.x + extent);
  const minY = Math.max(0, start.y - extent);
  const maxY = Math.min(maximumHeight, start.y + extent);
  const startColumn = Math.max(0, Math.floor((minX - offsetX) / gridSize));
  const endColumn = Math.floor((maxX - offsetX) / gridSize);
  const startRow = Math.max(0, Math.floor((minY - offsetY) / gridSize));
  const endRow = Math.floor((maxY - offsetY) / gridSize);
  const centers: AreaTemplatePoint[] = [];
  const inset = Math.max(0.001, gridSize * 0.00001);

  for (let column = startColumn; column <= endColumn; column++) {
    for (let row = startRow; row <= endRow; row++) {
      const left = offsetX + column * gridSize;
      const top = offsetY + row * gridSize;
      const rectangle = {
        left: left + inset,
        top: top + inset,
        right: left + gridSize - inset,
        bottom: top + gridSize - inset
      };
      const affected = polygon
        ? polygonIntersectsRectangle(polygon, rectangle)
        : circleIntersectsRectangle(start, dimensions.radius, rectangle);
      if (affected) {
        centers.push({ x: left + gridSize / 2, y: top + gridSize / 2 });
      }
    }
  }

  return centers;
}
