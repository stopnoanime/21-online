import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Limits number input value to `max`
 */
@Directive({
  selector: '[appInputConstrain]',
})
export class InputConstrainDirective {
  private lastValue: string;

  constructor(private el: ElementRef) {
    this.lastValue = this.el.nativeElement.value;
  }

  @HostListener('input') onInput() {
    const validity: ValidityState = this.el.nativeElement.validity;

    if (validity.rangeOverflow)
      this.el.nativeElement.value = this.el.nativeElement.max;
    else if (!validity.valid) this.el.nativeElement.value = this.lastValue;

    this.lastValue = this.el.nativeElement.value;
  }
}
