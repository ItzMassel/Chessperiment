# Custom Board Flow - Play Against Friends

```mermaid
sequenceDiagram
    participant W as White (Creator)
    participant S as Server
    participant B as Black (Opponent)

    Note over W: In Editor (PlayBoard)
    W->>S: create_room { roomId, customData (Project) }
    S->>S: Create Game(customData)
    S-->>W: room_created { roomId, isCustom: true }

    Note over B: Enters code in Lobby
    B->>B: Navigate to /game/[roomId]
    Note over B: page.tsx renders BoardRouter
    B->>S: join_room { roomId }

    S-->>B: joined_room { isCustom: true, customData }
    Note over B: BoardRouter detects isCustom
    B->>B: Render PlayBoard(customData)

    Note over B: PlayBoard initializes custom engine
    B->>S: register_player
    S-->>B: rejoin_game { customData, history, turn }

    Note over W,B: Both players now use PlayBoard
    W->>S: move { from, to }
    S->>S: Validate on Server Engine
    S-->>B: move { from, to }
    B->>B: Apply move to local BoardClass
```

## Proposed Changes

### 1. Create `BoardRouter` Component

Create a wrapper that joins the room first, checks `isCustom`, and then mounts either `Board` or `PlayBoard`.

### 2. Update `game/[roomId]/page.tsx`

Replace the direct `Board` import with the new `BoardRouter`.

### 3. Refine `PlayBoard.tsx`

Ensure it can initialize correctly when _only_ `roomId` is provided (fetching data from the socket).

### 4. Server Fixes

Ensure `joined_room` and `rejoin_game` reliably pass `customData` and that the server-side engine is used for validation of custom moves.
