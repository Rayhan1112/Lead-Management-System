import { push, ref } from 'firebase/database';
import { database } from './firebase'; // adjust the path to your Firebase setup

export const logAgentAction = async ({
  adminId,
  agentId,
  action,
  entityType, // 'lead', 'task', etc.
  entityId = null
}: {
  adminId: string;
  agentId: string;
  action: string;
  entityType: 'lead' | 'task' | 'meeting' | 'deal' | 'dashboard';
  entityId?: string | null;
}) => {
  const timestamp = new Date().toISOString();
  const logRef = ref(database, `users/${adminId}/agents/${agentId}/auditLogs`);
  await push(logRef, {
    action,
    entityType,
    entityId,
    timestamp
  });
};
