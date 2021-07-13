import { ApiGatewayManagementApi } from 'aws-sdk';

import { ActionResponse, Event } from '@d00m/dto';
import { DynamoDbClient } from '@d00m/dynamo-db';

export async function sendToConnection(
  dynamoDbClient: DynamoDbClient,
  connectionsTableName: string,
  apigwManagementApi: ApiGatewayManagementApi,
  connectionId: string,
  payload: Event | ActionResponse,
): Promise<any> {
  // Send event
  try {
    return apigwManagementApi
      .postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) })
      .promise();
  } catch (e) {
    // Delete stale connection
    if (e.statusCode === 410) {
      await dynamoDbClient.delete({ TableName: connectionsTableName, Key: { id: connectionId } }).promise();
    } else {
      throw e;
    }
  }

}
