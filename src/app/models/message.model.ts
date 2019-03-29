
import { SolidProfile } from '../models/solid-profile.model';

export class Message {
    content: string;
    uri: string;
    dateCreated: Date;
    maker: string;
    senderPic: string;
    makerProfile: SolidProfile;
}
