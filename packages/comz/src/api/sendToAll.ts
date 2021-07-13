import { ApiGatewayManagementApi } from 'aws-sdk';

import { Event } from '@d00m/dto';
import { ConnectionsTable } from '@d00m/models';
import { DynamoDbClient } from '@d00m/dynamo-db';

import { sendToConnection } from './sendToConnection';


export interface SendToAllOptions {
  skipUserIds?: string[];
}

export async function sendToAll(
  dynamoDbClient: DynamoDbClient,
  tableName: string,
  apigwManagementApi: ApiGatewayManagementApi,
  event: Event,
  options?: SendToAllOptions
): Promise<any> {
  // Fetch All connections
  const connections = await ConnectionsTable.scan(dynamoDbClient, tableName);

  const postCalls = connections
    .filter(connection => options?.skipUserIds
      ? !options.skipUserIds.includes(connection.userId)
      : true
    )
    .map(connection => sendToConnection(connection.id, apigwManagementApi, event));

  return Promise.all(postCalls);
}
