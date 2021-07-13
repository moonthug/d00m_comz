import { DynamoDbClient } from '@d00m/dynamo-db';

export interface User {
  id: string;   // HASH
  name: string;
}


export class UsersTable {
  static async getUserById(dynamoDbClient: DynamoDbClient, tableName: string, id: string) {
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
}
