import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './solid.auth.service';

declare let solid: any;

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {

    const isLoggedIn = localStorage.getItem('solid-auth-client') ? true : false;

    if (!isLoggedIn) {
      this.router.navigateByUrl('auth/login');
    }

    return  this.getSession(); /* this.auth.session.pipe(
      take(1),
      map(session => !!session),
      tap(loggedIn => {
        if (!loggedIn) {
          return this.router.navigate(['/']);
        }
      })
    );*/
  }

  async getSession(): Promise<boolean> {
    const session = await solid.auth.currentSession();
    if (!session)
      return false;
    else
      return true;
  }
}
