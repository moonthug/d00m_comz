import { APIGatewayEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

import { createLogger } from '@d00m/logger';
import { ActionType, ChatHistoryResponse, D00mAuthorizerContext } from '@d00m/dto';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { MessagesTable } from '@d00m/models';
import { sendToConnection } from '@d00m/comz';

import { LOG_LEVEL } from './constants/log';


let dynamoDbClient: DynamoDbClient;

export async function chatHistoryHandler(
  event: APIGatewayEvent,
  context?: Context
): Promise<any> {
  const logger = createLogger('chatHistoryHandler', LOG_LEVEL);
  logger.info(`enter: chatHistoryHandler`);

  const { CONNECTIONS_TABLE_NAME, MONOLITH_TABLE_NAME } = process.env;
  const { connectionId } = event.requestContext;
  const { userId, userName, lastConnectedAt } = event.requestContext.authorizer as D00mAuthorizerContext;

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  // Create API Gateway Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  // Fetch all messages
  let messages;
  try {
    messages = await MessagesTable.getMessagesSinceDate(dynamoDbClient, MONOLITH_TABLE_NAME,
      new Date(lastConnectedAt),
      {
        limit: 50
      });
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  // Build response
  const response: ChatHistoryResponse = {
    action: ActionType.CHAT_HISTORY,
    success: true,
    data: {
      messages
    }
  }

  // Send response to callee
  try {
    logger.info(`Post to connection ${connectionId}`);

    await sendToConnection(
      dynamoDbClient,
      CONNECTIONS_TABLE_NAME,
      apigwManagementApi,
      connectionId,
      response
    );
  } catch (e) {
    logger.error(`Couldn't post to connection ${connectionId}`);
    logger.error(e);
    throw e;
  }

  logger.info(`exit: chatHistoryHandler`);

  return { statusCode: 200, body: 'Success.' };
}
