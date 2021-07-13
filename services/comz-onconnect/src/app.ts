import { APIGatewayProxyWithLambdaAuthorizerEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { ConnectionsTable, UsersTable } from '@d00m/models';
import { D00mAuthorizerContext, EventType, UsersEvent } from '@d00m/dto';
import { sendToAll } from '@d00m/comz';

import { LOG_LEVEL } from './constants/log';
import { CONNECTION_EXPIRATION_S } from './constants/db';
import { fetchOnlineUsers } from '@d00m/comz/dist/api/fetchOnlineUsers';


let dynamoDbClient: DynamoDbClient;

export async function onConnectHandler(
  event: APIGatewayProxyWithLambdaAuthorizerEvent<D00mAuthorizerContext>,
  context?: Context
): Promise<any> {
  const logger = createLogger('onConnectHandler', LOG_LEVEL);
  logger.info(`enter: onConnectHandler`);

  const { CONNECTIONS_TABLE_NAME, USERS_TABLE_NAME } = process.env;
  const { userId, userName, userAgent, authorizedAt, expiresAt } = event.requestContext.authorizer as unknown as D00mAuthorizerContext;
  const { connectionId } = event.requestContext;

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  // Api Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });


  try {
    const connectedAt = new Date();

    // Update user
    await UsersTable.updateLastConnectedAt(dynamoDbClient, USERS_TABLE_NAME,
      userId,
      connectedAt
    )

    // Put connection
    await ConnectionsTable.create(dynamoDbClient, CONNECTIONS_TABLE_NAME,
      {
        id: connectionId,
        userId,
        authorizedAt: authorizedAt,
        connectedAt: connectedAt.toISOString(),
        userName,
        userAgent
      },
      CONNECTION_EXPIRATION_S
    );

  } catch (e) {
    logger.error(`Couldn't put connection in db`);
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

  // Emit user

  logger.info(`exit: onConnectHandler`);

  return { statusCode: 200, body: 'Connected.' };
}
