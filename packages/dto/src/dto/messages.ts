import { BaseRequest, Service } from './base';

export enum MessagesCommand {
  SEND_TO_ALL = 'send_to_all'
}

export interface MessagesRequest extends BaseRequest {
  action: Service.MESSAGES;
  command: MessagesCommand;
  data: unknown;
}

export interface SendMessageToAllRequest extends MessagesRequest {
  action: Service.MESSAGES;
  command: MessagesCommand.SEND_TO_ALL;
  data: {
    message: string;
  }
}
