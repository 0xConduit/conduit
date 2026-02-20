import { getDb } from "../db/connection.js";
import type { ActivityEvent } from "../shared/types.js";

function rowToEvent(row: Record<string, unknown>): ActivityEvent {
  return {
    id: row.id as string,
    timestamp: row.timestamp as number,
    message: row.message as string,
    type: row.type as ActivityEvent["type"],
    connectionId: (row.connection_id as string) || undefined,
    taskId: (row.task_id as string) || undefined,
  };
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function recordActivity(params: {
  message: string;
  type: ActivityEvent["type"];
  connectionId?: string;
  taskId?: string;
}): ActivityEvent {
  const db = getDb();
  const id = `evt-${generateId()}`;
  const timestamp = Date.now();

  db.prepare(
    "INSERT INTO activity_events (id, timestamp, message, type, connection_id, task_id) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, timestamp, params.message, params.type, params.connectionId ?? null, params.taskId ?? null);

  return { id, timestamp, message: params.message, type: params.type, connectionId: params.connectionId, taskId: params.taskId };
}

export function listActivity(limit: number = 50): ActivityEvent[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM activity_events ORDER BY timestamp DESC LIMIT ?").all(limit) as Record<string, unknown>[];
  return rows.map(rowToEvent);
}
