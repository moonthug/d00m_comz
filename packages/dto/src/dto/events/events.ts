export enum EventType {
  MESSAGE = 'message',
  USERS = 'users'
}

export interface Event {
  event: EventType;
  data?: unknown;
}
