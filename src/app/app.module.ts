import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CardComponent } from './card/card.component';
import { TimestampProgressSpinnerComponent } from './timestamp-progress-spinner/timestamp-progress-spinner.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlayerActionComponent } from './player-action/player-action.component';

@NgModule({
  declarations: [
    AppComponent,
    CardComponent,
    TimestampProgressSpinnerComponent,
    PlayerActionComponent,
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
