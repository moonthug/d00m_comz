export enum Action {
  SEND_MESSAGE = 'send-message',
  CHAT_HISTORY = 'chat-history',
  LIST_USERS = 'list-users'
}

export enum Event {
  MESSAGE = 'message'
}

export interface ActionEvent {
  event: Event;
  data?: unknown;
}

export interface ActionResponse {
  action: unknown;
  success: boolean;
  error?: boolean;
  data?: unknown;
}

