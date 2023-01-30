import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerActionsComponent } from './player-action.component';

describe('PlayerActionComponent', () => {
  let component: PlayerActionsComponent;
  let fixture: ComponentFixture<PlayerActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlayerActionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
