import { Component, OnInit, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { UserProfileService } from '../../services/user-profile.service';
import { PodHandlerService } from '../../services/pod-handler.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {

  profile:any ={} // {fn:string,company:string,role:string,picture:string,email:string,friends:[]};

  @ViewChild('f') cardForm: NgForm;


  constructor(private podhandler: PodHandlerService,
    private userService: UserProfileService,
    private cdr: ChangeDetectorRef) {
 this.userService.getUserProfile()
    .subscribe((userProf) => { 
      this.profile = userProf
     
    
console.log("PROFILE "+JSON.stringify(this.profile))

    });
     }

  ngOnInit() {
   
     // Clear cached profile data
    // TODO: Remove this code and find a better way to get the old data
    localStorage.removeItem('oldProfileData');
  }

  // Submits the form, and saves the profile data using the auth/rdf service
  async onSubmit () {
    if (!this.cardForm.invalid) {
      try {
        await this.podhandler.rdf.updateProfile(this.cardForm);
        localStorage.setItem('oldProfileData', JSON.stringify(this.profile));
      } catch (err) {
        console.log(`Error: ${err}`);
      }
    }
  }



}
