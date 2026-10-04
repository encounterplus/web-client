import { minimalAreaEffect } from 'src/app/shared/models/testing/fixtures';
import { SquareGrid } from '../models/square-grid';
import { LocalAreaTemplateView } from './local-area-template-view';

describe('LocalAreaTemplateView', () => {
  it('releases replaced shape graphics during a drag', async () => {
    const view = new LocalAreaTemplateView(minimalAreaEffect({ length: 50, radius: 50 }), new SquareGrid());
    await view.draw();
    const shape = view.shapeGraphics;
    const handles = view.handlesGraphics;
    await view.draw();
    expect(shape.destroyed).toBeTrue();
    expect(handles.destroyed).toBeTrue();
    expect(view.children.length).toBe(4);
    view.destroy({ children: true });
  });

  it('can be cleared immediately after drawing without pending graphics returning', async () => {
    const view = new LocalAreaTemplateView(minimalAreaEffect(), new SquareGrid());
    const draw = view.draw();
    view.destroy({ children: true });
    await draw;
    await view.draw();
    expect(view.destroyed).toBeTrue();
    expect(view.children.length).toBe(0);
  });
});
