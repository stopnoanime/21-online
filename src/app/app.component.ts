import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NotifierService } from 'angular-notifier';
import { GameService } from './game.service';
import { KickDialogComponent } from './kick-dialog/kick-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    public game: GameService,
    private dialog: MatDialog,
    private notifierService: NotifierService
  ) {}

  ngOnInit(): void {
    this.game.kickEvent.subscribe(() => this.dialog.open(KickDialogComponent));
    this.game.roomErrorEvent.subscribe((s) =>
      this.notifierService.notify('error', s)
    );
  }
}
