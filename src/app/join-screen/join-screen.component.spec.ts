import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinScreenComponent } from './join-screen.component';

describe('JoinScreenComponent', () => {
  let component: JoinScreenComponent;
  let fixture: ComponentFixture<JoinScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JoinScreenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
