export enum Service {
  MESSAGES = 'messages',
  USERS = 'users'
}

export interface BaseRequest {
  action: Service;
  command: string;
  data?: unknown;
}

export interface BaseResponse {
  success: boolean;
  error?: boolean;
  data?: unknown;
}
