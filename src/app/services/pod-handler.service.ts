/* tslint:disable:no-console */
import { Injectable } from '@angular/core';
import { RdfService } from '../services/rdf.service';
import * as SolidFileClient from 'solid-file-client';
import * as utils from '../utils/utililties';
import { SolidSession } from '../models/solid-session.model';
import CONTAINERS from '../containers.json';

import solidnamespace from 'solid-namespace';
import { Workspace } from '../models/workspace.model';
import { NbToastrService, NbGlobalPhysicalPosition } from '@nebular/theme';
import { NbToastStatus } from '@nebular/theme/components/toastr/model';

declare let solid: any;
declare let $rdf: any;

@Injectable({
  providedIn: 'root',
})
export class PodHandlerService {
  ns = solidnamespace($rdf);
  store = this.rdf.store;
  session: SolidSession;
  fetcher: any;
  updater: any;
  fileClient = SolidFileClient;
  me: any;
  webid: any;
  activeWorkspace: any;
  existingWorkspaces: any[];
  storageLocation: string;

  readonly publicStorage = 'public';

  constructor( public rdf: RdfService,
    private toastr: NbToastrService) {
    this.fetcher = this.rdf.fetcher;
    this.updater = this.rdf.updateManager;
   // this.session = this.rdf.session;
    setTimeout(() => {
      this.getSession();
    }, 500);
  }

  getSession = async () => {

    console.log(JSON.stringify(solid));
      this.session = await solid.auth.currentSession();

      this.me = this.session.webId;
      this.webid = this.session.webId.split('profile')[0];

      this.getStorageLocation(this.session.webId).then(val => {
        this.storageLocation = val;
      });
  }

