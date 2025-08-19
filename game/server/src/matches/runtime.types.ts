import { Team } from '../common/types';

export interface RuntimeNode {
  nodeId: number;
  owner: Team | null;
  garrison: number;
  prodPerSec: number;
}

export interface Convoy {
  id: string;
  team: Team;
  fromNodeId: number;
  toNodeId: number;
  total: number;
  departAt: number;
  arriveAt: number;
}

export interface MatchRuntime {
  matchId: string;
  blueprintId: number;
  status: 'WAITING' | 'RUNNING' | 'FINISHED';
  nodes: Map<number, RuntimeNode>;
  convoys: Map<string, Convoy>;
  edges: Array<{ from: number; to: number; distance: number }>;
  nodeKinds: Map<number, string>;
  lastBroadcastAt: number;
  lastTickAt: number;
  lastSendByUser: Map<string, number>;
  teams: { A?: string; B?: string };
  startedAt: number;
  endsAt: number;
  domination: { leader: Team | null; sinceMs: number | null };
  winner?: Team;
  reason?: 'BASE_CAPTURE' | 'DOMINATION' | 'TIMEOUT';
  tickHandle?: NodeJS.Timeout;
  broadcastHandle?: NodeJS.Timeout;
}
