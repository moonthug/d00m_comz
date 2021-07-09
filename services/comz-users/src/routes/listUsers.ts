import { APIGatewayEvent, Context } from 'aws-lambda';

import { createDynamoDbClientForLambda, DynamoDbClient } from '@d00m/dynamo-db';
import { ListUsersResponse, UsersRequest } from '@d00m/dto';
import { createLogger } from '@d00m/logger';

import { LOG_LEVEL } from '../constants/log';
import { ApiGatewayManagementApi } from 'aws-sdk';


export async function listUsers(
  request: UsersRequest,
  dynamoDbClient: DynamoDbClient,
  event: APIGatewayEvent,
  context?: Context
) {
  const logger = createLogger('listUsers', LOG_LEVEL);
  logger.info(`enter: listUsers`);

  const { CONNECTIONS_TABLE_NAME } = process.env;
  const { connectionId } = event.requestContext;

  // Fetch all users
  let usersResult;
  try {
    usersResult = await dynamoDbClient.scan(
      {
        TableName: CONNECTIONS_TABLE_NAME,
        ProjectionExpression: 'connectionId,userId,userName,connectedAt'
      }).promise();
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  // Build response
  const response: ListUsersResponse = {
    success: true,
    data: {
      users: usersResult.Items.map(user => {
        const { connectionId, userId, userName, connectedAt } = user;
        return {
          connectionId,
          userId,
          userName,
          connectedAt
        }
      })
    }
  }

  // Create API Gateway Manager
  const apigwManagementApi = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
  });

  // Send response to callee
  try {
    logger.info(`Post to connection ${connectionId}`);

    await apigwManagementApi
      .postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(response) })
      .promise();
  } catch (e) {
    if (e.statusCode === 410) {
      logger.info(`Found stale connection, deleting ${connectionId}`);
      await dynamoDbClient.delete({ TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId } }).promise();
    } else {
      logger.error(`Couldn't post to connection ${connectionId}`);
      logger.error(e);
      throw e;
    }
  }

  logger.info(`exit: listUsers`);
}
