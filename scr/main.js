const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000000',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    // Client-side config is now minimal, server settings are the source of truth
    paddle: {
        speed: 5,
        width: 15,
        height: 100, 
    },
    ball: {
        size: 10,
    }
};

const game = new Phaser.Game(config);

// Game objects
let player1, player2, ball;
let cursors;
let scoreText;
let connectingText;

// Multiplayer state
let myPlayerKey = null;
let ws;

function preload() {}

function create() {    
    // Create visual representations. Positions and sizes will be set by the server.
    player1 = this.add.rectangle(0, 0, config.paddle.width, config.paddle.height, 0xffffff);
    player2 = this.add.rectangle(0, 0, config.paddle.width, config.paddle.height, 0xffffff);
    ball = this.add.rectangle(0, 0, config.ball.size, config.ball.size, 0xffffff);

    scoreText = this.add.text(350, 20, '0 - 0', { fontSize: '48px', fill: '#fff' });
    connectingText = this.add.text(250, 250, 'Connecting to server...', { fontSize: '24px', fill: '#fff' });

    cursors = this.input.keyboard.createCursorKeys();

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
                
                // Use settings from server to configure the client
                const settings = data.settings;
                config.paddle.speed = settings.paddleSpeed;
                config.paddle.width = settings.paddleWidth;
                config.paddle.height = settings.paddleHeight;
                config.ball.size = settings.ballSize;
                
                // Apply sizes
                player1.setSize(config.paddle.width, config.paddle.height);

                player2.setPosition(data.settings.initialPlayer2.x, data.settings.initialPlayer2.y);
                player2.setSize(config.paddle.width, config.paddle.height);
                
                ball.setPosition(data.settings.initialBall.x, data.settings.initialBall.y)
                ball.setSize(config.ball.size, config.ball.size);
                
                // Set initial positions. Phaser will use these for the center of the rectangle.
                // We need to adjust for this when receiving and sending data.
                player1.x = settings.initialPlayer1.x + config.paddle.width / 2;
                player1.y = settings.initialPlayer1.y + config.paddle.height / 2;
                player2.x = settings.initialPlayer2.x + config.paddle.width / 2;
                player2.y = settings.initialPlayer2.y + config.paddle.height / 2;
                ball.x = settings.initialBall.x + config.ball.size / 2;
                ball.y = settings.initialBall.y + config.ball.size / 2;


                if (myPlayerKey === 'player1') {
                    player1.setFillStyle(0x00ff00);
                } else {
                    player2.setFillStyle(0x00ff00);
                }                
                break;
            
            

            case 'game-state':
                // Adjust incoming top-left coords to center coords for rendering 
                player1.x = data.player1.x + config.paddle.width / 2;
                player1.y = data.player1.y + config.paddle.height / 2;
                player2.x = data.player2.x + config.paddle.width / 2;
                player2.y = data.player2.y + config.paddle.height / 2;
                ball.x = data.ball.x + config.ball.size / 2;
                ball.y = data.ball.y + config.ball.size / 2;
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
    if (!ws || ws.readyState !== WebSocket.OPEN || !myPlayerKey) {
        return;
    }

    const myPaddle = (myPlayerKey === 'player1') ? player1 : player2;
    let moved = false;

    // Boundary checks to use the paddle's center and height 
    if (cursors.up.isDown && myPaddle.y > (config.paddle.height / 2)) {
        myPaddle.y -= config.paddle.speed;
        moved = true;
    }
    if (cursors.down.isDown && myPaddle.y < (config.height - (config.paddle.height / 2))) {
        myPaddle.y += config.paddle.speed;
        moved = true;
    }

    if (moved) {
        // Clamp position to prevent client-side prediction from going out of bounds
        myPaddle.y = Phaser.Math.Clamp(myPaddle.y, config.paddle.height / 2, config.height - config.paddle.height / 2);
        
        // Convert center y-coordinate to top-left before sending
        const topLeftY = myPaddle.y - (config.paddle.height / 2);
        sendPlayerMove(topLeftY);
    }
}

/**
 * Sends the player's top-left y-coordinate to the server.
 * @param {number} y The new top-left y-coordinate of the paddle.
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
