import { DynamoDbClient } from '@d00m/dynamo-db';

export interface Connection {
  id: string;           // HASH
  userId: string;
  authorizedAt: Date;
  connectedAt: Date;
  userName: string;
  userAgent: string;
  expiresAt: Date;      // TTL
}

export interface ConnectionData {
  id: string;
  userId: string;
  authorizedAt: string;
  connectedAt: string;
  userName: string;
  userAgent: string;
  expiresAt?: string;
}

export class ConnectionsTable {
  private static mapDateToModel(data: ConnectionData): Connection {
    return {
      ...data,
      authorizedAt: new Date(data.authorizedAt),
      connectedAt: new Date(data.connectedAt),
      expiresAt: new Date(data.expiresAt),
    }
  }

  static async create(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    connection: ConnectionData,
    expireInSeconds?: number
  ): Promise<Connection> {
    const item = {
      ...connection,
      authorizedAt: connection.authorizedAt,
      connectedAt: connection.connectedAt,
    }

    // Set TTL
    if (expireInSeconds) {
      const expiresAt = new Date(Date.now() + expireInSeconds * 1000);
      item.expiresAt = expiresAt.toISOString();
    }

    const result = await dynamoDbClient
      .put({
        TableName: tableName,
        Item: item
      })
      .promise();

    return ConnectionsTable.mapDateToModel(connection);
  }

  static async getById(dynamoDbClient: DynamoDbClient, tableName: string, id: string): Promise<Connection> {
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

    return ConnectionsTable.mapDateToModel(response.Items[0] as ConnectionData);
  }

  static async scan(dynamoDbClient: DynamoDbClient, tableName: string): Promise<Connection[]> {
    const result = await dynamoDbClient.scan(
      {
        TableName: tableName,
        ProjectionExpression: 'id,userId,authorizedAt,connectedAt,userName,userAgent'
      }).promise();

    return result.Items.map(ConnectionsTable.mapDateToModel);
  }

  static async updateExpiresAt(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    id: string,
    expireInSeconds: number
  ): Promise<Connection> {
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

    return ConnectionsTable.mapDateToModel(response.$response.data as ConnectionData);
  }
}
