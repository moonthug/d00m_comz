import { APIGatewayEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';

import { LOG_LEVEL } from './constants/log';
import { EventType, UsersEvent } from '@d00m/dto';
import { fetchOnlineUsers } from '@d00m/comz/dist/api/fetchOnlineUsers';
import { sendToAll } from '@d00m/comz';

let dynamoDbClient: DynamoDbClient;

export async function onDisconnectHandler(
  event: APIGatewayEvent,
  context?: Context
): Promise<any> {
  const logger = createLogger('onDisconnectHandler', LOG_LEVEL);
  logger.info(`enter: onDisconnectHandler`);

  const { CONNECTIONS_TABLE_NAME } = process.env;

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  // Api Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  try {
    // Delete connection
    await dynamoDbClient.delete({
        TableName: process.env.CONNECTIONS_TABLE_NAME,
        Key: {
          connectionId: event.requestContext.connectionId
        }
      })
      .promise();

  } catch (e) {
    logger.error(`Couldn't delete connection in db`);
    logger.error(e);
    return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(e) };
  }

  // Emit all online users
  const usersEvent: UsersEvent = {
    event: EventType.USERS,
    data: {
      users: await fetchOnlineUsers(dynamoDbClient, CONNECTIONS_TABLE_NAME)
    }
  };
  await sendToAll(dynamoDbClient, CONNECTIONS_TABLE_NAME, apigwManagementApi, usersEvent);

  logger.info(`exit: onDisconnectHandler`);

  return { statusCode: 200, body: 'Disconnected.' };
}
