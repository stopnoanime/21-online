import { Component, DebugElement, SimpleChange } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Card } from 'backend/src/rooms/schema/GameState';
import { PlayingCardComponent } from './playing-card.component';

describe('PlayingCardComponent', () => {
  let fixture: ComponentFixture<PlayingCardComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlayingCardComponent],
      imports: [NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayingCardComponent);
    debugElement = fixture.debugElement;
  });

  it('should show visible card', fakeAsync(() => {
    const card = new Card();
    fixture.componentInstance.card = card;
    fixture.detectChanges();
    //Have to tick to trigger animation
    tick();

    //Card should be visible
    expect(debugElement.query(By.css('.card')).styles['transform']).toBe(
      'rotateY(180deg)'
    );

    //And suit/value should be rendered
    expect(
      debugElement.query(By.css('.card-suit')).nativeElement.textContent.trim()
    ).toBe(card.value?.suit);
    expect(
      debugElement.query(By.css('.card-value')).nativeElement.textContent.trim()
    ).toBe(card.value?.value);
  }));

  it('should hide invisible card', fakeAsync(() => {
    const card = new Card(false);
    fixture.componentInstance.card = card;
    fixture.detectChanges();
    tick();

    expect(debugElement.query(By.css('.card')).styles['transform']).toBe(
      'rotateY(0deg)'
    );
  }));
});
