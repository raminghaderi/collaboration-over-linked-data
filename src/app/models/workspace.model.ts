import { PodHandlerService } from '../services/pod-handler.service';

export class Workspace {
    private uri: string;
    private name: string;
    owner: string;
    podhandler: PodHandlerService;
    indexFile: string;
    me: string;

    constructor(name: string, uri: string, me: string) {
        this.uri = uri; // has trailing slash
        this.me = me;
        this.name = name;
      this.init();

    }

    init = async() => {
        await this.getOwner();

    }

    getName(): string {
        return this.name;
    }
    setName(name: string) {
        this.name = name;
    }

    getUri(): string {
        return this.uri;
    }

    localIndexFile = (): string => {
               return this.uri + 'index.ttl';
    }

    getChatStoreFile(): string {
        return this.uri + 'chats.ttl';
    }

   private getOwner = async() => {


    }

    isMine(): boolean {
           return this.owner === this.me;
    }



}
