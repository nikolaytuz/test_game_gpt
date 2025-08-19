export type Team = 'A' | 'B';
export type NodeKind = 'BASE' | 'RESOURCE' | 'DEFENSE' | 'ARMY' | 'SPECIAL';

export interface MapNode { id: number; kind: NodeKind; x: number; y: number; }
export interface MapEdge { from: number; to: number; distance: number; }
export interface MatchPlayer { userId: string; nickname: string; team: Team; }
export interface NodeState { nodeId: number; owner: Team | null; garrison: number; }
export interface TimerInfo { startedAt: number; endsAt: number; }
export interface ControlInfo { a: number; b: number; total: number; }
export interface DominationInfo { leader: Team | null; sinceMs: number | null; }
export interface MatchState {
  matchId: string;
  players: MatchPlayer[];
  map: { blueprintId: number; nodes: MapNode[]; edges: MapEdge[] };
  nodesState: NodeState[];
  timer?: TimerInfo;
  control?: ControlInfo;
  domination?: DominationInfo;
  winner?: Team;
  reason?: 'BASE_CAPTURE' | 'DOMINATION' | 'TIMEOUT';
}
