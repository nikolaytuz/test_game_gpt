export type Team = 'A' | 'B';
export type NodeKind = 'BASE' | 'RESOURCE' | 'DEFENSE' | 'ARMY' | 'SPECIAL';

export interface MapNode { id: number; kind: NodeKind; x: number; y: number; }
export interface MapEdge { from: number; to: number; distance: number; }
export interface MatchPlayer { userId: string; nickname: string; team: Team; }
export interface NodeState { nodeId: number; owner: Team | null; garrison: number; }
export interface MatchState {
  matchId: string;
  players: MatchPlayer[];
  map: { blueprintId: number; nodes: MapNode[]; edges: MapEdge[] };
  nodesState: NodeState[];
}

export interface BroadcastState {
  now: number;
  nodesState: { nodeId: number; owner: Team | null; garrison: number }[];
  convoys: { id: string; team: Team; from: number; to: number; total: number; departAt: number; arriveAt: number }[];
}

export interface SendTroopsPayload {
  matchId: string;
  fromNodeId: number;
  toNodeId: number;
  percent: 25 | 50 | 100;
}
