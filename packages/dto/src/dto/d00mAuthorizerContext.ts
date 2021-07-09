import { APIGatewayAuthorizerResultContext } from 'aws-lambda';

export interface D00mAuthorizerContextUser {
  userId: string;
  userName: string;
}

export interface D00mAuthorizerContext extends APIGatewayAuthorizerResultContext, D00mAuthorizerContextUser {
  authorizedAt: string;
  userAgent: string;
}
