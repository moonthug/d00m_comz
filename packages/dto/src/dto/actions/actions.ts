export enum ActionType {
  SEND_MESSAGE = 'send-message',
  CHAT_HISTORY = 'chat-history',
  LIST_USERS = 'list-users'
}

export interface ActionRequest {
  action: ActionType;
  data?: unknown;
}

export interface ActionResponse {
  action: unknown;
  success: boolean;
  error?: boolean;
  data?: unknown;
}

