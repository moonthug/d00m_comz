import { DynamoDbClient } from '@d00m/dynamo-db';

export interface Connection {
  connectionId: string; // HASH
  userId: string;       // RANGE

  authorizedAt:  Date;
  connectedAt: Date;
  userName: string;
  userAgent: string;
}


export class ConnectionsTable {
  static async create(dynamoDbClient: DynamoDbClient, tableName: string, connection: Connection) {
    const result = await dynamoDbClient
      .put({
        TableName: tableName,
        Item: connection
      })
      .promise();

    return connection;
  }

  static async scan(dynamoDbClient: DynamoDbClient, tableName: string) {
    const result = await dynamoDbClient.scan(
      {
        TableName: tableName,
        ProjectionExpression: 'connectionId,userId,authorizedAt,connectedAt,userName,userAgent'
      }).promise();

    return result.Items as Connection[];
  }
}
