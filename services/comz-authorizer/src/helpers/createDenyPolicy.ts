import { APIGatewayAuthorizerWithContextResult } from 'aws-lambda';

import { D00mAuthorizerContext } from '@d00m/dto';

import { createPolicy } from './createPolicy';

export function createDenyPolicy (
  principalId: string,
  resource: string
): APIGatewayAuthorizerWithContextResult<D00mAuthorizerContext> {
  return createPolicy(principalId, 'Deny', resource);
}
