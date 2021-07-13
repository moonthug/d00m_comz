import { Action, ActionRequest, ActionResponse } from './actions';

export interface ListUsersActionRequest extends ActionRequest {
  action: Action.LIST_USERS;
}

export interface ListUsersResponseUser {
  id: string;
  name: string;
  connections: string[]
}

export interface ListUsersResponse extends ActionResponse {
  action: Action.LIST_USERS;
  data: {
    users: ListUsersResponseUser[]
  }
}
