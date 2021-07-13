import { Message } from '@d00m/models';

import { ActionType, ActionRequest, ActionResponse } from './actions';

export interface ChatHistoryActionRequest extends ActionRequest {
  action: ActionType.CHAT_HISTORY;
}

export interface ChatHistoryResponse extends ActionResponse {
  action: ActionType.CHAT_HISTORY;
  data: {
    messages: Message[]
  }
}
