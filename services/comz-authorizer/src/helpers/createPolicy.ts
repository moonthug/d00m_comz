import { APIGatewayAuthorizerWithContextResult } from 'aws-lambda';

import { D00mAuthorizerContext } from '@d00m/dto';

export function createPolicy (
  principalId: string,
  effect: string,
  resource: string,
  context?: D00mAuthorizerContext
): APIGatewayAuthorizerWithContextResult<D00mAuthorizerContext> {
  const authResponse: APIGatewayAuthorizerWithContextResult<D00mAuthorizerContext> = {
      principalId: undefined,
      policyDocument: undefined,
      context: undefined,
    };

  authResponse.principalId = principalId;

  if (effect && resource) {
    authResponse.policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    }
  }
  
  if (context) {
    authResponse.context = context
  }
  
  return authResponse;
}
