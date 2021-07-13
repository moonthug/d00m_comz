import { Action, ActionEvent, ActionRequest, ActionResponse, Event } from './actions';

export interface SendMessageActionRequest extends ActionRequest {
  action: Action.SEND_MESSAGE;
  data: {
    message: string;
  }
}

export interface SendMessageResponse extends ActionResponse {
  action: Action.SEND_MESSAGE;
  data?: unknown;
}

export interface MessageEvent extends ActionEvent {
  event: Event.MESSAGE;
  data: {
    message: string;
  }
}
