import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges } from '@angular/core';
import { EntityReferenceAction, entityFrameAction, rollCommand } from 'src/app/shared/entity-frame-interactions';
import { Message, MessageType } from 'src/app/shared/models/message';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
    selector: 'app-entity-modal',
    templateUrl: './entity-modal.component.html',
    styleUrls: ['./entity-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EntityModalComponent implements OnChanges {

  @Input()
  reference?: string;
  @Input()
  title = 'Entity';
  @Input()
  description?: string;
  @Input()
  autoSize = false;

  @Output()
  closeWindow = new EventEmitter<void>();
  @Output()
  showReference = new EventEmitter<EntityReferenceAction>();

  frameHeight = 280;
  frameLoading = true;

  get url(): string {
    return this.reference ? `${this.dataService.baseURL}${this.reference}` : '';
  }

  constructor(
    private dataService: DataService,
    private changeDetector: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reference'] || changes['description']) {
      this.frameHeight = 280;
      this.frameLoading = Boolean(this.reference && !this.description);
    }
  }

  frameLoaded(frame: HTMLIFrameElement): void {
    // Cross-origin frames can be displayed even when their document is inaccessible.
    this.frameLoading = false;
    try {
      const frameDocument = frame.contentDocument;
      if (!frameDocument) return;
      if (frameDocument.documentElement.dataset['webClientInteractions'] !== 'true') {
        frameDocument.documentElement.dataset['webClientInteractions'] = 'true';
        frameDocument.addEventListener('click', event => this.handleFrameClick(event), true);
      }

      if (this.autoSize) {
        frame.style.height = '1px';
        requestAnimationFrame(() => this.measureFrame(frame));
      } else {
        this.frameLoading = false;
      }
    } catch (error) {
      console.debug('Unable to attach entity frame interactions', error);
      this.frameLoading = false;
    }
  }

  private measureFrame(frame: HTMLIFrameElement): void {
    try {
      const frameDocument = frame.contentDocument;
      const contentHeight = Math.max(
        frameDocument?.body?.scrollHeight || 0,
        frameDocument?.documentElement?.scrollHeight || 0,
      );
      const maximum = Math.min(720, Math.max(240, window.innerHeight - 170));
      this.frameHeight = Math.max(120, Math.min(contentHeight || 280, maximum));
    } catch (error) {
      console.debug('Unable to size entity frame', error);
      this.frameHeight = Math.min(560, Math.max(240, window.innerHeight - 170));
    }

    frame.style.height = '100%';
    this.frameLoading = false;
    this.changeDetector.detectChanges();
  }

  private handleFrameClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target || typeof target.closest !== 'function') return;

    const anchor = target.closest('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    const action = entityFrameAction(anchor, this.dataService.baseURL);
    if (!action) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (action.kind === 'reference') {
      this.zone.run(() => this.showReference.emit(action));
      return;
    }

    const message: Message = {
      id: '',
      source: localStorage.getItem('userName') || 'Unknown',
      color: localStorage.getItem('userColor') || undefined,
      type: MessageType.command,
      content: rollCommand(action),
      created: new Date(),
    };
    this.dataService.send({ name: WSEventName.createMessage, data: message });
  }
}
