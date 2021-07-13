import { APIGatewayAuthorizerEvent, APIGatewayAuthorizerWithContextResult, APIGatewayEvent, Context } from 'aws-lambda';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { ConnectionsTable, UsersTable } from '@d00m/models';
import { D00mAuthorizerContext } from '@d00m/dto';

import { LOG_LEVEL } from './constants/log';
import { CONNECTION_EXPIRATION_S } from './constants/db';
import { createDenyPolicy } from './helpers/createDenyPolicy';
import { createAllowPolicy } from './helpers/createAllowPolicy';


let dynamoDbClient: DynamoDbClient;

export async function authorizerHandler(
  event: APIGatewayAuthorizerEvent & APIGatewayEvent,
  context?: Context
): Promise<APIGatewayAuthorizerWithContextResult<D00mAuthorizerContext>> {
  const logger = createLogger('authorizerHandler', LOG_LEVEL);
  logger.info(`enter: authorizerHandler`);

  context.callbackWaitsForEmptyEventLoop = false;

  const { CONNECTIONS_TABLE_NAME, USERS_TABLE_NAME } = process.env;
  const { connectionId } = event.requestContext;

  const authorization = event.headers['Authorization'];
  const userAgent = event.headers['User-Agent'];

  // Bail if not Auth header
  if (!authorization) {
    logger.warn(`No authorization sent in headers`);
    return createDenyPolicy('me', event.methodArn);
  }

  // @TODO Authorize and get userId
  const userId = authorization;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  // Authenticate
  const me = await UsersTable.getById(dynamoDbClient, USERS_TABLE_NAME, userId);

  // Bail if user not found
  if (!me) {
    throw new Error(`Cannot find user: ${userId}`);
  }

  const authorizedAt = new Date();

  // Update lastSeenAt
  await UsersTable.updateLastConnectedAt(dynamoDbClient, USERS_TABLE_NAME, me.id, authorizedAt)

  // Check for existing connection and update expiration
  let connection = await ConnectionsTable.getById(dynamoDbClient, CONNECTIONS_TABLE_NAME, connectionId);
  if (connection) {
    connection = await ConnectionsTable.updateExpiresAt(dynamoDbClient, CONNECTIONS_TABLE_NAME, connectionId, CONNECTION_EXPIRATION_S)
  }

  // Set context
  const authContext: D00mAuthorizerContext = {
    // Auth
    authorizedAt: authorizedAt.toISOString(),
    userAgent,
    hasConnection: !!connection,
    expiresAt: connection?.expiresAt?.toISOString(),

    // User
    userId: me.id,
    userName: me.name
  }

  // Return policy
  const allowPolicy = createAllowPolicy('me', event.methodArn, authContext);

  logger.info(`exit: authorizerHandler`);

  return allowPolicy;
}
