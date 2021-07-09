import { APIGatewayEvent, APIGatewayProxyWithLambdaAuthorizerEvent, Context } from 'aws-lambda';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { D00mAuthorizerContext } from '@d00m/dto';

import { LOG_LEVEL } from './constants/log';


let dynamoDbClient: DynamoDbClient;

export async function onConnectHandler(
  event: APIGatewayProxyWithLambdaAuthorizerEvent<D00mAuthorizerContext>,
  context?: Context
): Promise<any> {
  const logger = createLogger('onConnectHandler', LOG_LEVEL);
  logger.info(`enter: onConnectHandler`);

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  try {
    const { authorizer, connectionId } = event.requestContext;
    const { userId, userName, userAgent, authorizedAt } = authorizer;

    // Put connection
    await dynamoDbClient.put({
        TableName: process.env.CONNECTIONS_TABLE_NAME,
        Item: {
          connectionId,
          userId,
          authorizedAt,
          connectedAt: (new Date()).toISOString(),
          userName,
          userAgent
        }
      })
      .promise();

  } catch (e) {
    logger.error(`Couldn't put connection in db`);
    logger.error(e);
    return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(e) };
  }

  logger.info(`exit: onConnectHandler`);

  return { statusCode: 200, body: 'Connected.' };
}
