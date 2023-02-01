import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimestampProgressSpinnerBar } from './timestamp-progress-bar.component';

describe('TimestampProgressSpinnerComponent', () => {
  let component: TimestampProgressSpinnerBar;
  let fixture: ComponentFixture<TimestampProgressSpinnerBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimestampProgressSpinnerBar],
    }).compileComponents();

    fixture = TestBed.createComponent(TimestampProgressSpinnerBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
