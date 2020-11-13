import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JanusComponent } from './janus.component';

describe('JanusComponent', () => {
  let component: JanusComponent;
  let fixture: ComponentFixture<JanusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JanusComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JanusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
