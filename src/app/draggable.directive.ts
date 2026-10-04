import { Directive, ElementRef, HostListener, AfterViewInit } from "@angular/core";

@Directive({
    selector: "[appDraggable]",
    standalone: false
})
export class DraggableDirective implements AfterViewInit {
  private modalElement!: HTMLElement;
  private topStart: number = 0;
  private leftStart: number = 0;
  private isDraggable: boolean = false;
  private handleElement!: HTMLElement;

  constructor(public element: ElementRef) {}

  public ngAfterViewInit() {
    let element = this.element.nativeElement;
    this.handleElement = this.element.nativeElement;
    this.handleElement.style.cursor = "move";
    this.handleElement.style.touchAction = "none";
    this.modalElement = element.closest(".modal-content, .floating-window");
  }

  @HostListener("pointerdown", ["$event"])
  public onPointerDown(event: PointerEvent) {
    if (event.button !== 0 || !this.handleElement || !this.modalElement) {
        return;
    }

    if (event.target !== this.handleElement && !this.searchParentNode(<any>event.target, this.handleElement)) {
        return; // prevents dragging of other elements than children of handleElement
    }

    const target = event.target as Element | null;
    if (target?.closest('button, a, input, select, textarea')) return;

    //enable dragging
    this.isDraggable = true;

    //store original position
    const bounds = this.modalElement.getBoundingClientRect();
    this.topStart = event.clientY - bounds.top;
    this.leftStart = event.clientX - bounds.left;

    // Preserve the rendered position before replacing CSS anchors such as
    // `right: 8px`. Otherwise a right-anchored window jumps left as soon as
    // its header is pressed, even when the pointer never moves.
    this.modalElement.style.top = `${bounds.top}px`;
    this.modalElement.style.left = `${bounds.left}px`;
    this.modalElement.style.right = 'auto';
    this.modalElement.style.bottom = 'auto';
    this.handleElement.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  @HostListener("pointerup", ["$event"])
  @HostListener("pointercancel", ["$event"])
  public onPointerUp(event: PointerEvent) {
    this.isDraggable = false;
    if (this.handleElement?.hasPointerCapture(event.pointerId)) {
      this.handleElement.releasePointerCapture(event.pointerId);
    }
  }

  @HostListener("pointermove", ["$event"])
  public onPointerMove(event: PointerEvent) {
    if (this.isDraggable) {
      const bounds = this.modalElement.getBoundingClientRect();
      const minimumVisible = 72;
      const left = Math.min(
        window.innerWidth - minimumVisible,
        Math.max(minimumVisible - bounds.width, event.clientX - this.leftStart),
      );
      const top = Math.min(
        window.innerHeight - 44,
        Math.max(0, event.clientY - this.topStart),
      );
      this.modalElement.style.top = `${top}px`;
      this.modalElement.style.left = `${left}px`;
    }
  }

  private searchParentNode(element: Node, tag: Node): Node | null {
    while (element.parentNode) {
        element = element.parentNode;
        if (element === tag) {
            return element;
        }
    }
    return null;
}
}
