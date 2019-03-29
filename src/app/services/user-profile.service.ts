
import { Observable, BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { SolidProfile } from '../models/solid-profile.model';


const counter = 0;

@Injectable()
export class UserProfileService {


  private user$ = new BehaviorSubject({});
  private userProfile$ = new BehaviorSubject({});
  constructor() {
    // this.userArray = Object.values(this.users);
  }


  getUser(): Observable<any> {

   // console.log("IN userservice "+JSON.stringify(this.user$))
    return this.user$.asObservable();
  }

  setUser(user: any) {
    this.user$.next(user);
  }

  setUserProfile(userProfile: SolidProfile) {

    this.userProfile$.next(userProfile);
    const curProfile = this.userProfile$.getValue();
    const user = {name: curProfile['fn'], picture: curProfile['picture'] };
    console.log('User: ' + JSON.stringify(user));
     this.user$.next(user);
  }

  getUserProfile() {
    return this.userProfile$.asObservable();
  }



}
