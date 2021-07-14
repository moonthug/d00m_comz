import { APIGatewayEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { D00mAuthorizerContext, EventType, MessageEvent, SendMessageActionRequest } from '@d00m/dto';
import { MessagesTable } from '@d00m/models';

import { LOG_LEVEL } from './constants/log';
import { sendToAll } from '@d00m/comz';


let dynamoDbClient: DynamoDbClient;

export async function sendMessageHandler(
  event: APIGatewayEvent,
  context?: Context
): Promise<any> {
  const logger = createLogger('sendMessageHandler', LOG_LEVEL);
  logger.info(`enter: sendMessageHandler`);

  const { CONNECTIONS_TABLE_NAME, MONOLITH_TABLE_NAME } = process.env;
  const { userId, userName } = event.requestContext.authorizer as D00mAuthorizerContext;
  const { connectionId } = event.requestContext;

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  // Api Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  // Parse Body
  const request = JSON.parse(event.body) as SendMessageActionRequest;
  const { message } = request.data;

  // Put message
  await MessagesTable.create(dynamoDbClient, MONOLITH_TABLE_NAME, {
    fromUserId: userId,
    fromUserName: userName,
    fromConnectionId: connectionId,
    message,
  });

  const messageEvent: MessageEvent = {
    event: EventType.MESSAGE,
    data: {
      fromUserId: userId,
      fromUserName: userName,
      createdAt: new Date(),
      message
    }
  }

  await sendToAll(
    dynamoDbClient,
    CONNECTIONS_TABLE_NAME,
    apigwManagementApi,
    messageEvent
  );

  logger.info(`exit: sendMessageHandler`);

  return { statusCode: 200, body: 'Success.' };
}
