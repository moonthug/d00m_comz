import { DynamoDB } from 'aws-sdk';
import { createLogger, Logger } from '@d00m/logger';

export type DynamoDbClient = DynamoDB.DocumentClient;

type ClientOptions = DynamoDB.DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration;

interface CreateDynamoDbOptions {
  logLevel?: string;
  logger?: Logger;
}

export function createDynamoDb(options?: CreateDynamoDbOptions, clientOptions?: ClientOptions): DynamoDB.DocumentClient {
  const logger = options.logger ?? createLogger('dynamo-db', options.logLevel ?? 'error');

  if (clientOptions.endpoint) {
    logger.info(`Endpoint set, Connecting to ${clientOptions.endpoint}`);
  }

  return new DynamoDB.DocumentClient(clientOptions);
}
