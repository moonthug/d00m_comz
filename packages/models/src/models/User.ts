import { DynamoDbClient } from '@d00m/dynamo-db';

export interface User {
  id: string;   // RANGE
  name: string;
  lastSeenAt: Date;
  lastConnectedAt: Date;
}

export interface UserDocument {
  pk: string;   // HASH
  sk: string;   // RANGE
  name: string;
  lastSeenAt: string;
  lastConnectedAt: string;
}


export interface UserData {
  id: string;   // HASH
  name: string;
  lastSeenAt: Date;
  lastConnectedAt: Date;
}

export class UsersTable {
  private static pk = 'user';

  private static mapDocumentToModel(document: UserDocument): User {
    return {
      id: document.sk,
      name: document.name,
      lastSeenAt: new Date(document.lastSeenAt),
      lastConnectedAt: new Date(document.lastConnectedAt)
    }
  }

  static async getById(dynamoDbClient: DynamoDbClient, tableName: string, id: string): Promise<User> {
    const response = await dynamoDbClient.query({
        TableName: tableName,
        KeyConditionExpression: 'pk = :type AND sk = :id',
        ExpressionAttributeValues: {
          ':type': UsersTable.pk,
          ':id': id
        },
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ProjectionExpression: 'pk,sk,#name,lastSeenAt,lastConnectedAt'
      }).promise();

    if (!response?.Items.length) {
      return undefined;
    }

    return UsersTable.mapDocumentToModel(response.Items[0] as UserDocument);
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
          pk: UsersTable.pk,
          sk: id
        },
        UpdateExpression: 'set lastSeenAt = :lastSeenAt',
        ExpressionAttributeValues:{
          ':lastSeenAt': seenAt.toISOString()
        },
        ReturnValues: 'ALL_NEW'
      }).promise();

    return UsersTable.mapDocumentToModel(response.$response.data as UserDocument);
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
          pk: UsersTable.pk,
          sk: id
        },
        UpdateExpression: 'set lastConnectedAt = :lastConnectedAt',
        ExpressionAttributeValues:{
          ':lastConnectedAt': connectedAt.toISOString()
        },
        ReturnValues: 'ALL_NEW'
      }).promise();

    return UsersTable.mapDocumentToModel(response.$response.data as UserDocument);
  }
}
