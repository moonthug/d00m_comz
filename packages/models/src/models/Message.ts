import { DynamoDbClient } from '@d00m/dynamo-db';

export interface Message {
  fromUserId: string;   // HASH
  createdAt: Date;  // RANGE

  message: string;
  fromConnectionId?: string;
}


export class MessagesTable {
  static async create(dynamoDbClient: DynamoDbClient, tableName: string, message: Partial<Message>) {
    const item = {
      ...message,
      createdAt: message.createdAt
        ? message.createdAt.toISOString()
        : (new Date()).toISOString()
    }

    const result = await dynamoDbClient
      .put({
        TableName: tableName,
        Item: item
      })
      .promise();

    return item;
  }

  static async scan(dynamoDbClient: DynamoDbClient, tableName: string) {
    const result = await dynamoDbClient.scan(
      {
        TableName: tableName,
        ProjectionExpression: 'userId,createdAt,message,connectionId'
      }).promise();

    return result.Items as Message[];
  }
}
