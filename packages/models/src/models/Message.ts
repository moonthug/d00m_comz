import { DynamoDbClient } from '@d00m/dynamo-db';

export interface Message {
  fromUserId: string;   // HASH
  createdAt: Date;  // RANGE
  message: string;
  fromUserName: string;
  fromConnectionId?: string;
}

export interface MessageData {
  fromUserId: string;   // HASH
  createdAt?: string;  // RANGE
  message: string;
  fromUserName: string;
  fromConnectionId?: string;
}

export class MessagesTable {
  private static mapDateToModel(data: MessageData): Message {
    return {
      ...data,
      createdAt: new Date(data.createdAt)
    }
  }

  static async create(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    message: MessageData
  ): Promise<Message> {
    const item = {
      ...message,
      createdAt: message.createdAt
        ? message.createdAt
        : (new Date()).toISOString()
    }

    const result = await dynamoDbClient
      .put({
        TableName: tableName,
        Item: item
      })
      .promise();

    return MessagesTable.mapDateToModel(item);
  }

  static async scan(dynamoDbClient: DynamoDbClient, tableName: string): Promise<Message[]> {
    const result = await dynamoDbClient.scan(
      {
        TableName: tableName,
        ProjectionExpression: 'fromUserId,createdAt,fromConnectionId,message'
      }).promise();

    return result.Items as Message[];
  }
}
