import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ChatService } from './chat.service';
import { Message } from '../../models/message.model';
import { PodHandlerService } from '../../services/pod-handler.service';
import { Workspace } from '../../models/workspace.model';

import * as SolidFileClient from 'solid-file-client';
import { NbMenuService } from '@nebular/theme';
import { takeWhile, timeInterval } from 'rxjs/operators';
import { interval,Subscription } from 'rxjs';

declare let $rdf:any;

@Component({
  selector: 'ngx-chat',
  templateUrl: 'chat.component.html',
  styleUrls: ['chat.component.scss'],
  providers: [ ChatService ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {


  messages: any[] = [];

  activeWorkSpace: Workspace;
  isIndexSubscribed: boolean = false;
  isChatFileSubscribed: boolean = false;
  private alive: boolean = true;

  fileClient = SolidFileClient;
  selectedItem: any;
  isMsgSyncing = false

  messageTurtle:string =""


  subscription: Subscription;
  store:any

  constructor(private router:Router,
    protected chatService: ChatService,
    private podhandler: PodHandlerService,
            private _Activatedroute: ActivatedRoute,
            private menuService: NbMenuService,
            private cdr: ChangeDetectorRef,
            ) {
          //  this.messages = this.chatService.loadMessages();
          this.store = this.podhandler.store
        }

  ngOnInit(): void {
   setTimeout(() => {
     this.getSelectedItem();
     if(this.selectedItem === undefined)
    this.router.navigate(['/dashboard'])

   }, 500);
   /* this._Activatedroute.queryParams.subscribe(params => {
      this.activeWorkSpace = JSON.parse(params['ws']);

    });  */

  }
  ngAfterViewInit(): void {

  }

  ngOnDestroy() {
    this.alive = false;
    if(this.subscription){
      this.subscription.unsubscribe()
    }
    this.selectedItem =undefined
  }

  sendMessage(event: any) {
    const files = !event.files ? [] : event.files.map((file) => {
      return {
        url: file.src,
        type: file.type,
        icon: 'nb-compose',
      };
    });
    
 const that = this;
    this.podhandler.sendMessage(this.activeWorkSpace,
      event.message)
      .then(_ => {
         console.log( event.message);

     that.syncMessages();
    },
   ).catch(err => {
     console.log('Error ' + err);
   });


  /*
    const botReply = this.chatService.reply(event.message);
    if (botReply) {
      setTimeout(() => { this.messages.push(botReply); }, 500);
    } */
  }


syncMessages = async () => {

// get references to the index.ttl and chat.ttl files and load to store

const index = this.activeWorkSpace.indexFile ;

const indexDoc = this.store.sym(index).doc()

const chatFile = this.activeWorkSpace.getChatStoreFile()
const chatDoc = this.store.sym(chatFile)


if (this.store.holds(indexDoc,this.podhandler.ns.rdf('type'),this.podhandler.ns.ldp('Resource')) ){
  
    this.podhandler.updater.reload(this.store,chatDoc, ()=>{}) 

       this.podhandler.updater.reload(this.store,indexDoc,
      ()=>{ this.refreshFunction(index)})
  }


else{
  await Promise.all([  this.podhandler.loadResource(index) ,
 this.podhandler.loadResource(this.activeWorkSpace.getChatStoreFile()),
])
 .then(async _ => {
   
 this.refreshFunction(index)

 }, (err) => {
   // error occurred
   console.log(err);
});
}  



}

 refreshFunction(indDoc){
   if(this.isMsgSyncing){
    return
   }
  this.isMsgSyncing = true
  const subject = this.store.sym(indDoc);
   const subjectDoc = subject.doc();
const chatDoc = this.store.sym(this.activeWorkSpace.getChatStoreFile()).doc();

  this.store.each(
   subject, this.podhandler.ns.wf('message'), null, subjectDoc).forEach( st => {

       const messageFile = st.doc().uri;
     this.fileClient.fetchAndParse(messageFile, 'text/turtle').then(graph => {
     
   this.messageTurtle = graph
    this.parseMessage(graph, st);
    


    }, err => {
      console.log(err)
    this.isMsgSyncing = false
    } );

   });
this.isMsgSyncing = false
}


workingIndex(): any {
  if (this.activeWorkSpace.isMine()) {
    console.log('ISMINE ' + this.activeWorkSpace.localIndexFile());
    return this.activeWorkSpace.localIndexFile() +'#this';
  } else {
    const subject = this.store.sym(this.activeWorkSpace.localIndexFile() + '#this');
    const pred =   this.store.sym(this.podhandler.ns.owl('sameAs'));
   
    // {"termType":"Literal","value":"https://apraku.solid.community/public/cold/PitchMeeting/index.ttl"}
    const innd =  this.store.any(subject, pred);   // returns an object
    console.log('NOTMINE ' + innd.value);
    return innd.value;
  }
 }

 subscribe = (doc, refreshFunction) => {
  this.podhandler.updater.addDownstreamChangeListener(doc, refreshFunction);
 }

 /**
  *  Parse the message to an object
  *  */
 parseMessage = async (graph: any, msgSym: any) => {

  
   const maker =  graph.any(msgSym, this.podhandler.ns.foaf('maker'), null);
   
if(maker != undefined){
   const msg = new Message();
  const content =  graph.any(msgSym, this.podhandler.ns.sioc('content'), null);
   const time =  graph.any(msgSym, this.podhandler.ns.dc('created'), null);

  msg.uri = msgSym.value;
  msg.content =  content != undefined ? content.value : '';
  msg.dateCreated =  new Date(time);

  msg.maker = maker ? maker.value : "";

  msg.makerProfile =  await this.podhandler.rdf.getProfile(msg.maker);

 const alreadyExist = this.messages.find((msgObj) => msgObj.uri === msg.uri);
 if (alreadyExist === undefined) {
    //  this.messagesList.push(msg)
      this.messages.push({
  uri: msg.uri,
  text: msg.content,
  date: msg.dateCreated,
  reply: false,
  type:  'text', //files.length ? 'file' :
 // files: files,
  user: {
    name: msg.makerProfile ? msg.makerProfile.fn : "",
    avatar: msg.makerProfile ? msg.makerProfile.picture : "",
  },
});
this.cdr.markForCheck();
 }
}

 }


 setActiveWS = async(wkspace: any) => {
  const me = this.podhandler.me;
  this.activeWorkSpace = new Workspace(wkspace.name, wkspace.url, me);
  this.activeWorkSpace.setName(wkspace.name);
//console.log("before loading resource")
 await  this.podhandler.loadResource(this.activeWorkSpace.localIndexFile());
  
//console.log("after loading resource")
  const sym =  this.store.sym(this.activeWorkSpace.localIndexFile() + '#this');
    this.activeWorkSpace.owner   =  this.store.any(sym,this.store.sym(this.podhandler.ns.dc('author'))).uri;

 this.activeWorkSpace.indexFile = this.workingIndex();

 //console.log("Subject INDEX "+this.activeWorkSpace.indexFile)
 const subject = this.store.sym(this.activeWorkSpace.indexFile);
 const subjectDoc = subject.doc();
 const chatDoc = this.store.sym(this.activeWorkSpace.getChatStoreFile()).doc();

 /*
 if((this.activeWorkSpace.isMine())){
this.subscribe(subjectDoc, this.syncMessages);
      this.subscribe(chatDoc, this.syncMessages);
  } else {  
  } */
  // we use a timer to subscribe to updates because
  // the websocket doesn't work if current user is not owner of the chat
  const timerInterval =interval(5000);
   this.subscription = timerInterval.subscribe(val =>{
     this.syncMessages()
   })


  await  this.syncMessages();

}

getSelectedItem() {
  
  this.menuService.onItemSelect()
     .pipe(takeWhile(() => this.alive))
    .subscribe( (menuBag) => {
        this.messages = [];
        this.cdr.markForCheck();
   //   if(this.selectedItem.link != menuBag.item.link){   }
         this.selectedItem = menuBag.item;
        
          this.setActiveWS(this.selectedItem['payload']);


      console.log('SelectedItem ' + JSON.stringify(this.selectedItem));
    });


}


deleteFolder() {
const url = this.selectedItem['payload'];
this.fileClient.deleteFolder(this.activeWorkSpace.getUri()).then(success => {
  console.log(`Deleted ${this.activeWorkSpace.getUri()}.`);
}, err => console.log(err) );
}

sortFunc(a, b) {
  return a.date - b.date;
 }



}
