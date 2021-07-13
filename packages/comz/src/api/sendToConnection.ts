import { ApiGatewayManagementApi } from 'aws-sdk';

import { ActionResponse, Event } from '@d00m/dto';

export async function sendToConnection(
  connectionId: string,
  apigwManagementApi: ApiGatewayManagementApi,
  payload: Event | ActionResponse,
): Promise<any> {
  // Send event
  return apigwManagementApi
    .postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(payload) })
    .promise();

}
