import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Message, MessageType } from 'src/app/shared/models/message';
import { DiceRollType } from 'src/app/shared/models/dice-roll';
import { minimalMessage } from 'src/app/shared/models/testing/fixtures';

import { MessageComponent } from './message.component';

describe('MessageComponent', () => {
  let component: MessageComponent;
  let fixture: ComponentFixture<MessageComponent>;

  /**
   * Renders a fresh fixture. Swapping the input on a fixture that has already been checked trips
   * NG0100, so a test that asserts on the DOM starts from a new one.
   */
  function render(message: Message): void {
    fixture = TestBed.createComponent(MessageComponent);
    component = fixture.componentInstance;
    component.message = message;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageComponent);
    component = fixture.componentInstance;

    const message: Message = {
      id: "1",
      type: MessageType.chat,
      source: "Dungeon Master",
      content: "Hello",
      created: new Date(),
    };
    component.message = message;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should recognize a chat message', () => {
    expect(component.isChat).toBe(true);
    expect(component.isDiceRoll).toBe(false);
  });

  describe('with a message that carries only its required fields', () => {

    beforeEach(() => {
      render(minimalMessage());
    });

    it('falls back to the neutral Host label and renders no body', () => {
      const source = fixture.nativeElement.querySelector('.message-source').textContent;
      expect(source).toContain("Host");
      expect(fixture.nativeElement.querySelector('.message-chat').textContent).toBe("");
    });

    it('does not read it as a roll', () => {
      expect(component.isChat).toBe(true);
      expect(component.isDiceRoll).toBe(false);
    });
  });

  describe('a roll message', () => {

    it('is not read as a roll when the server sent no content', () => {
      render(minimalMessage({ type: MessageType.roll }));
      expect(component.isDiceRoll).toBe(false);
      expect(fixture.nativeElement.querySelector('.message-roll')).toBeNull();
    });

    it('renders a roll that carries only a formula', () => {
      render(minimalMessage({ type: MessageType.roll, content: { formula: "1d20" } }));
      expect(component.isDiceRoll).toBe(true);
      expect(fixture.nativeElement.querySelector('.roll-formula').textContent).toBe("1d20");
      // the template falls back for both, so an untyped roll still reads
      expect(fixture.nativeElement.querySelector('.roll-name').textContent).toContain("Custom");
      expect(fixture.nativeElement.querySelector('.roll-name').textContent).toContain("roll");
    });

    it('colours the roll by its type, and yellow when it has none', () => {
      component.message = minimalMessage({ type: MessageType.roll, content: { formula: "1d20" } });
      expect(component.rollColor).toBe("yellow");
      component.message = minimalMessage({ type: MessageType.roll, content: { formula: "1d20", type: DiceRollType.damage } });
      expect(component.rollColor).toBe("red");
    });
  });

  it('renders a message whose creation time arrived as a string', () => {
    expect(() => render(minimalMessage({ created: "2026-01-01T12:00:00Z" }))).not.toThrow();
    expect(fixture.nativeElement.querySelector('time').textContent.length).toBeGreaterThan(0);
  });
});
