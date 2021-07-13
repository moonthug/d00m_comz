import { createDynamoDb, DynamoDbClient } from '../db';

export async function createDynamoDbClientForLambda(client: DynamoDbClient): Promise<DynamoDbClient> {
  if (client) return client;

  client = await createDynamoDb({}, {
    endpoint: process.env.AWS_SAM_LOCAL
      ? 'http://host.docker.internal:4566'
      : undefined
  });

  return client;
}
