import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Message, MessageType } from 'src/app/shared/models/message';

import { MessageComponent } from './message.component';

describe('MessageComponent', () => {
  let component: MessageComponent;
  let fixture: ComponentFixture<MessageComponent>;

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
});
