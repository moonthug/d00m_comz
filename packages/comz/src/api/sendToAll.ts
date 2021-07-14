import { ApiGatewayManagementApi } from 'aws-sdk';

import { Event } from '@d00m/dto';
import { ConnectionsTable } from '@d00m/models';
import { DynamoDbClient } from '@d00m/dynamo-db';

import { sendToConnection } from './sendToConnection';
import { createLogger } from '@d00m/logger';


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
  const logger = createLogger('sendToAll', process.env.LOG_LEVEL);
  logger.info(`enter: sendToAll`);

  // Fetch All connections
  const connections = await ConnectionsTable.scan(dynamoDbClient, tableName);

  const postCalls = connections
    .filter(connection => options?.skipUserIds
      ? !options.skipUserIds.includes(connection.userId)
      : true
    )
    .map(connection => sendToConnection(
      dynamoDbClient,
      tableName,
      apigwManagementApi,
      connection.id,
      event
    ));

  let response;
  try {
    response = await Promise.all(postCalls);
  } catch (e) {
    logger.error(`Couldn't send to all connections`);
    logger.error(e);
  }

  logger.info(`exit: sendToConnection`);

  return response;
}
