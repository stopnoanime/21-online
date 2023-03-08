import { Component, DebugElement, SimpleChange } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import gameConfig from 'backend/src/game.config';
import { JoinScreenComponent } from './join-screen.component';

describe('JoinScreenComponent', () => {
  let fixture: ComponentFixture<JoinScreenComponent>;
  let debugElement: DebugElement;
  let input: DebugElement;
  let formField: DebugElement;
  let button: DebugElement;

  const writeToInput = (t: string) => {
    input.nativeElement.value = t;
    input.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JoinScreenComponent],
      imports: [
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatTooltipModule,
        NoopAnimationsModule,
        MatButtonModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinScreenComponent);
    debugElement = fixture.debugElement;
    fixture.detectChanges();

    input = debugElement.query(By.css('input'));
    formField = debugElement.query(By.css('mat-form-field'));
    button = debugElement.query(By.css('[data-cy="join-btn"]'));
  });

  it('Validates roomId input', () => {
    //Too little characters
    writeToInput('a'.repeat(gameConfig.roomIdLength - 1));
    expect(formField.classes['ng-invalid']).toBe(true);

    //Too many characters
    writeToInput('a'.repeat(gameConfig.roomIdLength + 1));
    expect(formField.classes['ng-invalid']).toBe(true);

    //Correct number of characters
    writeToInput('a'.repeat(gameConfig.roomIdLength));
    expect(formField.classes['ng-valid']).toBe(true);
  });

  it('Updates join button style based on roomId input', () => {
    //Bad Input
    writeToInput('a'.repeat(gameConfig.roomIdLength - 1));
    expect(button.nativeElement.disabled).toBe(true);

    //Good input
    writeToInput('a'.repeat(gameConfig.roomIdLength));
    expect(button.nativeElement.disabled).toBe(false);
  });
});
