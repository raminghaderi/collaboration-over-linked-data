import { Component, ChangeDetectorRef, OnInit, Inject } from '@angular/core';
import {  Location, DOCUMENT } from '@angular/common';
import { NbLoginComponent, NbAuthService } from '@nebular/auth';

// Auth Service
import { AuthService } from '../../services/solid.auth.service';
import { SolidProvider } from '../../models/solid-provider.model';
import { Router, ActivatedRoute } from '@angular/router';


@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends NbLoginComponent implements OnInit {
 /**
   * A list of Solid Identity Providers
   * @type {SolidProvider[]}
   */
  identityProviders: SolidProvider[];
  selectedProviderUrl: string;
  customProviderUrl: string;

  errors: string[] = [];
  messages: string[] = [];
  showMessages: any = {};
  origin: any;


  constructor(@Inject(DOCUMENT) private document, private activatedRoute:ActivatedRoute, private solidAuth: AuthService, nbAuth: NbAuthService,  router: Router, cd: ChangeDetectorRef) {
    super( nbAuth, {}, cd, router);

  }

  ngOnInit() {
    
  //  console.log(this.origin);
   this.identityProviders = this.solidAuth.getIdentityProviders();
    console.log('Id providers: ' + JSON.stringify(this.identityProviders));
  
      console.log("ORIGIN "+JSON.stringify(this.document.location.origin))
  
  }

  goToRegistration() {
    this.router.navigateByUrl('/register');
  }


  onLogin = async () => {
    const idp: string = this.selectedProviderUrl ? this.selectedProviderUrl : this.customProviderUrl;

    if (idp) {
      try {

        this.solidAuth.solidLogin(idp, `${this.document.location.origin}/`);
      } catch (err) {
        console.log('An error has occurred logging in: ' + err);
      }
    }
  }


  /*
  *  Alternate login-popup function for Solid. See service for more details.
  */
 onLoginPopup = async () => {
  this.solidAuth.solidLoginPopup();
}
}
