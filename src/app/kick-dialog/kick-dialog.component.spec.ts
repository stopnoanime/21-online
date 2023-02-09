import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KickDialogComponent } from './kick-dialog.component';

describe('KickDialogComponent', () => {
  let component: KickDialogComponent;
  let fixture: ComponentFixture<KickDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KickDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KickDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
