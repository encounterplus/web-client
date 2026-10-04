import { AreaEffectShape } from './models/area-effect';
import { affectedSquareCenters, areaTemplateDimensions } from './area-template-tools';

describe('area template tools', () => {
  it('uses the drag distance as a radius for centered shapes', () => {
    for (const shape of [AreaEffectShape.sphere, AreaEffectShape.cylinder]) {
      const dimensions = areaTemplateDimensions(shape, { x: 10, y: 20 }, { x: 40, y: 60 }, 50);
      expect(dimensions.radius).toBe(50);
      expect(dimensions.length).toBe(50);
    }
  });

  it('uses the origin-to-edge drag for cones and cubes', () => {
    for (const shape of [AreaEffectShape.cone, AreaEffectShape.cube]) {
      const dimensions = areaTemplateDimensions(shape, { x: 5, y: 5 }, { x: 5, y: 35 }, 40);
      expect(dimensions.length).toBe(30);
      expect(dimensions.angle).toBeCloseTo(Math.PI / 2);
      expect(dimensions.radius).toBe(0);
    }
  });

  it('keeps lines one grid cell wide', () => {
    const dimensions = areaTemplateDimensions(AreaEffectShape.line, { x: 0, y: 0 }, { x: 30, y: 40 }, 60);
    expect(dimensions.length).toBe(50);
    expect(dimensions.width).toBe(60);
  });

  it('highlights every square touched by a centered radius', () => {
    const centers = affectedSquareCenters(
      AreaEffectShape.sphere,
      { x: 50, y: 50 },
      { x: 101, y: 50 },
      100,
      0,
      0,
      400,
      400
    );
    expect(centers).toContain(jasmine.objectContaining({ x: 50, y: 50 }));
    expect(centers).toContain(jasmine.objectContaining({ x: 150, y: 50 }));
    expect(centers).toContain(jasmine.objectContaining({ x: 50, y: 150 }));
    expect(centers.length).toBe(3);
  });

  it('does not count a square touched only at its boundary', () => {
    const centers = affectedSquareCenters(
      AreaEffectShape.line,
      { x: 0, y: 50 },
      { x: 200, y: 50 },
      100,
      0,
      0,
      400,
      400
    );
    expect(centers).toEqual([
      { x: 50, y: 50 },
      { x: 150, y: 50 }
    ]);
  });

  it('includes the cone origin square and squares crossed by its fan', () => {
    const centers = affectedSquareCenters(
      AreaEffectShape.cone,
      { x: 50, y: 50 },
      { x: 250, y: 50 },
      100,
      0,
      0,
      400,
      400
    );
    expect(centers).toContain(jasmine.objectContaining({ x: 50, y: 50 }));
    expect(centers).toContain(jasmine.objectContaining({ x: 150, y: 50 }));
    expect(centers).toContain(jasmine.objectContaining({ x: 250, y: 50 }));
  });
});
