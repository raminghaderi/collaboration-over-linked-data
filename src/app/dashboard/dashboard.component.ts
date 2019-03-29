import { Component, OnInit, Injectable, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { NbMenuItem } from '@nebular/theme';



// Services
import { AuthService } from '../services/solid.auth.service';
import { SolidProfile } from '../models/solid-profile.model';
import { PodHandlerService } from '../services/pod-handler.service';
import { UserProfileService } from '../services/user-profile.service';



import { SolidSession } from '../models/solid-session.model';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { SharedService } from '../services/shared-service.service';

declare let solid: any;
declare let $rdf: any;
/**
 * NbMenuItem eg:
 * menu: NbMenuItem[] = [
  {
    title: 'Dashboard',
    icon: 'nb-home',
    link: '/pages/dashboard',
    home: true,
  },
  {
    title: 'FEATURES',
    group: true,
  }, ]
 */

@Injectable()
@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})


export class DashboardComponent implements OnInit, OnDestroy {
  profile: SolidProfile;

  profileImage: string;
  session: SolidSession;
  profileId: string;
  webId: string;
  //friends = ['Ramin', 'Samuel', 'Zahra'];
  existingWorkspaces: {}[] = [];
  friends = [];

  selectedItem: any;
  fetcher: any;

  owner: string;

  navigationSubscription

  menu:  NbMenuItem[] = [
   
  ];

  constructor(private router: Router,
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private podhandler: PodHandlerService,
    private userService: UserProfileService) {
    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      // If it is a NavigationEnd event re-initalise the component
      if (e instanceof NavigationEnd) {
        this.initialiseDashboard();
      }
    });

    this.sharedService.workspaceChangeEmitted$.subscribe(workspaces =>{
      this.getAvailableWorkspaces()
      
    })

     }

  ngOnInit() {
  
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {  
      this.navigationSubscription.unsubscribe();
   }
  }

  initialiseDashboard(){
      this.fetcher =   this.fetcher = this.podhandler.rdf.fetcher;
    this.loadProfile(this.getAvailableWorkspaces);
  }


  async loadProfile(callBackFn= undefined) {
    try {
    //  this.loadingProfile = true;
      this.session =  await solid.auth.currentSession();
      this.profileId = this.session.webId;
      this.webId = this.profileId.split('/profile')[0];

      const profile = await this.podhandler.rdf.getProfile(this.profileId);

      if (profile) {
      this.profile = profile;
        this.auth.saveOldUserData(profile);

        // LoadFriends
        for (let f = 0; f < profile.friends.length; f++) {
         const friendProfile = await this.podhandler.rdf.getProfile(profile.friends[f]);
          this.friends.push(friendProfile);
        }

        this.setupProfilePic();
      this.userService.setUserProfile(this.profile);
      }

    if (callBackFn != undefined)  callBackFn();
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }

    private setupProfilePic() {
    this.profile.picture =  this.profile.picture ? this.profile.picture : '/assets/images/profile.png';
    }

    getAvailableWorkspaces = async() => {
     const storageSpace = this.webId + '/public';
     const folder = await this.podhandler.getListWorkSpaces(storageSpace)
     
          this.existingWorkspaces  = folder.folders;
  

   this.generateMenu();
  // do something with the workspaces
   // console.log('Workspaces: ' + JSON.stringify(folder.folders));
  this.cdr.markForCheck()

}

generateMenu() {
 
  if(this.menu.length === 0)  this.menu.push( {title: 'Dashboard',icon: 'nb-home',link: '/',home: true})
  if(this.menu.length === 1) this.menu.push({title: 'Chat Spaces',group: true})
  if(this.menu.length === 2) this.menu.push({
    title: 'Spaces',
  icon: 'nb-chat',
  expanded: true,
  children:[],
  })

  



  this.existingWorkspaces.forEach((workspace: any) => {
    const item = {
      title: '',
    link: '',
    payload: {},

    };

    item.title = workspace.name;
    item.link = '/dashboard/chat/' + workspace.name
   item.payload  = workspace
  
 
  if (!this.menuItemExists(item)) {
  //  console.log("Item "+JSON.stringify(item))
    this.menu[2].children.push(item);
    this.menu[2].children.sort(this.sortFunction)
  }

  });

  

  /*
   if (itemGroup.children.length > 0){
   const newG = itemGroup
     this.menu = [...this.menu, newG];
    // itemGroup.children = []
   }  */
      
}

sortFunction(a,b){
  return a.title.localeCompare(b.title); 
}

menuItemExists(item:any):boolean{
 
     const alreadyExist = this.menu[2].children.find((wkspace) => wkspace.link === item.link );

  return alreadyExist != undefined
 
}


}
