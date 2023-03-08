import { Component, DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MoneyCounterComponent } from './money-counter.component';

describe('MoneyCounterComponent', () => {
  let fixture: ComponentFixture<MoneyCounterComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MoneyCounterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MoneyCounterComponent);
    debugElement = fixture.debugElement;
  });

  it('should show money amount', () => {
    fixture.componentInstance.money = 666;
    fixture.detectChanges();

    expect(debugElement.nativeElement.textContent).toBe('666 $');
  });

  it('should show popup on money change', () => {
    //Positive change
    fixture.componentInstance.ngOnChanges({
      money: new SimpleChange(666, 1000, false),
    });
    fixture.detectChanges();

    const popup = debugElement.query(By.css('[data-test="money-popup"]'));
    expect(popup.nativeElement.textContent.trim()).toBe('+334 $');

    //Negative change
    fixture.componentInstance.ngOnChanges({
      money: new SimpleChange(1000, 777, false),
    });
    fixture.detectChanges();

    expect(popup.nativeElement.textContent.trim()).toBe('-223 $');
  });
});
