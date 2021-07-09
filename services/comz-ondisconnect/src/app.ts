import { APIGatewayEvent, Context } from 'aws-lambda';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';

import { LOG_LEVEL } from './constants/log';


let dynamoDbClient: DynamoDbClient;

export async function onDisconnectHandler(
  event: APIGatewayEvent,
  context?: Context
): Promise<any> {
  const logger = createLogger('onDisconnectHandler', LOG_LEVEL);
  logger.info(`enter: onDisconnectHandler`);

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

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

  logger.info(`exit: onDisconnectHandler`);

  return { statusCode: 200, body: 'Disconnected.' };
}
