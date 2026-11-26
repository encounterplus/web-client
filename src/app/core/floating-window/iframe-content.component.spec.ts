import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SafePipe } from 'safe-pipe';
import { FloatingWindowRef } from './floating-window-ref';
import { IframeContentComponent } from './iframe-content.component';

describe('IframeContentComponent', () => {
  let fixture: ComponentFixture<IframeContentComponent>;
  let component: IframeContentComponent;
  let ref: FloatingWindowRef;
  /** What the frame's address reads as: an empty page, which is skipped, unless a test loads a page. */
  let address: string | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IframeContentComponent],
      imports: [SafePipe],
      providers: [FloatingWindowRef],
    }).compileComponents();

    address = 'about:blank';
    ref = TestBed.inject(FloatingWindowRef);
    fixture = TestBed.createComponent(IframeContentComponent);
    component = fixture.componentInstance;
    // the frame's own loads read as an empty page, so only the ones a test makes count
    spyOn(component as any, 'frameAddress').and.callFake(() => address);
    fixture.componentRef.setInput('url', 'about:blank#sheet');
    fixture.detectChanges();
  });

  /** A page the frame loaded: on another origin, where its address can't be read. */
  function load() {
    address = null;
    component.onLoad();
    address = 'about:blank';
  }

  it('offers nothing for the page it opened with', () => {
    load();
    expect(ref.back()).toBeNull();
  });

  it('offers to go back once the page went elsewhere', () => {
    load();
    load();
    expect(ref.back()).toEqual(jasmine.any(Function));
  });

  it('skips the empty page a frame loads before its address', () => {
    component.onLoad();
    load();
    expect(ref.back()).toBeNull();
  });

  it('goes back to the address it opened with, and offers nothing once there', () => {
    load();
    load();
    const frame: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    frame.src = 'about:blank#elsewhere';

    ref.back()!();
    expect(frame.src).toBe('about:blank#sheet');
    expect(ref.back()).toBeNull();

    load();
    expect(ref.back()).toBeNull();
  });

  it('works without a window around it', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ declarations: [IframeContentComponent], imports: [SafePipe] });
    const bare = TestBed.createComponent(IframeContentComponent);
    bare.componentRef.setInput('url', 'about:blank');
    bare.detectChanges();
    expect(() => { bare.componentInstance.onLoad(); bare.componentInstance.onLoad(); }).not.toThrow();
  });
});
