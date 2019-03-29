
import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../services/solid.auth.service';
import { RdfService } from '../../services/rdf.service';
import * as SolidFileClient from 'solid-file-client';
import { PodHandlerService } from '../../services/pod-handler.service';
import { SolidSession } from '../../models/solid-session.model';
import { Router }  from '@angular/router';
import { NbToastrService, NbGlobalPhysicalPosition } from '@nebular/theme';
import { NbToastStatus } from '@nebular/theme/components/toastr/model';

import CONTAINERS from '../../containers.json';
import * as utils from '../../utils/utililties';
import { SharedService } from '../../services/shared-service.service';

//const filedc = require('solid-file-client');

declare let solid: any;
declare let $rdf: any;

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})

export class WelcomeComponent implements OnInit {

  fileClient = SolidFileClient;
  folderName: string;
  webId: string;
  session: SolidSession;
  profileId: any;
  existingWorkspaces: any[];
  appRootDir: string = CONTAINERS.rootContainer;
  store:any
  ns:any

  @Input('workspace')  workspace: string;
  @Output('onExistingWorkspaceChange') onExistingWorkspaceChange  = new EventEmitter<any[]>();



  constructor(private router: Router,
              private toastr: NbToastrService,
              private sharedService:SharedService,
              private auth: AuthService,
              private rdf: RdfService,
              private podhandler: PodHandlerService) { 
                this.store = this.podhandler.store
                this.ns = this.podhandler.ns
              }

  ngOnInit() {
    this.getWebId();

    // Find a better way to call this function
    setTimeout(() => {
      this.getExistingWorkspaces();
    }, 500);

  }

  getWebId = async ()=> {

    const session = await solid.auth.currentSession();
    this.webId = session.webId.split('profile')[0];
    this.workspace = this.webId + 'public';

  };

  logout() {
    this.auth.solidSignOut();
  }


  initWorkspace=async ()=> {
      const dest = this.workspace + '/' + this.appRootDir + '/' + this.folderName;
      console.log(dest);
      // check if folder exists
    const resp = await  this.podhandler.initializeContainers(dest);
    if(resp)
    {
    
     this.getExistingWorkspaces();
     this.folderName = ''
    }
  }

  // TODO: redirect to dashboard and
  getExistingWorkspaces = async() => {
    this.podhandler.getListWorkSpaces(this.workspace)
   .then( value => {
     if (typeof value === 'object') {
       this.existingWorkspaces = value.folders;
      // this.onExistingWorkspaceChange.emit();
      this.sharedService.emitWorskspaceUpdate(this.existingWorkspaces)
     }

    // do something with the workspaces
      console.log('Workspaces: ' + JSON.stringify(value));
   });
  }

  goToWkSpace = (wkspace) => {

    //TODO: pass workspace object to route
    this.router.navigate(['/dashboard']);
  }

  joinWorkSpace = async (url: string) => {
     // Click on join
    // Add to participantlist
    // Extract workspace name from
    // set original url
    url = utils.removeTrailingSlash(url);
   const response = await this.podhandler.initializeContainers(url, false);;
   if(response)
   {
    this.getExistingWorkspaces();
   }
  }

  
  deleteWKspace(url){    
    let folder = this.store.sym(url+"/").doc()
    this.deleteRecursive(folder)
  }

 deleteRecursive= (folder) =>{
  return new Promise( (resolve, reject)=> {
    this.store.fetcher.load(folder).then( ()=> {
      let promises = this.store.each(folder, this.ns.ldp('contains')).map(file => {
        if (this.store.holds(file, this.ns.rdf('type'), this.ns.ldp('BasicContainer'))) {
          return this.deleteRecursive(file)
        } else {
          console.log('deleteRecursive file: ' + file)
          if (!confirm(' Really DELETE File ' + file)) {
            throw new Error('User aborted delete file')
          }
          return this.store.fetcher.webOperation('DELETE', file.uri)
        }
      })
      console.log('deleteRecursive folder: ' + folder)
      if (!confirm(' Really DELETE folder ' + folder)) {
        throw new Error('User aborted delete file')
      }
      promises.push(this.store.fetcher.webOperation('DELETE', folder.uri))
      Promise.all(promises).then(res => {
        this.toastr.show(`${folder.uri} deleted successfully`,
        'Success', {position:NbGlobalPhysicalPosition.TOP_RIGHT,status:NbToastStatus.SUCCESS});
        resolve()
         })
    })
  })
}


}
