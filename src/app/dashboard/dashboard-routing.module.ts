import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { ChatComponent } from './chat/chat.component';
import { ProfileComponent } from './profile/profile.component';
import { WelcomeComponent } from './welcome/welcome.component';

const routes: Routes = [{
  path: '',
  component: DashboardComponent,
  children: [
    {
      path: '',
      component: WelcomeComponent,
      runGuardsAndResolvers: 'always',
    },

    {
      path: 'profile',
      component: ProfileComponent,
    },
    {
      path: 'chat/:ws',
      component: ChatComponent,
    },
    {
      path: 'chat',
      redirectTo: '/dashboard',
      pathMatch: 'full',
      runGuardsAndResolvers: 'always',
    },
    {
      path: '**',
      redirectTo: '/dashboard',
      pathMatch: 'full',
    },
  ],
}];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule { }
