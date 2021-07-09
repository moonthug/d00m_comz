import { APIGatewayAuthorizerEvent, APIGatewayAuthorizerWithContextResult, APIGatewayEvent, Context } from 'aws-lambda';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';

import { D00mAuthorizerContext } from '@d00m/dto';
import { LOG_LEVEL } from './constants/log';
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

  const { USERS_TABLE_NAME } = process.env;
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
  const me = await dynamoDbClient.query(
    {
      TableName: USERS_TABLE_NAME,
      KeyConditionExpression: 'id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ProjectionExpression: 'id,name'
    }).promise();

  // Bail if user not found
  if (!me || !me.Items.length) {
    throw new Error(`Cannot find user: ${userId}`);
  }

  // Set context
  const authContext: D00mAuthorizerContext = {
    // Auth
    authorizedAt: (new Date()).toISOString(),
    userAgent,

    // User
    userId: me.id,
    userName: me.name
  }

  // Return policy
  const allowPolicy = createAllowPolicy('me', event.methodArn, authContext);

  logger.info(`exit: authorizerHandler`);

  return allowPolicy;
}
