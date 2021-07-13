import { DynamoDbClient } from '@d00m/dynamo-db';

export interface Connection {
  id: string;           // HASH
  userId: string;
  authorizedAt:  Date;
  connectedAt: Date;
  userName: string;
  userAgent: string;
  expiresAt: Date;      // TTL
}

export class ConnectionsTable {
  static async create(dynamoDbClient: DynamoDbClient, tableName: string, connection: Partial<Connection>, expireInSeconds?: number) {
    const item = {
      ...connection,
      authorizedAt: connection.authorizedAt.toISOString(),
      connectedAt: connection.connectedAt.toISOString(),
    }

    // Set TTL
    if (expireInSeconds) {
      item.expiresAt = new Date(Date.now() + expireInSeconds * 1000);
    }

    const result = await dynamoDbClient
      .put({
        TableName: tableName,
        Item: item
      })
      .promise();

    return connection;
  }

  static async getById(dynamoDbClient: DynamoDbClient, tableName: string, id: string) {
    const response = await dynamoDbClient.query({
      TableName: tableName,
      KeyConditionExpression: 'id = :i',
      ExpressionAttributeValues: {
        ':i': id
      },
      ProjectionExpression: 'id,userId,authorizedAt,connectedAt,userName,userAgent'
    }).promise();

    if (!response?.Items.length) {
      return undefined;
    }

    return response.Items[0] as Connection;
  }

  static async scan(dynamoDbClient: DynamoDbClient, tableName: string) {
    const result = await dynamoDbClient.scan(
      {
        TableName: tableName,
        ProjectionExpression: 'id,userId,authorizedAt,connectedAt,userName,userAgent'
      }).promise();

    return result.Items as Connection[];
  }

  static async updateExpiresAt(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    id: string,
    expireInSeconds: number
  ) {
    const expiresAt = new Date(Date.now() + expireInSeconds * 1000);

    const response = await dynamoDbClient.update({
      TableName: tableName,
      Key: {
        id
      },
      UpdateExpression: 'set expiresAt = :e',
      ExpressionAttributeValues:{
        ':e': expiresAt.toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }).promise();

    return response.$response.data as Connection;
  }
}
