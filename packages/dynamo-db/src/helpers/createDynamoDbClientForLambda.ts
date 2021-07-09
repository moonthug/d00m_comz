import { createDynamoDb, DynamoDbClient } from '../db';

export async function createDynamoDbClientForLambda(client: DynamoDbClient): Promise<DynamoDbClient> {
  if (client) return client;

  client = await createDynamoDb({}, {
    endpoint: process.env.AWS_SAM_LOCAL
      ? 'http://:8000'
      : undefined
  });

  return client;
}
