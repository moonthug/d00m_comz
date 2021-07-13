import { APIGatewayEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

import { createLogger } from '@d00m/logger';
import { Action, ListUsersResponse, ListUsersResponseUser } from '@d00m/dto';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { ConnectionsTable } from '@d00m/models';

import { LOG_LEVEL } from './constants/log';


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

  // Fetch all connections
  let connections;
  try {
    connections = await ConnectionsTable.scan(dynamoDbClient, CONNECTIONS_TABLE_NAME);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  // Group Connections
  const users = connections.reduce((acc, connection) => {
    if (acc.has(connection.userId)) {
      const existing = acc.get(connection.userId);
      acc.set(connection.userId, {
        ...existing,
        connections: [
          ...existing.connections,
          connection.connectionId
        ]
      });
    } else {
      acc.set(connection.userId, {
        id: connection.userId,
        name: connection.userName,
        connections: [
          connection.connectionId
        ]
      });
    }

    return acc;

  }, new Map<string, ListUsersResponseUser>())

  // Build response
  const response: ListUsersResponse = {
    action: Action.LIST_USERS,
    success: true,
    data: {
      users: Array.from(users.values())
    }
  }

  // Create API Gateway Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  // Send response to callee
  try {
    logger.info(`Post to connection ${connectionId}`);

    await apigwManagementApi
      .postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(response) })
      .promise();
  } catch (e) {
    if (e.statusCode === 410) {
      logger.info(`Found stale connection, deleting ${connectionId}`);
      await dynamoDbClient.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId } }).promise();
    } else {
      logger.error(`Couldn't post to connection ${connectionId}`);
      logger.error(e);
      throw e;
    }
  }

  logger.info(`exit: listUsersHandler`);

  return { statusCode: 200, body: 'Success.' };
}
