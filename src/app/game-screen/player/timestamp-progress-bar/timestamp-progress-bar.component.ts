import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';

/**
 * Displays a progress bar that starts at 100%, and decreases to 0% at `time == endTimestamp`
 */
@Component({
  selector: 'app-timestamp-progress-bar',
  templateUrl: './timestamp-progress-bar.component.html',
  styleUrls: ['./timestamp-progress-bar.component.scss'],
})
export class TimestampProgressBar implements OnChanges, OnDestroy {
  @Input() endTimestamp: number;
  value: number = 0;

  private timerSubscription?: Subscription;

  ngOnChanges() {
    this.timerSubscription?.unsubscribe();
    this.setTimer(this.endTimestamp);
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  setTimer(endTimestamp: number) {
    const startTime = Date.now();
    const totalDuration = endTimestamp - startTime;

    if (totalDuration <= 0 || !endTimestamp) {
      this.value = 0;
      return;
    }

    this.value = 100;

    this.timerSubscription = interval(100).subscribe((s) => {
      this.value = 100 - ((Date.now() - startTime) / totalDuration) * 100;
      if (this.value <= 0) this.timerSubscription?.unsubscribe();
    });
  }
}
