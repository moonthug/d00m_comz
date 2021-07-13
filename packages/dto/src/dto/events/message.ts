import { Event, EventType } from './events';

export interface MessageEvent extends Event {
  event: EventType.MESSAGE;
  data: {
    fromUserId: string;
    fromUserName: string;
    createdAt: Date;
    message: string;
  }
}
