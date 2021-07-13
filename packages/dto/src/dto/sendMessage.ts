import { Action, ActionEvent, ActionResponse, Event } from './actions';

export interface SendMessageActionBody {
  message: string;
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
