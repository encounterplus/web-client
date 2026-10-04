import * as PIXI from 'pixi.js';
import { AreaEffect } from 'src/app/shared/models/area-effect';
import { affectedSquareCenters } from 'src/app/shared/area-template-tools';
import { formatMeasurementDistance } from 'src/app/shared/measurement-tools';
import { Grid } from '../models/grid';
import { SquareGrid } from '../models/square-grid';
import { AreaEffectView } from './area-effect-view';

export class LocalAreaTemplateView extends AreaEffectView {
  editing = true;
  maximumWidth = Number.POSITIVE_INFINITY;
  maximumHeight = Number.POSITIVE_INFINITY;
  private affectedCells = new PIXI.Graphics();
  private distanceText: PIXI.Text;

  constructor(areaEffect: AreaEffect, grid: Grid) {
    super(areaEffect, grid);
    this.distanceText = new PIXI.Text({
      text: '',
      style: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: Math.max(14, this.grid.size / 3),
        fontWeight: 'bold',
        fill: 0xffffff,
        dropShadow: { color: '#000000', blur: 5, distance: 1, alpha: 1, angle: 0 }
      }
    });
    this.distanceText.anchor.set(0, 0.5);
    this.distanceText.resolution = 2;
  }

  setEditing(editing: boolean) {
    this.editing = editing;
    this.selected = editing;
    void this.draw();
  }

  override async draw() {
    if (this.destroyed) return this;
    this.selected = this.editing;
    this.clear();
    this.update();
    // Local previews have no assets to load. Drawing synchronously prevents a cleared
    // preview from reattaching graphics after a pending inherited draw resumes.
    void this.drawShape();
    void this.drawHandles();

    this.affectedCells.clear();
    this.distanceText.text = '';
    this.affectedCells.visible = this.areaEffect.length > 0;
    this.distanceText.visible = this.areaEffect.length > 0;
    if (this.affectedCells.visible) {
      this.drawAffectedCells();
      this.affectedCells.alpha = this.editing ? 0.22 : 0.12;
    }
    if (this.distanceText.visible) this.drawDistance();
    this.addChildAt(this.affectedCells, 0);
    this.addChild(this.distanceText);
    return this;
  }

  override clear() {
    this.shapeGraphics?.destroy();
    this.handlesGraphics?.destroy();
    super.clear();
  }

  private drawAffectedCells() {
    if (!(this.grid instanceof SquareGrid)) return;

    const centers = affectedSquareCenters(
      this.areaEffect.shape,
      this.start,
      this.end,
      this.grid.size,
      this.grid.offsetX,
      this.grid.offsetY,
      this.maximumWidth,
      this.maximumHeight
    );
    const path = centers.flatMap(point => [point.x, point.y]);
    this.grid.pathGraphics(path, { width: 1, height: 1 }, new PIXI.Color(this.areaEffect.color).toNumber(), this.affectedCells);
  }

  private drawDistance() {
    const distance = this.areaEffect.length / this.grid.pixelRatio;
    this.distanceText.text = formatMeasurementDistance(distance, this.grid.units);
    this.distanceText.style.fontSize = Math.max(14, this.grid.size / 3);
    this.distanceText.position.set(
      this.end.x + Math.max(8, this.grid.size / 6),
      this.end.y + Math.max(8, this.grid.size / 6)
    );
  }
}
