import Phaser from "phaser";
import { COLORS } from "../constants";

class Game extends Phaser.Scene {
    init(data) {
        this.gameMode = data.gameMode || 'singlePlayer';
        this.socket = (this.gameMode === 'multiPlayer') ? data.webSocket : null;
        this.playerRole = (this.gameMode === 'multiPlayer') ? data.playerRole : null;
        this.initialBall = (this.gameMode === 'multiPlayer') ? data.initialBall : null;
    }

    preload() {

    }
    create() {
        this.physics.world.setBounds(-100, 0, 1000, 500); // score zones are outside this

        // Store world bounds and paddle height for easy access
        this.paddleHeight = 100; // Assuming fixed height based on previous rect definition
        this.worldTop = this.physics.world.bounds.y; // This is the top of the playable area for paddles
        this.worldBottom = this.physics.world.bounds.height; // This is the bottom of the playable area for paddles


        this.ball  = this.add.circle(400, 250, 10, COLORS.WHITE, 1)       
        this.physics.add.existing(this.ball)  
        this.ball.body.setBounce(1,1)
        this.ball.body.setCollideWorldBounds(true, 1, 1)

        this.resetBall()

        this.rectangleLeft = this.add.rectangle(50, 250, 25,100, COLORS.WHITE, 1)
        this.physics.add.existing(this.rectangleLeft, true)

        this.rectangleRight = this.add.rectangle(750, 250, 25,100, COLORS.WHITE, 1)
        this.physics.add.existing(this.rectangleRight, true)

        // this.physics.add.existing(this.rectangleLeft)      
        // this.physics.add.collider(this.ball, this.rectangleLeft)
        this.physics.add.existing(this.rectangleRight)      
        this.physics.add.collider(this.ball, this.rectangleRight)

        this.cursors = this.input.keyboard.createCursorKeys()

        // Set Scoreboard
        this.scoreLeft = 0; 
        this.scoreRight = 0;
        this.scoreText = this.add.text(400, 50, '0 - 0', {
            fontSize: 32
        })
        .setOrigin(0.5, 0.5);
            
        // Add collider with callback to handle ball collision with world bounds
        this.physics.add.collider(
            this.ball, 
            this.rectangleLeft, 
            this.handleLeftRectBounce, 
            null, 
            this
        );

        if (this.gameMode === 'multiPlayer' && this.socket) {
            if (this.initialBall) {
                this.resetBall(
                    this.initialBall.initialBallX,
                    this.initialBall.initialBallY,
                    this.initialBall.initialBallVelocityX,
                    this.initialBall.initialBallVelocityY
                );
            }

            this.socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                // console.log('Game scene received message:', message);
                switch (message.type) {
                    case 'GAME_STATE':
                        this.setBallData(message.payload.ball.x, message.payload.ball.y, message.payload.ball.vx, message.payload.ball.vy);
                        if (this.playerRole === 'left') {
                            this.setRightPaddleY(message.payload.paddles.right);
                        } else if (this.playerRole === 'right') {
                            this.setLeftPaddleY(message.payload.paddles.left);
                        }
                        break;
                    case 'SCORE_UPDATE':
                        this.setScores(message.payload.scoreLeft, message.payload.scoreRight);
                        break;
                    case 'RESET_BALL':
                        this.resetBall(message.payload.x, message.payload.y, message.payload.velocityX, message.payload.velocityY);
                        break;
                    case 'OPPONENT_DISCONNECTED':
                        console.log('Opponent disconnected.');
                        // Optionally, display a message on screen
                        // For example, by adding a text object to the scene:
                        if (!this.disconnectText) {
                           this.disconnectText = this.add.text(this.physics.world.bounds.width / 2, this.physics.world.bounds.height / 2, 'Opponent disconnected.\nReturning to Title Screen...', { fontSize: '32px', fill: '#fff', align: 'center' }).setOrigin(0.5);
                        }
                        this.disconnectText.setVisible(true);
                        if (this.socket) this.socket.close();
                        // Delay returning to title screen to show message
                        this.time.delayedCall(3000, () => {
                            this.scene.start('titlescreen');
                        });
                        break;
                    default:
                        console.log('Unknown message type in Game:', message.type);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error during game:', error);
                if (this.socket) this.socket.close();
                 if (this.scene.isActive('circle')) {
                    this.scene.start('titlescreen');
                }
            };
            this.socket.onclose = () => {
                console.log('WebSocket closed during game.');
                if (this.scene.isActive('circle')) {
                    // Potentially show a message before transitioning
                    if (!this.disconnectText) {
                        this.disconnectText = this.add.text(this.physics.world.bounds.width / 2, this.physics.world.bounds.height / 2, 'Connection lost.\nReturning to Title Screen...', { fontSize: '32px', fill: '#fff', align: 'center' }).setOrigin(0.5);
                    }
                    this.disconnectText.setVisible(true);
                    this.time.delayedCall(3000, () => {
                        this.scene.start('titlescreen');
                    });
                }
            };
        }
    }
    
