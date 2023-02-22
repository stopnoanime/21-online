import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GameService } from './game.service';
import { KickDialogComponent } from './kick-dialog/kick-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(public game: GameService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.game.kickEvent.subscribe(() => this.dialog.open(KickDialogComponent));
    this.game.roomErrorEvent.subscribe((s) => window.alert(s));
  }
}
