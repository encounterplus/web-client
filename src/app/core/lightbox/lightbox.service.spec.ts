import { TestBed } from '@angular/core/testing';
import { LightboxService } from './lightbox.service';

describe('LightboxService', () => {
  let service: LightboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LightboxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open lightbox with image URL and alt text', (done) => {
    service.open('test-url.jpg', 'Test Alt');
    service.state$.subscribe(state => {
      expect(state.isOpen).toBe(true);
      expect(state.imageUrl).toBe('test-url.jpg');
      expect(state.imageAlt).toBe('Test Alt');
      done();
    });
  });

  it('should open lightbox with default alt text', (done) => {
    service.open('test-url.jpg');
    service.state$.subscribe(state => {
      expect(state.imageAlt).toBe('Lightbox image');
      done();
    });
  });

  it('should close lightbox', (done) => {
    service.open('test-url.jpg');
    service.close();
    service.state$.subscribe(state => {
      expect(state.isOpen).toBe(false);
      done();
    });
  });

  it('should return current state', () => {
    service.open('test-url.jpg', 'Test');
    const state = service.getState();
    expect(state.isOpen).toBe(true);
    expect(state.imageUrl).toBe('test-url.jpg');
  });
});