    update() {
        if (this.gameMode === 'multiPlayer' && this.socket && this.playerRole) {
            let moved = false;
            let newY;
            const speed = 10; // Define paddle speed
            const halfPaddleHeight = this.rectangleLeft.displayHeight / 2; // Assuming both paddles are same height
            const worldTop = this.physics.world.bounds.y;
            const worldBottom = this.physics.world.bounds.height;

            if (this.playerRole === 'left') {
                if (this.cursors.up.isDown && this.rectangleLeft.y > worldTop + halfPaddleHeight) {
                    this.rectangleLeft.y -= speed;
                    newY = Math.max(this.rectangleLeft.y, worldTop + halfPaddleHeight);
                    this.rectangleLeft.y = newY;
                    this.rectangleLeft.body.updateFromGameObject();
                    moved = true;
                } else if (this.cursors.down.isDown && this.rectangleLeft.y < worldBottom - halfPaddleHeight) {
                    this.rectangleLeft.y += speed;
                    newY = Math.min(this.rectangleLeft.y, worldBottom - halfPaddleHeight);
                    this.rectangleLeft.y = newY;
                    this.rectangleLeft.body.updateFromGameObject();
                    moved = true;
                }
            } else if (this.playerRole === 'right') {
                if (this.cursors.up.isDown && this.rectangleRight.y > worldTop + halfPaddleHeight) {
                    this.rectangleRight.y -= speed;
                    newY = Math.max(this.rectangleRight.y, worldTop + halfPaddleHeight);
                    this.rectangleRight.y = newY;
                    this.rectangleRight.body.updateFromGameObject();
                    moved = true;
                } else if (this.cursors.down.isDown && this.rectangleRight.y < worldBottom - halfPaddleHeight) {
                    this.rectangleRight.y += speed;
                    newY = Math.min(this.rectangleRight.y, worldBottom - halfPaddleHeight);
                    this.rectangleRight.y = newY;
                    this.rectangleRight.body.updateFromGameObject();
                    moved = true;
                }
            }

            if (moved) {
                 // Clamp the paddle's Y position
                let currentPaddle = (this.playerRole === 'left') ? this.rectangleLeft : this.rectangleRight;
                currentPaddle.y = Phaser.Math.Clamp(
                    currentPaddle.y,
                    this.worldTop + halfPaddleHeight,
                    this.worldBottom - halfPaddleHeight
                );
                currentPaddle.body.updateFromGameObject();
                newY = currentPaddle.y; // newY is the clamped position

                if (this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                        type: 'PLAYER_MOVE',
                        payload: { y: newY } // Send the clamped Y position
                    }));
                }
            }
        } else if (this.gameMode === 'singlePlayer') {
            const speed = 10;
            const halfPaddleHeight = this.paddleHeight / 2;
            let moved = false;

            if (this.cursors.up.isDown) {
                this.rectangleLeft.y -= speed;
                moved = true;
            } else if (this.cursors.down.isDown) {
                this.rectangleLeft.y += speed;
                moved = true;
            }

            if (moved) {
                this.rectangleLeft.y = Phaser.Math.Clamp(
                    this.rectangleLeft.y,
                    this.worldTop + halfPaddleHeight,
                    this.worldBottom - halfPaddleHeight
                );
                this.rectangleLeft.body.updateFromGameObject();
            }
        }

        // Keep the right rectangle (computer-controlled) centered on the ball
        if (this.gameMode === 'singlePlayer') {
            this.rectangleRight.y = this.ball.y;
            this.rectangleRight.body.updateFromGameObject();
        }

        //score left and right
        if (this.gameMode === 'singlePlayer') {
            if (this.ball.x < -50) {
                console.log('Right Player Scored!');
                this.scoreRight += 1;
                this.scoreText.setText(`${this.scoreLeft} - ${this.scoreRight}`);
                this.resetBall();
            } else if (this.ball.x > 850) {
                console.log('Left Player Scored!');
                this.scoreLeft += 1;
                this.scoreText.setText(`${this.scoreLeft} - ${this.scoreRight}`);
                this.resetBall();
            }
        }
    }

    // Handle the collision with the left rectangle, increasing the ball's velocity
    handleLeftRectBounce(ball, rectangle) {
        if (this.gameMode === 'singlePlayer') {
            // Increase the ball's velocity by a factor of 1.1
            const newVelocityX = this.ball.body.velocity.x * Phaser.Math.Between(1.1, 1.9);
            const newVelocityY = this.ball.body.velocity.y * Phaser.Math.Between(1.1, 1.9);

            // Set the new velocity
            this.ball.body.setVelocity(newVelocityX, newVelocityY);

            // Log the new velocity for debugging
            console.log(`New Velocity: (${newVelocityX}, ${newVelocityY})`);
        }
        // In multiplayer, server would dictate velocity changes.
    }

    resetBall(x, y, velocityX, velocityY) {
        if (x !== undefined && y !== undefined && velocityX !== undefined && velocityY !== undefined) {
            this.ball.setPosition(x, y);
            this.ball.body.setVelocity(velocityX, velocityY);
        } else if (this.gameMode === 'singlePlayer') {
            this.ball.setPosition(400, 250); // Default position
            let angle = Phaser.Math.Between(0, 360);
            // Ensure the ball doesn't go straight up/down or too horizontal initially
            while (Phaser.Math.Within(angle % 180, 80, 100) || Phaser.Math.Within(angle % 180, -10, 10)) {
                angle = Phaser.Math.Between(0, 360);
            }
            const vec = this.physics.velocityFromAngle(angle, 200);
            this.ball.body.setVelocity(vec.x, vec.y);
        }
        // In multiplayer, if no parameters are given, it implies the server will send them
        // or GAME_START / RESET_BALL S2C message will provide these.
    }

    setRightPaddleY(y_position) {
        this.rectangleRight.y = y_position;
        this.rectangleRight.body.updateFromGameObject();
    }

    setLeftPaddleY(y_position) {
        this.rectangleLeft.y = y_position;
        this.rectangleLeft.body.updateFromGameObject();
    }

    setBallData(x_position, y_position, x_velocity, y_velocity) {
        this.ball.setPosition(x_position, y_position);
        this.ball.body.setVelocity(x_velocity, y_velocity);
    }

    setScores(scoreLeft, scoreRight) {
        this.scoreLeft = scoreLeft;
        this.scoreRight = scoreRight;
        this.scoreText.setText(`${this.scoreLeft} - ${this.scoreRight}`);
    }
}
export default Game