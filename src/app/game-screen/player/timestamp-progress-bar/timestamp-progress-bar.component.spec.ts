import { Component, DebugElement, SimpleChange } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { By } from '@angular/platform-browser';
import { TimestampProgressBar } from './timestamp-progress-bar.component';

describe('TimestampProgressBar', () => {
  let fixture: ComponentFixture<TimestampProgressBar>;
  let debugElement: DebugElement;
  let bar: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimestampProgressBar],
      imports: [MatProgressBarModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TimestampProgressBar);
    debugElement = fixture.debugElement;
    bar = debugElement.query(By.css('mat-progress-bar'));
  });

  it('should show 0% after initialization', () => {
    fixture.componentInstance.endTimestamp = 0;
    fixture.componentInstance.ngOnChanges();

    fixture.detectChanges();
    expect(bar.attributes['aria-valuenow']).toBe('0');
  });

  it('should show go from 100% to 0% after setting timestamp', fakeAsync(() => {
    fixture.componentInstance.endTimestamp = Date.now() + 1000;
    fixture.componentInstance.ngOnChanges();

    fixture.detectChanges();
    expect(bar.attributes['aria-valuenow']).toBe('100');

    tick(500);
    fixture.detectChanges();
    expect(bar.attributes['aria-valuenow']).toBe('50');

    tick(500);
    fixture.detectChanges();
    expect(bar.attributes['aria-valuenow']).toBe('0');
  }));
});
