import { Component, Input, OnChanges } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-timestamp-progress-spinner',
  templateUrl: './timestamp-progress-spinner.component.html',
  styleUrls: ['./timestamp-progress-spinner.component.scss'],
})
export class TimestampProgressSpinnerComponent implements OnChanges {
  @Input() endTimestamp: number;
  value: number = 0;

  private timerSubscription?: Subscription;

  ngOnChanges() {
    this.timerSubscription?.unsubscribe();

    if (!this.endTimestamp) return;
    this.setTimer(this.endTimestamp);
  }

  setTimer(endTimestamp: number) {
    const startTime = Date.now();
    const totalDuration = endTimestamp - startTime;

    if (totalDuration <= 0) {
      this.value = 0;
      return;
    }

    this.value = 100;
    const timer$ = interval(100);

    this.timerSubscription = timer$.subscribe((s) => {
      this.value = 100 - ((Date.now() - startTime) / totalDuration) * 100;
      if (this.value <= 0) this.timerSubscription?.unsubscribe();
    });
  }
}
