import { APIGatewayEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

import { createLogger } from '@d00m/logger';
import { Action, ListUsersResponse, ListUsersResponseUser } from '@d00m/dto';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { ConnectionsTable } from '@d00m/models';

import { LOG_LEVEL } from './constants/log';
import { fetchGroupedUsers } from '../../../packages/comz/src/api/fetchGroupedUsers';
import { fetchOnlineUsers } from '../../../packages/comz/src/api/fetchOnlineUsers';
import { sendToConnection } from '@d00m/comz';


let dynamoDbClient: DynamoDbClient;

export async function listUsersHandler(
  event: APIGatewayEvent,
  context?: Context
): Promise<any> {
  const logger = createLogger('listUsersHandler', LOG_LEVEL);
  logger.info(`enter: listUsersHandler`);

  const { CONNECTIONS_TABLE_NAME } = process.env;
  const { connectionId } = event.requestContext;

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  // Create API Gateway Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  // Fetch all connections
  const users = await fetchOnlineUsers(dynamoDbClient, CONNECTIONS_TABLE_NAME);

  // Build response
  const response: ListUsersResponse = {
    action: Action.LIST_USERS,
    success: true,
    data: {
      users
    }
  }

  // Send response to callee
  try {
    logger.info(`Post to connection ${connectionId}`);

    await sendToConnection(connectionId, apigwManagementApi, response);
  } catch (e) {
    if (e.statusCode === 410) {
      logger.info(`Found stale connection, deleting ${connectionId}`);
      await dynamoDbClient.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { id: connectionId } }).promise();
    } else {
      logger.error(`Couldn't post to connection ${connectionId}`);
      logger.error(e);
      throw e;
    }
  }

  logger.info(`exit: listUsersHandler`);

  return { statusCode: 200, body: 'Success.' };
}
