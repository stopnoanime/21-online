import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerActionComponent } from './player-action.component';

describe('PlayerActionComponent', () => {
  let component: PlayerActionComponent;
  let fixture: ComponentFixture<PlayerActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlayerActionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
