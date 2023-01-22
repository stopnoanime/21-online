import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimestampProgressSpinnerComponent } from './timestamp-progress-spinner.component';

describe('TimestampProgressSpinnerComponent', () => {
  let component: TimestampProgressSpinnerComponent;
  let fixture: ComponentFixture<TimestampProgressSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TimestampProgressSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimestampProgressSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
