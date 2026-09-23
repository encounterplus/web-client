import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Message, MessageType, emptyMessage } from 'src/app/shared/models/message';

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

    const message = emptyMessage();
    message.id = "1";
    message.type = MessageType.chat;
    message.source = "Dungeon Master";
    message.content = "Hello";
    message.created = new Date();
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
