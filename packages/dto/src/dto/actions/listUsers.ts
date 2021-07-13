import { ActionType, ActionRequest, ActionResponse } from './actions';
import { OnlineUser } from '../onlineUser';

export interface ListUsersActionRequest extends ActionRequest {
  action: ActionType.LIST_USERS;
}

export interface ListUsersResponse extends ActionResponse {
  action: ActionType.LIST_USERS;
  data: {
    users: OnlineUser[]
  }
}

