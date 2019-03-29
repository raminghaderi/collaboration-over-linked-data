import { Component, Input, OnInit } from '@angular/core';

import { NbMenuService, NbSidebarService } from '@nebular/theme';
import { UserProfileService } from '../../../services/user-profile.service';
import { AnalyticsService } from '../../../@core/utils/analytics.service';
import { filter, map } from 'rxjs/operators';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/solid.auth.service';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {

  @Input() position = 'normal';

  user: any;

  userMenu = [{ title: 'Profile' }, { title: 'Log out' }];

  constructor(private router: Router,
              private activatedRoute: ActivatedRoute,
        	    private sidebarService: NbSidebarService,
              private menuService: NbMenuService,
              private userService: UserProfileService,
              private analyticsService: AnalyticsService,
              private authService: AuthService,
              ) {
  }

  ngOnInit() {
    this.userService.getUser()
      .subscribe((user: any) => this.user = user);

    this.subscribeToUserMenu();
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');

    return false;
  }

  toggleSettings(): boolean {
    this.sidebarService.toggle(false, 'settings-sidebar');

    return false;
  }

  goToHome() {
    this.menuService.navigateHome();
  }

  startSearch() {
    this.analyticsService.trackEvent('startSearch');
  }

  subscribeToUserMenu() {
    this.menuService.onItemClick()
    .pipe(
      filter(({ tag }) => tag === 'user-context-menu'),
      map(({ item: { title } }) => title),
    )
    .subscribe(
      title => {
        switch (title) {
          case 'Profile':
          this.router.navigate(['/dashboard/profile'], {relativeTo: this.activatedRoute});
          break;
          case 'Log out':
          this.logout();
          break;
        }


     console.log(`${title} was clicked!`);
      },
      );
  }


logout() {
  this.authService.solidSignOut();
}



}
