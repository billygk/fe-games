const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    // Physics is handled by the server, so we don't need it on the client.
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Game objects
let player1, player2, ball;
let cursors;
let scoreText;
let connectingText;

// Multiplayer state
let myPlayerKey = null; // Will be 'player1' or 'player2'
let ws;

function preload() {
    // In a real game, you'd load assets here.
    // For this example, we're using simple shapes.
}

function create() {    
    // Create visual representations of game objects.
    // Their positions will be set by the server's 'game-state' messages.
    player1 = this.add.rectangle(30, 300, 20, 100, 0xffffff);
    player2 = this.add.rectangle(770, 300, 20, 100, 0xffffff);
    ball = this.add.rectangle(400, 300, 20, 20, 0xffffff);

    // Score
    scoreText = this.add.text(350, 20, '0 - 0', { fontSize: '48px', fill: '#fff' });
    connectingText = this.add.text(250, 250, 'Connecting to server...', { fontSize: '24px', fill: '#fff' });

    // Input
    cursors = this.input.keyboard.createCursorKeys();

    // --- WebSocket Connection ---
    // This is the address of the backend server we will build later.
    ws = new WebSocket('ws://localhost:8080/pong');

    ws.onopen = () => {
        console.log('Connected to the server.');
        connectingText.destroy();
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'player-assignment':
                myPlayerKey = data.player;
                console.log(`You are ${myPlayerKey}`);
                // Highlight the player's paddle
                if (myPlayerKey === 'player1') {
                    player1.setFillStyle(0x00ff00); // Green
                } else {
                    player2.setFillStyle(0x00ff00); // Green
                }
                break;

            case 'game-state':
                // Update all game object positions and score based on server data
                player1.y = data.player1.y;
                player2.y = data.player2.y;
                ball.x = data.ball.x;
                ball.y = data.ball.y;
                scoreText.setText(`${data.score.player1} - ${data.score.player2}`);
                break;
        }
    };

    ws.onclose = () => {
        console.log('Disconnected from the server.');
        if (!this.scene.isSleeping()) {
            this.add.text(220, 250, 'Disconnected. Please refresh.', { fontSize: '24px', fill: '#fff' });
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        if (!this.scene.isSleeping()) {
            this.add.text(180, 250, 'Could not connect to server.', { fontSize: '24px', fill: '#fff' });
        }
        connectingText.destroy();
    };
}

function update() {
    // We only send input if we have a WebSocket connection and have been assigned a player.
    if (!ws || ws.readyState !== WebSocket.OPEN || !myPlayerKey) {
        return;
    }

    const myPaddle = (myPlayerKey === 'player1') ? player1 : player2;
    let moved = false;

    // For a smoother experience, we can apply movement locally first (client-side prediction)
    // and then send the new state. The server's 'game-state' will ultimately be the source of truth.
    if (cursors.up.isDown && myPaddle.y > myPaddle.height / 2) {
        myPaddle.y -= 5;
        moved = true;
    }
    if (cursors.down.isDown && myPaddle.y < config.height - myPaddle.height / 2) {
        myPaddle.y += 5;
        moved = true;
    }

    // Only send a message if the paddle has actually moved
    if (moved) {
        sendPlayerMove(myPaddle.y);
    }
}

/**
 * Sends the player's paddle position to the server.
 * @param {number} y The new y-coordinate of the paddle.
 */
function sendPlayerMove(y) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = {
            type: 'player-move',
            payload: {y: y}
        };
        ws.send(JSON.stringify(message));
    }
}