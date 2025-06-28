# fe-games

multiple games in one repository
each game in a separated branch

## Pong game

- branch: [fe|be]-pong

- description: A simple Pong game implemented in JavaScript using Phaser.js. I has a user controlled paddle and an AI-controlled opponent paddle. The game keeps track of the score and displays it on the screen. 

Our goal is to implement a multiplayer version of the game using WebSockets, so that two players can play against each other in real-time through a web browser. 

npm run 

We will break down the implementation into several steps:
1. Review the existing Pong game code to understand its structure and functionality.
2. Prepare the current game for multiplayer by identifying the components that need to be modified or added.
3. Document how we would implement the multiplayer functionality using WebSockets. This will include WebSocket details, events, data structures used, and any necessary changes to the game logic. Using this document as a guide to build the backend server implementation.
4. Implement the backend server using Kotlin / Spring Boot to handle WebSocket connections and game state management.

### Client-to-Server Messages:
- player-move: Sent when the player moves their paddle.
```
{
  "type": "player-move",
  "y": 450
}
```

### Server-to-Client Messages
- player-assignment: Sent once upon connection to tell the client which paddle it controls (player1 or player2).

```
{
  "type": "player-assignment",
  "player": "player1"
}
```

- **game-state**: Sent continuously from the server to all clients. This is the single source of truth for the game's state

```
{
  "type": "game-state",
  "ball": { "x": 400, "y": 300 },
  "player1": { "y": 250 },
  "player2": { "y": 350 },
  "score": { "player1": 0, "player2": 1 }
}
```

