import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { concat, delay, Observable, of, timer } from 'rxjs';

@Component({
  selector: 'app-money-counter',
  templateUrl: './money-counter.component.html',
  styleUrls: ['./money-counter.component.scss'],
})
export class MoneyCounterComponent implements OnChanges {
  @Input() money = 0;

  diffValue: Observable<number>;

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['money']) return;

    const moneyChange = changes['money'];
    if (moneyChange.isFirstChange()) return;

    //Show difference between money as popup
    this.diffValue = concat(
      of(moneyChange.currentValue - moneyChange.previousValue),
      of(0).pipe(delay(2000)) // Hide the value after 2s
    );
  }
}
