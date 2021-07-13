import { Message } from '@d00m/models';

import { Action, ActionResponse } from './actions';

export interface ChatHistoryResponse extends ActionResponse {
  action: Action.CHAT_HISTORY;
  data: {
    messages: Message[]
  }
}
