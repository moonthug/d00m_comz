import { Message } from '@d00m/models';

import { Action, ActionRequest, ActionResponse } from './actions';

export interface ChatHistoryActionRequest extends ActionRequest {
  action: Action.CHAT_HISTORY;
}

export interface ChatHistoryResponse extends ActionResponse {
  action: Action.CHAT_HISTORY;
  data: {
    messages: Message[]
  }
}
