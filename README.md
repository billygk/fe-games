# fe-games

multiple games in one repository
each game in a separated branch

## Pong game

- branch: [fe|be]-pong

- description: A simple Pong game implemented in JavaScript using Phaser.js. It has a user-controlled paddle and an AI-controlled opponent paddle. The game keeps track of the score and displays it on the screen.

Our goal is to implement a multiplayer version of the game using WebSockets, so that two players can play against each other in real-time through a web browser.

### Project Structure

The project consists of the following files:

* `index.html`: The main entry point of the game, which loads the Phaser library and the game script.
* `scr/main.js`: The main game script, which sets up the game configuration, creates the game objects, and handles user input and WebSocket communication.
* `scr/constants.js`: A file containing game constants, such as API base URL, maximum users, and feature flags.
* `scr/scenes/TitleScreen.js`: A scene file that displays the title screen of the game.

### Client-to-Server Messages

The client sends the following messages to the server:

* `player-move`: Sent when the player moves their paddle.
```json
{
  "type": "player-move",
  "payload": {
    "y": 450
  }
}
```

### Server-to-Client Messages

The server sends the following messages to the client:

``player-assignment``: Sent once upon connection to tell the client which paddle it controls (player1 or player2).

```json
{
  "type": "player-assignment",
  "player": "player1",
  "settings": {
    "paddleSpeed": 5,
    "gameWidth": 800,
    "gameHeight": 600,
    "paddleHeight": 100,
    "paddleWidth": 15,
    "ballSize": 10,
    "ballInitialSpeed": 5,
    "ballSpeedIncreaseFactor": 1.1,
    "initialPlayer1": {
      "x": 50,
      "y": 250
    },
    "initialPlayer2": {
      "x": 750,
      "y": 250
    },
    "initialBall": {
      "x": 400,
      "y": 300
    }
  }
}
```

``game-state``: Sent continuously from the server to all clients. This is the single source of truth for the game's state.

```json
{
  "type": "game-state",
  "ball": {
    "x": 400,
    "y": 300
  },
  "player1": {
    "x": 50,
    "y": 250
  },
  "player2": {
    "x": 750,
    "y": 250
  },
  "score": {
    "player1": 0,
    "player2": 1
  }
}
```