import { Event, EventType } from './events';
import { OnlineUser } from '../onlineUser';

export interface UsersEvent extends Event {
  event: EventType.USERS;
  data: {
    newUser?: OnlineUser,
    users: OnlineUser[]
  }
}
