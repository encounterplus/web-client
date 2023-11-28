import { Directive,ElementRef,HostListener,AfterViewInit } from "@angular/core";

@Directive({
  selector: "[appDraggable]",
})
export class DraggableDirective implements AfterViewInit {
  private modalElement: HTMLElement;
  private topStart: number;
  private leftStart: number;
  private isDraggable: boolean;
  private handleElement: HTMLElement;

  constructor(public element: ElementRef) {}

  public ngAfterViewInit() {
    let element = this.element.nativeElement;
    this.handleElement = this.element.nativeElement;
    this.handleElement.style.cursor = "move";
    this.modalElement = element.closest(".modal-content");
  }

  @HostListener("mousedown", ["$event"])
  public onMouseDown(event: MouseEvent) {
    if (event.button === 2 || !this.handleElement) {
        return; // prevents right click drag or initialized handleElement
    }

    if (event.target !== this.handleElement && !this.searchParentNode(<any>event.target, this.handleElement)) {
        return; // prevents dragging of other elements than children of handleElement
    }

    //enable dragging
    this.isDraggable = true;

    //store original position
    this.topStart = event.clientY - Number(this.modalElement.style.top.replace('px', ''));
    this.leftStart = event.clientX - Number(this.modalElement.style.left.replace('px', ''));
    event.preventDefault();
}

  @HostListener("mouseup", ["$event"])
  public onMouseUp(event: MouseEvent) {
    this.isDraggable = false;
  }

  @HostListener("mousemove", ["$event"])
  public onMouseMove(event: MouseEvent) {
    if (this.isDraggable) {
      this.modalElement.style.top = event.clientY - this.topStart + "px";
      this.modalElement.style.left = event.clientX - this.leftStart + "px";
    }
  }

  @HostListener("mouseleave", ["$event"])
  public onMouseLeave(event: MouseEvent) {
    this.isDraggable = false;
  }

  private searchParentNode(element: Node, tag: Node): Node {
    while (element.parentNode) {
        element = element.parentNode;
        if (element === tag) {
            return element;
        }
    }
    return null;
}
}
