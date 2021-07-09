import { APIGatewayAuthorizerWithContextResult } from 'aws-lambda';

import { D00mAuthorizerContext } from '@d00m/dto';

import { createPolicy } from './createPolicy';

export function createAllowPolicy (
  principalId: string,
  resource: string,
  context: D00mAuthorizerContext
): APIGatewayAuthorizerWithContextResult<D00mAuthorizerContext> {
  return createPolicy(principalId, 'Allow', resource, context);
}
