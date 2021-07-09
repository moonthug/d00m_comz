import { APIGatewayEvent, Context } from 'aws-lambda';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { MessagesCommand, MessagesRequest, SendMessageToAllRequest } from '@d00m/dto';

import { LOG_LEVEL } from './constants/log';
import { sendMessageToAll } from './routes/sendMessageToAll';


let dynamoDbClient: DynamoDbClient;

export async function messagesHandler(
  event: APIGatewayEvent,
  context?: Context
): Promise<any> {
  const logger = createLogger('messagesHandler', LOG_LEVEL);
  logger.info(`enter: messagesHandler`);

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  const messagesRequest = JSON.parse(event.body) as MessagesRequest;

  if (messagesRequest.command === MessagesCommand.SEND_TO_ALL) {
    await sendMessageToAll(messagesRequest as SendMessageToAllRequest, dynamoDbClient, event, context);
  }

  logger.info(`exit: messagesHandler`);

  return { statusCode: 200, body: 'Success.' };
}
