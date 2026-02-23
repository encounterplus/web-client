import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LightboxComponent } from './lightbox.component';
import { LightboxService } from './lightbox.service';

describe('LightboxComponent', () => {
  let component: LightboxComponent;
  let fixture: ComponentFixture<LightboxComponent>;
  let service: LightboxService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LightboxComponent],
      providers: [LightboxService]
    }).compileComponents();

    fixture = TestBed.createComponent(LightboxComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(LightboxService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close lightbox on backdrop click', () => {
    spyOn(service, 'close');
    component.onBackdropClick();
    expect(service.close).toHaveBeenCalled();
  });

  it('should close lightbox on close button click', () => {
    spyOn(service, 'close');
    component.onCloseButtonClick();
    expect(service.close).toHaveBeenCalled();
  });

  it('should close lightbox on Escape key press', () => {
    spyOn(service, 'close');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onKeyDown(event);
    expect(service.close).toHaveBeenCalled();
  });

  it('should not close lightbox for other keys', () => {
    spyOn(service, 'close');
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeyDown(event);
    expect(service.close).not.toHaveBeenCalled();
  });

  it('should stop propagation when image is clicked', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.onImageClick(event as any);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('should subscribe to lightbox state', (done) => {
    service.open('test-image.jpg', 'Test');
    component.lightboxState$.subscribe(state => {
      expect(state.isOpen).toBe(true);
      expect(state.imageUrl).toBe('test-image.jpg');
      done();
    });
  });
});
