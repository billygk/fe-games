# Pong Multiplayer WebSocket Protocol

This document outlines the WebSocket communication protocol for the multiplayer Pong game.

## 1. Server Endpoint

The WebSocket server will listen on an endpoint yet to be defined (e.g., `ws://your-server-address:port/pong`). For local development, this might be `ws://localhost:8080/pong`.

## 2. General Message Format

All messages exchanged between client and server will be in JSON format. Each message will have a `type` field indicating the kind of message, and a `payload` field containing the data specific to that message type.

Example:
```json
{
  "type": "MESSAGE_TYPE",
  "payload": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

## 3. Client-to-Server (C2S) Messages

### 3.1. `PLAYER_MOVE`
- **Description:** Sent when the player moves their paddle.
- **Payload:**
    - `y`: (Number) The new Y-coordinate of the center of the player's paddle.
- **Example:**
  ```json
  {
    "type": "PLAYER_MOVE",
    "payload": {
      "y": 250.5
    }
  }
  ```

## 4. Server-to-Client (S2C) Messages

### 4.1. `PLAYER_ASSIGNMENT`
- **Description:** Sent to a client immediately after a successful WebSocket connection. Assigns the player as 'left' or 'right'.
- **Payload:**
    - `playerRole`: (String) Either "left" or "right".
- **Example:**
  ```json
  {
    "type": "PLAYER_ASSIGNMENT",
    "payload": {
      "playerRole": "left"
    }
  }
  ```

### 4.2. `GAME_START`
- **Description:** Sent to both clients when two players are connected and the game is ready to begin.
- **Payload:** (Optional, could include initial ball position/velocity if decided by server at this moment)
    - `initialBallX`: (Number) Initial X position of the ball.
    - `initialBallY`: (Number) Initial Y position of the ball.
    - `initialBallVelocityX`: (Number) Initial X velocity of the ball.
    - `initialBallVelocityY`: (Number) Initial Y velocity of the ball.
- **Example:**
  ```json
  {
    "type": "GAME_START",
    "payload": {
      "initialBallX": 400,
      "initialBallY": 250,
      "initialBallVelocityX": 200,
      "initialBallVelocityY": 0
    }
  }
  ```

### 4.3. `GAME_STATE`
- **Description:** Periodically sent from the server to both clients to synchronize the game state.
- **Payload:**
    - `ball`: (Object) Contains ball's current state.
        - `x`: (Number) Ball's X-coordinate.
        - `y`: (Number) Ball's Y-coordinate.
        - `vx`: (Number) Ball's X-velocity.
        - `vy`: (Number) Ball's Y-velocity.
    - `paddles`: (Object) Contains positions of both paddles.
        - `left`: (Number) Y-coordinate of the left paddle.
        - `right`: (Number) Y-coordinate of the right paddle.
- **Example:**
  ```json
  {
    "type": "GAME_STATE",
    "payload": {
      "ball": {
        "x": 350.2,
        "y": 190.7,
        "vx": 250,
        "vy": -150
      },
      "paddles": {
        "left": 200,
        "right": 300
      }
    }
  }
  ```

### 4.4. `SCORE_UPDATE`
- **Description:** Sent whenever a player scores.
- **Payload:**
    - `scoreLeft`: (Number) Current score of the left player.
    - `scoreRight`: (Number) Current score of the right player.
- **Example:**
  ```json
  {
    "type": "SCORE_UPDATE",
    "payload": {
      "scoreLeft": 1,
      "scoreRight": 0
    }
  }
  ```

### 4.5. `RESET_BALL`
- **Description:** Sent by the server after a score to inform clients of the ball's new position and velocity.
- **Payload:**
    - `x`: (Number) New X-coordinate of the ball.
    - `y`: (Number) New Y-coordinate of the ball.
    - `velocityX`: (Number) New X-velocity of the ball.
    - `velocityY`: (Number) New Y-velocity of the ball.
- **Example:**
  ```json
  {
    "type": "RESET_BALL",
    "payload": {
      "x": 400,
      "y": 250,
      "velocityX": -200,
      "velocityY": 50
    }
  }
  ```

### 4.6. `OPPONENT_DISCONNECTED`
- **Description:** Sent to a client if their opponent disconnects.
- **Payload:** (None, or could include a message)
    - `message`: (String, Optional) e.g., "Your opponent has disconnected."
- **Example:**
  ```json
  {
    "type": "OPPONENT_DISCONNECTED",
    "payload": {
      "message": "Your opponent has disconnected. Game Over."
    }
  }
  ```

## 5. Client-Side Game Logic Integration (`scr/scenes/Game.js`)

The client-side game needs to implement WebSocket handling:

1.  **Establish Connection:** On game/app initialization (likely before or on the `TitleScreen`), establish a WebSocket connection to the server.
2.  **Message Sending:**
    -   When the local player moves their paddle (e.g., in the `update()` loop based on `this.cursors`), send a `PLAYER_MOVE` message to the server.
3.  **Message Receiving:** Implement a listener for messages from the WebSocket server. A `switch` statement based on `message.type` can be used to handle different messages:
    -   **`PLAYER_ASSIGNMENT`**: Store the assigned role (e.g., `this.playerRole = payload.playerRole`). This will determine which paddle the player controls and how input is handled. If `playerRole` is "right", the cursor key logic should control `this.rectangleRight` and send its position. The game should prevent a player from controlling the opponent's paddle.
    -   **`GAME_START`**: Potentially use `payload.initialBallX`, etc., to set the initial ball state using `this.setBallData()` and `this.resetBall()`.
    -   **`GAME_STATE`**:
        -   Update the ball's position and velocity using `this.setBallData(payload.ball.x, payload.ball.y, payload.ball.vx, payload.ball.vy)`.
        -   Update the local player's paddle based on their input.
        -   Update the opponent's paddle position. If `this.playerRole` is "left", update the right paddle using `this.setRightPaddleY(payload.paddles.right)`. If `this.playerRole` is "right", update the left paddle using a similar method (e.g., `setLeftPaddleY(payload.paddles.left)`, which would need to be created).
    -   **`SCORE_UPDATE`**: Update the scores using `this.setScores(payload.scoreLeft, payload.scoreRight)`.
    -   **`RESET_BALL`**: Call `this.resetBall(payload.x, payload.y, payload.velocityX, payload.velocityY)` to reset the ball based on server instructions.
    -   **`OPPONENT_DISCONNECTED`**: Display a message to the player and potentially end the game or return to a title screen.
4.  **Paddle Control Logic:**
    -   The `update()` method in `Game.js` will need to be modified:
        -   It should only process local player input (based on `this.playerRole`).
        -   It should send `PLAYER_MOVE` messages for the local player's paddle.
        -   The AI for `rectangleRight` is already removed. The opponent paddle's position will be set by the `GAME_STATE` message.
    -   A new method `setLeftPaddleY(y_position)` might be needed, similar to `setRightPaddleY(y_position)`, for when the player is assigned the "right" paddle and the server sends updates for the "left" paddle.

## 6. Server-Side Considerations (Brief)

(This section is for context, as server implementation is a separate task)
- The server will maintain the authoritative game state.
- It will receive `PLAYER_MOVE` messages and update the respective player's paddle position.
- It will run a game loop to update ball physics, check for collisions with paddles and walls, and detect scoring.
- On scoring, it will update scores, send `SCORE_UPDATE`, and then `RESET_BALL`.
- It will broadcast `GAME_STATE` to both clients at a regular interval (e.g., 60 times per second).
- It will handle player connections and disconnections.

## 7. Game Initialization and Scene Flow (Client-Side Conceptual)

This section outlines how the client-side game initialization and scene transitions would be adapted for multiplayer.

1.  **`scr/main.js` or `scr/scenes/TitleScreen.js` Modifications:**
    *   **WebSocket Connection:**
        *   The primary WebSocket connection should be initiated from `scr/main.js` globally or, more likely, within the `TitleScreen` scene when the player indicates they want to play a multiplayer game (e.g., by clicking a "Play Multiplayer" button).
        *   A global WebSocket instance could be created and managed (e.g., `game.webSocket = new WebSocket(...)`).
        *   Event listeners for `onopen`, `onmessage`, `onerror`, and `onclose` for the WebSocket connection should be set up early.
    *   **`TitleScreen` Scene (`scr/scenes/TitleScreen.js`):**
        *   Would need UI elements like "Play Multiplayer" and "Connecting..." status text.
        *   On "Play Multiplayer" click:
            *   Attempt to establish the WebSocket connection if not already trying.
            *   Display "Connecting to server..." or similar status.
            *   On successful connection (`onopen`), the client might send an initial message if required by the server (e.g., a simple "join" request, though often the server manages players just by connection).
            *   The client then waits for a `PLAYER_ASSIGNMENT` message and potentially a `GAME_START` message (or a "waiting for opponent" message).
    *   **Transition to `Game` Scene:**
        *   Once the WebSocket is open, the player is assigned a role, and the server signals that a game is ready (e.g., by sending `GAME_START`), the client should transition from the `TitleScreen` to the `Game` scene (`this.scene.start('circle', { webSocket: game.webSocket, playerRole: this.playerRoleFromAssignement })`).
        *   The `Game` scene would then receive the WebSocket instance and the player's role via its `init` or `create` method's data parameter.
2.  **Handling Connection Issues:**
    *   **Connection Error (`onerror`):**
        *   If the WebSocket connection fails to establish, display an error message on the `TitleScreen` (e.g., "Could not connect to server. Please try again later.").
        *   Provide a way to retry connecting.
    *   **Connection Close (`onclose`):**
        *   If the connection closes unexpectedly during gameplay (in `Game` scene):
            *   The game should pause or end.
            *   Display a message like "Connection lost. Returning to title screen."
            *   Transition back to the `TitleScreen`.
        *   If the `OPPONENT_DISCONNECTED` message is received (which might also trigger `onclose` or be handled separately):
            *   Display the appropriate message.
            *   Transition back to the `TitleScreen` or offer to find a new game.
3.  **`Game` Scene (`scr/scenes/Game.js`) WebSocket Integration:**
    *   The `Game` scene will receive the active WebSocket instance passed from the `TitleScreen`.
    *   It will use this instance to send `PLAYER_MOVE` messages and handle incoming S2C messages as detailed in Section 5.
