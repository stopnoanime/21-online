import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PlayingCardComponent } from './game-screen/playing-card/playing-card.component';
import { TimestampProgressSpinnerComponent } from './game-screen/player//timestamp-progress-spinner/timestamp-progress-spinner.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlayerActionsComponent } from './game-screen/player-action/player-action.component';
import { GameScreenComponent } from './game-screen/game-screen.component';
import { JoinScreenComponent } from './join-screen/join-screen.component';
import { PlayerComponent } from './game-screen/player/player.component';

@NgModule({
  declarations: [
    AppComponent,
    PlayingCardComponent,
    TimestampProgressSpinnerComponent,
    PlayerActionsComponent,
    GameScreenComponent,
    JoinScreenComponent,
    PlayerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
