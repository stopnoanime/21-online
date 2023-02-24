import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameScreenComponent } from './game-screen/game-screen.component';
import { GameGuardService } from './game-screen/game-guard.service';
import { JoinScreenComponent } from './join-screen/join-screen.component';
import { JoinGuardService } from './join-screen/join-guard.service';

const routes: Routes = [
  {
    path: 'room/:id',
    component: GameScreenComponent,
    canActivate: [GameGuardService],
  },
  {
    path: '',
    component: JoinScreenComponent,
    pathMatch: 'full',
    canActivate: [JoinGuardService],
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
