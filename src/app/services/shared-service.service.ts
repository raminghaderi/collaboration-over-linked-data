import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class SharedService {
    private emitChangeWorkspaces = new Subject<any>();

    workspaceChangeEmitted$ = this.emitChangeWorkspaces.asObservable()

    emitWorskspaceUpdate(change:any ){
        this.emitChangeWorkspaces.next(change)
    }

}