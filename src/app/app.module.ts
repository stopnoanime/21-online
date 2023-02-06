import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PlayingCardComponent } from './game-screen/player/playing-card/playing-card.component';
import { TimestampProgressSpinnerBar } from './game-screen/player/timestamp-progress-bar/timestamp-progress-bar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlayerActionsComponent } from './game-screen/player-action/player-action.component';
import { GameScreenComponent } from './game-screen/game-screen.component';
import { JoinScreenComponent } from './join-screen/join-screen.component';
import { PlayerComponent } from './game-screen/player/player.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MoneyCounterComponent } from './game-screen/player/money-counter/money-counter.component';

@NgModule({
  declarations: [
    AppComponent,
    PlayingCardComponent,
    TimestampProgressSpinnerBar,
    PlayerActionsComponent,
    GameScreenComponent,
    JoinScreenComponent,
    PlayerComponent,
    MoneyCounterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
