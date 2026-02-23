import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LightboxComponent } from './lightbox.component';

describe('LightboxComponent', () => {
  let component: LightboxComponent;
  let fixture: ComponentFixture<LightboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LightboxComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LightboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close event when backdrop is clicked', () => {
    spyOn(component.close, 'emit');
    component.onBackdropClick();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close event when close button is clicked', () => {
    spyOn(component.close, 'emit');
    component.onCloseButtonClick();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should emit close event on Escape key press', () => {
    spyOn(component.close, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onKeyDown(event);
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should not emit close event for other keys', () => {
    spyOn(component.close, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeyDown(event);
    expect(component.close.emit).not.toHaveBeenCalled();
  });

  it('should stop propagation when image is clicked', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.onImageClick(event as any);
    expect(event.stopPropagation).toHaveBeenCalled();
  });
});
