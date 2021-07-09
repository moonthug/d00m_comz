import { APIGatewayEvent, Context } from 'aws-lambda';

import { createLogger } from '@d00m/logger';
import { UsersCommand, UsersRequest } from '@d00m/dto';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';

import { LOG_LEVEL } from './constants/log';
import { listUsers } from './routes/listUsers';


let dynamoDbClient: DynamoDbClient;

export async function usersHandler(
  event: APIGatewayEvent,
  context?: Context
): Promise<any> {
  const logger = createLogger('usersHandler', LOG_LEVEL);
  logger.info(`enter: usersHandler`);

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  const usersRequest = JSON.parse(event.body) as UsersRequest;

  if (usersRequest.command === UsersCommand.LIST) {
    await listUsers(usersRequest, dynamoDbClient, event, context);
  }

  logger.info(`exit: usersHandler`);

  return { statusCode: 200, body: 'Success.' };
}
