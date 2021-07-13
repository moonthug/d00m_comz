export { DocumentClient } from 'aws-sdk/clients/dynamodb';

export { createDynamoDb, DynamoDbClient } from './db';
export { createDynamoDbClientForLambda } from './helpers/createDynamoDbClientForLambda';