  resourceExists(url: string, iscontainer: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      // check if it's a container or file

      this.fileClient
        .fetch(url)
        .then(response => {
          if (response) {
            resolve({ resource: url, content: response });
          } else {
            reject({ resource: url, error: this.fileClient.err });
          }
        })
        .catch(error => {
          reject({ resource: url, error: error });
        });
    });
  }

  createContainer(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.resourceExists(url, true)
        .then(response => {
          console.log('Resource already exists: ' + url);
          resolve(url);
        })
        .catch(err => {
          // folder doesn't exist
          this.fileClient.createFolder(url).then(success => {
            if (success) {
              console.log(`Created folder ${url}.`);
              resolve(url);
            } else {
              console.log(this.fileClient.err);
              reject(this.fileClient.err);
            }
          });
        });
    });
  }

  defaultAppContainerUrl(): string {
    return (
      this.storageLocation + this.publicStorage + '/' + CONTAINERS.rootContainer
    );
  }

  /**
   * Create workspace
   * initialise turtle files
   * Subscribe to websocket
   */
  // TODO: should return Success or failure
  initializeContainers = async (destination: string, isOwner = true):Promise<boolean>  => {
    // const isNew = true;

    const foldername = this.getWkSpaceName(destination);
    let canAccess = true; // user has permissions to access resource
    // !isOwner check first if this user can access the provided
    if (!isOwner) {
      canAccess = await this.loadResource(destination);
    }

    if (canAccess) {
      const parentDir = this.storageLocation + this.publicStorage;

      try {
          // create root container for app data
          const workSpace = await this.createContainer(parentDir + '/' + CONTAINERS.rootContainer);
          const rootDir = await this.createContainer(workSpace + '/' + foldername);
          //containers definition is loaded. Now time to ensure containers exists
          if (isOwner) {
            await this.createDefaultPermission(rootDir);
          }
          await this.createNewChat(rootDir, isOwner, destination);
          await this.createFile(rootDir + '/chats.ttl');
          this.toastr.show('Chat space initiated successfully',
           'Success', {position:NbGlobalPhysicalPosition.TOP_RIGHT,status:NbToastStatus.SUCCESS});
           return true
      } catch (err) {
          console.log(err);
          //TODO: check here if the error code is 404
          this.toastr.show(`'An error has occurred. Message:  ${err}`,
           'Error', {position:NbGlobalPhysicalPosition.TOP_RIGHT,status:NbToastStatus.DANGER});
         return false
      }

      /*
        //containers definition is loaded. Now time to ensure containers exists
        for (var key in CONTAINERS.subContainers) {
          (async k => {
            let value = CONTAINERS.subContainers[k];
            let resType = typeof value === "object" ? "resource" : "container";

            let resPath = "";
            let resData = "";

            if (resType === "container") resPath = value;
            else {
              resPath = value.path;
              resData = value.data;
            }

            this.createContainer(rootDir+"/"+resPath)
              .then(url2 => {})
              .catch(err2 => {
                console.log(err2);
              });
          })(key);
        }  */
    }

  };

  getStorageLocation = (webid: any) => {
    return new Promise<string>((resolve, reject) => {
      const profileDoc = utils.getProfileDocumentLocation(webid);

      this.fetcher.nowOrWhenFetched(profileDoc, undefined, (ok, body, xhr) => {
        if (!ok) {
          console.log('Oops, something happened and couldn\'t fetch data');
          reject(xhr.status);
        } else {
          const me = $rdf.sym(webid);

          const storage = $rdf.sym('http://www.w3.org/ns/pim/space#storage');
          const strg = this.rdf.store.any(me, storage);
          //  console.log(strg);
          resolve(strg.uri);
        }
      });
    });
  };

  createFile(file: string): boolean {

   return this.fileClient.createFile(file).then(
      success => {
        console.log(`created ${file}.`);
        return true;
      },
      err => {
         console.log(err);
         return false;
      },
    );
  }

  createNewChat(newDir: string, isOwner, original?: string) {


    return new Promise(async (resolve, reject) => {
// index.ttl holds chat preferences
    // Original should only have value if isOwner is false
    let newInstance;
    let newChatDoc;

    const originFile = original + '/index.ttl';

        const originSym = this.store.sym(originFile + '#this');
        const originDoc = originSym.doc();

    if (isOwner) {
      newInstance = this.store.sym(newDir + '/index.ttl#this');
      newChatDoc = newInstance.doc();

      this.store.add(
        newInstance,
        this.ns.rdf('type'),
        this.ns.meeting('LongChat'),
        newChatDoc,
      );
      this.store.add(newInstance, this.ns.dc('title'), 'Chat', newChatDoc);
      this.store.add(
        newInstance,
        this.ns.dc('created'),
        new Date(),
        newChatDoc,
      );

      this.store.add(newInstance, this.ns.dc('author'), this.store.sym(this.me), newChatDoc);
    } else {



     await   this.loadResource(originDoc)
       .then((response) => {

       const owner = this.store.any(originSym,
        this.store.sym(this.ns.dc('author')));
        console.log('Author: ' + owner);

        newInstance = this.store.sym(newDir + '/index.ttl#this');



      newChatDoc = newInstance.doc();
      this.store.add(
        newInstance,
        this.ns.rdf('type'),
        this.ns.meeting('LongChat'),
        newChatDoc,
      );
      this.store.add(
        newInstance,
        this.ns.owl('sameAs'),
        originSym,
        newChatDoc,
      );

      this.store.add(newInstance, this.ns.dc('author'), this.store.sym(owner), newChatDoc);



       },
      ).catch(err => {
         reject(   new Error(
          'FAILED to load the chat file at: ' + err ));
       }  );
   }

   if (!isOwner && original != undefined) {
    const participation = this.newThing(originDoc);

   // console.log("Original "+originSym)

      this.store.add(originSym, this.ns.wf('participation'), participation, originDoc);

      this.store.add(participation, this.ns.wf('participant'), this.store.sym(this.me), originDoc);
      this.store.add(participation, this.ns.cal('dtstart'), new Date(), originDoc);
     // new $rdf.Statement(participation, this.ns.ui('backgroundColor'), UI.pad.lightColorHash(me), padDoc)

    await    this.updater.put(
      originDoc,
      this.store.statementsMatching(
        undefined,
        undefined,
        undefined,
        originDoc,
      ),
      'text/turtle',
      function(uri2, ok, message) {
        if (ok) {
          //resolve(uri2);
        } else {
          reject(
            new Error(
              'FAILED to save new resource at: ' + uri2 + ' : ' + message,
            ),
          );
        }
      },
    );
   }

  await    this.updater.put(
        newChatDoc,
        this.store.statementsMatching(
          undefined,
          undefined,
          undefined,
          newChatDoc,
        ),
        'text/turtle',
        function(uri3, ok, message) {
          if (ok) {
            resolve(uri3);
          } else {
            reject(
              new Error(
                'FAILED to save new resource at: ' + uri3 + ' : ' + message,
              ),
            );
          }
        },
      );



    });
  }

  /**
   * Create default permissions file .acl
   * We are making everyone owner for now
   * @param url
   */
  createDefaultPermission(newDir: string) {

    return new Promise(async (resolve, reject) => {
      // without trailing "/" folder will be unreadable by everyone including owner
            const newCurrDir = newDir + '/';
            const newOwnerInstance = this.store.sym(newDir + '/.acl#ControlReadWrite');
           const newPermissionsDoc = newOwnerInstance.doc();

            this.store.add(newOwnerInstance, this.ns.rdf('type'), this.ns.acl('Authorization'), newPermissionsDoc);
            this.store.add(newOwnerInstance, this.ns.acl('accessTo'), this.store.sym(newCurrDir), newPermissionsDoc);
            this.store.add(newOwnerInstance, this.ns.acl('agent'), this.store.sym(this.me), newPermissionsDoc);
            this.store.add(newOwnerInstance, this.ns.acl('agentClass'), this.ns.foaf('Agent'), newPermissionsDoc);
            this.store.add(newOwnerInstance, this.ns.acl('defaultForNew'), this.store.sym(newCurrDir), newPermissionsDoc);
            this.store.add(newOwnerInstance, this.ns.acl('mode'), this.ns.acl('Control'), newPermissionsDoc);
            this.store.add(newOwnerInstance, this.ns.acl('mode'), this.ns.acl('Read'), newPermissionsDoc);
            this.store.add(newOwnerInstance, this.ns.acl('mode'), this.ns.acl('Write'), newPermissionsDoc);

            const newReadInstance = this.store.sym(newDir + '/.acl#Read');
            this.store.add(newReadInstance, this.ns.rdf('type'), this.ns.acl('Authorization'), newPermissionsDoc);
            this.store.add(newReadInstance, this.ns.acl('accessTo'), this.store.sym(newCurrDir), newPermissionsDoc);
            this.store.add(newReadInstance, this.ns.acl('defaultForNew'), this.store.sym(newCurrDir), newPermissionsDoc);
            this.store.add(newReadInstance, this.ns.acl('mode'), this.ns.acl('Read'), newPermissionsDoc);

        await    this.updater.put(
              newPermissionsDoc,
              this.store.statementsMatching(
                undefined,
                undefined,
                undefined,
                newPermissionsDoc,
              ),
              'text/turtle',
              function(uri2, ok, message) {
                if (ok) {
                  resolve(uri2);
                } else {
                  reject(
                    new Error(
                      'FAILED to save new resource at: ' + uri2 + ' : ' + message,
                    ),
                  );
                }
              },
            );


          });
  }


  /**
   * Get a list of workspaces
   */
  async getListWorkSpaces(url): Promise<any> {
   
    // note url must end with a /
    const appdataUrl = url + '/' + CONTAINERS.rootContainer;
    console.log('AppData ' + appdataUrl);
    const appstore = this.store.sym(appdataUrl);
    return await this.getFolderItems(appdataUrl)
  }

  getFileContent = async (file: string) => {
    let contents = [];

    return await this.fetcher.load(file).then(
      response => {
        // get the folder contents
        contents = this.store.match(this.store.sym(file), undefined, undefined);

        console.log(contents);

        return contents;
      },
      err => {
        console.log(err);
        return err;
      },
    );
  }

  getFolderItems = async (subject: any) => {
  return this.fileClient.readFolder(subject).then(folder => {

     // console.log(`Read ${folder.name}, it has ${folder.folders.length} files.`);
   //   console.log(JSON.stringify(folder))
      return folder
    }, err => {
      console.log("Error: Folderitems "+err)
      return   {
        folders: [],
        files: [],
      };
   });
    
  }

  processFolders(url){
   
  }

  getFileType = (graph, url) => {
    const subj = this.store.sym(url);
    const pred = this.store.sym(this.ns.rdf('type'));
    let type = graph.any(subj, pred, undefined);

    const regexContainer = new RegExp('ldp#BasicContainer');
    const regexMediatype = new RegExp('http://www.w3.org/ns/iana/media-types/');

    if (regexContainer.test(type)) return 'folder';

    if (regexMediatype.test(type)) {
      type = type.replace('http://www.w3.org/ns/iana/media-types/', '');
      return type.replace('#Resource', '');
    }
    return 'unknown';
  }

  //subject is the directory
  // messageStore is subject.doc()
  sendMessage = async (workspace: Workspace, msg: string) => {

    const now = new Date();
    const timestamp = '' + now.getTime();
    const dateStamp = $rdf.term(now);

    const subject = this.store.sym(workspace.indexFile);

    //TODO: Get All participants and load their messages

    const chatdoc = this.store.sym(workspace.getChatStoreFile());
    const messageStore = chatdoc.doc();
    const subjectDoc = subject.doc();
    // http://www.w3schools.com/jsref/jsref_obj_date.asp
    const message = this.store.sym(messageStore.uri + '#' + 'Msg' + timestamp);


    let sts =[]
    // msgSts.push(new $rdf.Statement(message, ns.dc('title'), kb.literal(titlefield.value), messageStore))
    sts.push(
       $rdf.st(
        message,
        this.ns.sioc("content"),
        this.store.literal(msg),
        messageStore
      )
    ); 

 //   this.store.add(message, this.ns.sioc('content'), this.store.literal(msg), messageStore);

    sts.push(
      $rdf.st(
        message,
        this.ns.dc("created"),
        dateStamp,
        messageStore
      )
    ); 


        sts.push(
          $rdf.st(
            message,
            this.ns.foaf("maker"),
            workspace.me,
            messageStore
          )
        ); 

        await this.updater.update(
          [],
         sts,
          function(uri3, ok, message) {
            if (ok) {
            //  resolve(uri2);
            } else {
             console.log(
                new Error(
                  'FAILED to save new resource at: ' + uri3 + ' : ' + message,
                ),
              );
            }
          },
        );          

         //this.store.add(subject, this.ns.wf('message'), message, subjectDoc);
    let ins = $rdf.st(subject, this.ns.wf('message'), message, subjectDoc)
    // Update method is different from put
    await this.updater.update(
      [],
     ins,
      function(uri2, ok, message) {
        if (ok) {
        //  resolve(uri2);
        } else {
         console.log(
            new Error(
              'FAILED to save new resource at: ' + uri2 + ' : ' + message,
            ),
          );
        }
      },
    );


  }

  // create chat document
  getChatDocument(wkspace): any {
    const defaultContainer = this.defaultAppContainerUrl();

    //TODO: check if owner or not and return link

    return defaultContainer + '/' + wkspace + '/chats.ttl';
  }

  getIndexfile(workspace: string): string {
    const defaultContainer = this.defaultAppContainerUrl();

    //TODO: check if owner or not and return link

    return defaultContainer + '/' + workspace + '/index.ttl';
  }

  loadResource = async (url: string): Promise<boolean> => {
    try{
    const response = await this.fetcher.load(url)
    return !!response
    }
    catch(err){
      return false;
    }

  };

  joinWorkSpace = (toJoin: string):Promise<boolean> => {
    // Click on join
    // Add to participantlist
    // Extract workspace name from
    // set original url
    toJoin = utils.removeTrailingSlash(toJoin);
  return  this.initializeContainers(toJoin, false);

  };

  getWkSpaceName(url: string): string {
    console.log('URL ' + url);
    url = utils.removeTrailingSlash(url);
    return url.split(CONTAINERS.rootContainer + '/')[1].split('/')[0];
  }

  newThing = function (doc) {
    const now = new Date();
    return $rdf.sym(doc.uri + '#' + 'id' + ('' + now.getTime()));
  };

}
