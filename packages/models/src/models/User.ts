import { DynamoDbClient } from '@d00m/dynamo-db';

export interface User {
  id: string;   // HASH
  name: string;
  lastSeenAt: Date;
  lastConnectedAt: Date;
}

export interface UserData {
  id: string;   // HASH
  name: string;
  lastSeenAt: string;
  lastConnectedAt: string;
}

export class UsersTable {
  private static mapDateToModel(data: UserData): User {
    return {
      ...data,
      lastSeenAt: new Date(data.lastSeenAt),
      lastConnectedAt: new Date(data.lastConnectedAt)
    }
  }

  static async getById(dynamoDbClient: DynamoDbClient, tableName: string, id: string): Promise<User> {
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

    return UsersTable.mapDateToModel(response.Items[0] as UserData);
  }

  static async updateLastSeenAt(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    id: string,
    seenAt: Date
  ): Promise<User> {
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

    return UsersTable.mapDateToModel(response.$response.data as UserData);
  }

  static async updateLastConnectedAt(
    dynamoDbClient: DynamoDbClient,
    tableName: string,
    id: string,
    connectedAt: Date
  ): Promise<User> {
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

    return UsersTable.mapDateToModel(response.$response.data as UserData);
  }
}
