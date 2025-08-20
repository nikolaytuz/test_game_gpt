# Game Mono Repo

Monorepo containing `server` (NestJS) and `client` (Vue 3). Provides guest login, lobby creation and joining with basic map display.

## Shared Structures

```
Team: 'A' | 'B'
NodeKind: 'BASE' | 'RESOURCE' | 'DEFENSE' | 'ARMY' | 'SPECIAL'

Map: {
  blueprintId: number,
  nodes: { id:number, kind:NodeKind, x:number, y:number }[],
  edges: { from:number, to:number, distance:number }[]
}

MatchState: {
  matchId: string,
  players: { userId:string, nickname:string, team:Team }[],
  map: Map,
  nodesState: { nodeId:number, owner:Team|null, garrison:number }[]
}
```
