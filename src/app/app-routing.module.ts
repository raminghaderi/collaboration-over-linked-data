import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { AuthGuard } from './services/auth.guard.service';

const routes: Routes = [
  { path: 'dashboard',
  canActivate: [AuthGuard],
   loadChildren: 'app/dashboard/dashboard.module#DashboardModule' },
  {
    path: 'auth',
    loadChildren: './auth/auth.module#AuthModule',

  },
  { path: '',  canActivate: [AuthGuard], redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];

const config: ExtraOptions = {
  useHash: true,
  onSameUrlNavigation: 'reload'
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
