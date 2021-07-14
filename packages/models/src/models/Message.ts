import { DynamoDbClient } from '@d00m/dynamo-db';

export interface Message {
  createdAt: Date;      // RANGE
  message: string;
  fromUserId: string;
  fromUserName: string;
  fromConnectionId: string;
}

export interface MessageDocument {
  pk: string;   // HASH
  sk: string;   // RANGE
  message: string;
  fromUserId: string;
  fromUserName: string;
  fromConnectionId: string;
}

export interface MessageData {
  createdAt?: string;   // RANGE
  message: string;
  fromUserId: string;
  fromUserName: string;
  fromConnectionId: string;
}

export interface QueryOptions {
  limit: number;
}

export class MessagesTable {
  private static pk = 'message';

  private static mapDocumentToModel(document: MessageDocument): Message {
    return {
      createdAt: new Date(document.sk),
      message: document.message,
      fromUserId: document.fromUserId,
      fromUserName: document.fromUserId,
      fromConnectionId: document.fromConnectionId,
    }
  }

  static async create(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    message: MessageData
  ): Promise<Message> {
    const item = {
      pk: MessagesTable.pk,
      sk: message.createdAt
        ? message.createdAt
        : (new Date()).toISOString(),
      message: message.message,
      fromUserId: message.fromUserId,
      fromUserName: message.fromUserName,
      fromConnectionId: message.fromConnectionId
    }

    const result = await dynamoDbClient
      .put({
        TableName: tableName,
        Item: item
      })
      .promise();

    return MessagesTable.mapDocumentToModel(item);
  }

  static async scan(dynamoDbClient: DynamoDbClient, tableName: string): Promise<Message[]> {
    const result = await dynamoDbClient.scan(
      {
        TableName: tableName,
        ProjectionExpression: 'pk,sk,fromUserId,fromUserName,fromConnectionId,message'
      }).promise();

    return result.Items as Message[];
  }

  static async getMessagesSinceDate(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    since: Date,
    options: QueryOptions
  ): Promise<Message[]> {
    const result = await dynamoDbClient.query(
      {
        KeyConditionExpression: 'pk = :type AND sk > :createdAt',
        ExpressionAttributeValues: {
          ':type': MessagesTable.pk,
          ':createdAt': since.toISOString()
        },
        Limit: options.limit,
        ProjectionExpression: 'pk,sk,fromUserId,fromUserName,fromConnectionId,message',
        ScanIndexForward: false,
        TableName: tableName
      }).promise();

    return result.Items as Message[];
  }
}
