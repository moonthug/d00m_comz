import { DynamoDbClient } from '@d00m/dynamo-db';

export interface User {
  id: string;   // HASH
  name: string;
  lastSeenAt: Date;
  lastConnectedAt: Date;
}


export class UsersTable {
  static async getById(dynamoDbClient: DynamoDbClient, tableName: string, id: string) {
    const response = await dynamoDbClient.query({
        TableName: tableName,
        KeyConditionExpression: 'id = :i',
        ExpressionAttributeValues: {
          ':i': id
        },
        ExpressionAttributeNames: {
          '#n': 'name'
        },
        ProjectionExpression: 'id,#n'
      }).promise();

    if (!response?.Items.length) {
      return undefined;
    }

    return response.Items[0] as User;
  }

  static async updateLastSeenAt(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    id: string,
    seenAt: Date
  ) {
    const response = await dynamoDbClient.update({
        TableName: tableName,
        Key: {
          id
        },
        UpdateExpression: 'set lastSeenAt = :l',
        ExpressionAttributeValues:{
          ':l': seenAt.toISOString()
        },
        ReturnValues: 'ALL_NEW'
      }).promise();

    return response.$response.data as User;
  }

  static async updateLastConnectedAt(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    id: string,
    connectedAt: Date
  ) {
    const response = await dynamoDbClient.update({
        TableName: tableName,
        Key: {
          id
        },
        UpdateExpression: 'set lastConnectedAt = :l',
        ExpressionAttributeValues:{
          ':l': connectedAt.toISOString()
        },
        ReturnValues: 'ALL_NEW'
      }).promise();

    return response.$response.data as User;
  }
}
