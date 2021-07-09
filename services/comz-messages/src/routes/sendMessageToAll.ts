import { ApiGatewayManagementApi } from 'aws-sdk';
import { APIGatewayEvent, Context } from 'aws-lambda';

import { createLogger } from '@d00m/logger';
import { D00mAuthorizerContext, SendMessageToAllRequest } from '@d00m/dto';
import { DynamoDbClient } from '@d00m/dynamo-db';

import { LOG_LEVEL } from '../constants/log';

interface ConnectionItem {
  connectionId: string;
  userId: string;
}

export async function sendMessageToAll(
  request: SendMessageToAllRequest,
  dynamoDbClient: DynamoDbClient,
  event: APIGatewayEvent,
  context?: Context
) {
  const logger = createLogger('sendMessageToAll', LOG_LEVEL);
  logger.info(`enter: sendMessageToAll`);

  const { CONNECTIONS_TABLE_NAME, MESSAGES_TABLE_NAME } = process.env;
  const { userId } = event.requestContext.authorizer as D00mAuthorizerContext;
  const { message } = request.data;
  const { connectionId } = event.requestContext;

  // Fetch All connections
  let connectionResults;
  try {
    connectionResults = await dynamoDbClient.scan(
      {
        TableName: CONNECTIONS_TABLE_NAME,
        ProjectionExpression: 'connectionId,userId',
      }).promise();
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  const postData = JSON.parse(event.body);
  logger.info(`Post to ${connectionResults.Items.length} connections`);
  logger.info(postData);

  // Api Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  const postCalls = connectionResults.Items.map(async (connection: ConnectionItem) => {
    if (connection.userId === userId) {
      logger.info(`Skipping post to self ${ connection.connectionId } [@${ connection.userId }]`);
      return Promise.resolve();
    }

    try {
      logger.info(`Post to connection ${ connection.connectionId } [@${ connection.userId }]`);

      // Put message
      await dynamoDbClient
        .put({
          TableName: MESSAGES_TABLE_NAME,
          Item: {
            toUserId: connection.userId,
            createdAt: (new Date()).toISOString(),

            toConnectionId: connection.connectionId,
            fromUserId: userId,
            fromConnectionId: connectionId,
            message,
          }
        })
        .promise();

      const postMessage = {
        action: request.action,
        command: request.command,
        data: request.data
      }

      // Forward request to client
      await apigwManagementApi
        .postToConnection({ ConnectionId: connection.connectionId, Data: JSON.stringify(postMessage) })
        .promise();

    } catch (e) {
      if (e.statusCode === 410) {
        logger.info(`Found stale connection, deleting ${ connection.connectionId } [@${ connection.userId }]`);
        await dynamoDbClient.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId: connection.connectionId } }).promise();
      } else {
        logger.error(`Couldn't post to connection ${ connection.connectionId } [@${ connection.userId }]`);
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

  logger.info(`exit: sendMessageToAll`);

  return { statusCode: 200, body: 'Success.' };
}
