import { ApiGatewayManagementApi } from 'aws-sdk';

import { ActionResponse, Event } from '@d00m/dto';
import { DynamoDbClient } from '@d00m/dynamo-db';
import { createLogger } from '@d00m/logger';

export async function sendToConnection(
  dynamoDbClient: DynamoDbClient,
  connectionsTableName: string,
  apigwManagementApi: ApiGatewayManagementApi,
  connectionId: string,
  payload: Event | ActionResponse,
): Promise<any> {
  const logger = createLogger('sendToConnection', process.env.LOG_LEVEL);
  logger.info(`enter: sendToConnection`);

  // Send event
  let response;
  try {
    logger.info(`Post to connection ${connectionId}`);
    response = await apigwManagementApi
      .postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) })
      .promise();
  } catch (e) {
    // Delete stale connection
    if (e.statusCode === 410) {
      logger.info(`Removing stale connection ${connectionId}`);
      await dynamoDbClient.delete({ TableName: connectionsTableName, Key: { id: connectionId } }).promise();
    } else {
      logger.error(`Couldn't send to connection ${connectionId}`);
      logger.error(e);
      throw e;
    }
  }

  logger.info(`exit: sendToConnection`);

  return response;
}
