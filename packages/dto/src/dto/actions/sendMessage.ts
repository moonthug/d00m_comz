import { ActionType, ActionRequest, ActionResponse } from './actions';

export interface SendMessageActionRequest extends ActionRequest {
  action: ActionType.SEND_MESSAGE;
  data: {
    message: string;
  }
}

export interface SendMessageResponse extends ActionResponse {
  action: ActionType.SEND_MESSAGE;
  data?: unknown;
}
