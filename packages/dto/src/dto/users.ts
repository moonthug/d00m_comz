import { BaseRequest, BaseResponse, Service } from './base';

export enum UsersCommand {
  LIST = 'list'
}

export interface UsersRequest extends BaseRequest {
  action: Service.USERS;
  command: UsersCommand;
  data?: unknown;
}

export interface ListUsersResponse extends BaseResponse {
  data: {
    users: {
      connectionId: string;
      userId: string;
    }[];
  }
}
