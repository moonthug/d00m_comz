import { ConnectionsTable } from '@d00m/models';
import { OnlineUser } from '@d00m/dto';
import { DynamoDbClient } from '@d00m/dynamo-db';

export async function fetchOnlineUsers(
  dynamoDbClient: DynamoDbClient,
  connectionsTableName: string
): Promise<OnlineUser[]> {
  // Scan for connections
  const connections = await ConnectionsTable.scan(dynamoDbClient, connectionsTableName);

  // Group Connections
  const users = connections.reduce((acc, connection) => {
    if (acc.has(connection.userId)) {
      const existing = acc.get(connection.userId);
      existing.connections.push(connection.id);
      acc.set(connection.userId, existing);
    } else {
      acc.set(connection.userId, {
        id: connection.userId,
        name: connection.userName,
        lastSeen: connection.authorizedAt,
        connections: [
          connection.id
        ]
      });
    }

    return acc;
  }, new Map<string, OnlineUser>());

  return Array.from(users.values());
}
