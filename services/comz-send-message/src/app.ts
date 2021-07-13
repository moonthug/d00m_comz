import { APIGatewayEvent, Context } from 'aws-lambda';
import { ApiGatewayManagementApi } from 'aws-sdk';

import { createLogger } from '@d00m/logger';
import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { D00mAuthorizerContext, Event, MessageEvent, SendMessageActionRequest } from '@d00m/dto';
import { Connection, ConnectionsTable, MessagesTable } from '@d00m/models';

import { LOG_LEVEL } from './constants/log';


let dynamoDbClient: DynamoDbClient;

export async function sendMessageHandler(
  event: APIGatewayEvent,
  context?: Context
): Promise<any> {
  const logger = createLogger('sendMessageHandler', LOG_LEVEL);
  logger.info(`enter: sendMessageHandler`);

  const { CONNECTIONS_TABLE_NAME, MESSAGES_TABLE_NAME } = process.env;
  const { userId } = event.requestContext.authorizer as D00mAuthorizerContext;
  const { connectionId } = event.requestContext;

  context.callbackWaitsForEmptyEventLoop = false;

  // Connect & cache DB
  dynamoDbClient = await createDynamoDbClientForLambda(dynamoDbClient);

  // Parse Body
  const request = JSON.parse(event.body) as SendMessageActionRequest;
  const { message } = request.data;

  // Fetch All connections
  let connections;
  try {
    connections = await ConnectionsTable.scan(dynamoDbClient, CONNECTIONS_TABLE_NAME);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  logger.info(`Post to ${connections.length} connections`);
  logger.debug(request.data);

  // Api Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  // Put message
  await MessagesTable.create(dynamoDbClient, MESSAGES_TABLE_NAME, {
    fromUserId: userId,
    fromConnectionId: connectionId,
    message,
  });

  // Send events to each live connection
  const postCalls = connections.map(async (connection: Connection) => {
    if (connection.userId === userId) {
      logger.info(`Skipping post to self ${connection.connectionId} [@${connection.userId}]`);
      return Promise.resolve();
    }

    try {
      logger.info(`Post to connection ${connection.connectionId} [@${connection.userId}]`);

      const messageEvent: MessageEvent = {
        event: Event.MESSAGE,
        data: {
          message
        }
      }

      // Send event
      await apigwManagementApi
        .postToConnection({ ConnectionId: connection.connectionId, Data: JSON.stringify(messageEvent) })
        .promise();

    } catch (e) {
      if (e.statusCode === 410) {
        logger.info(`Found stale connection, deleting ${connection.connectionId} [@${connection.userId}]`);
        await dynamoDbClient.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId: connection.connectionId } }).promise();
      } else {
        logger.error(`Couldn't post to connection ${connection.connectionId} [@${connection.userId}]`);
        logger.error(e);
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  logger.info(`exit: sendMessageHandler`);

  return { statusCode: 200, body: 'Success.' };
}
