import Phaser from 'phaser'

export default class TitleScreen extends Phaser.Scene {
    init() {
        this.socket = null;
        this.playerRole = null;
    }

    preload() {

    }

    create() {
        // Title Text
        const titleText = this.add.text(400, 150, 'Pong', { fontSize: '64px', fill: '#fff' });
        titleText.setOrigin(0.5, 0.5);

        // Status Text
        this.statusText = this.add.text(400, 220, 'Select a mode', { fontSize: '24px', fill: '#fff' });
        this.statusText.setOrigin(0.5, 0.5);

        // Single Player Button
        const singlePlayerButton = this.add.text(400, 300, 'Play Single Player', { fontSize: '32px', fill: '#fff' });
        singlePlayerButton.setOrigin(0.5, 0.5);
        singlePlayerButton.setInteractive();
        singlePlayerButton.on('pointerdown', () => {
            this.statusText.setText('Loading Single Player...');
            this.scene.start('circle', { gameMode: 'singlePlayer' });
        });

        // Multiplayer Button
        const multiplayerButton = this.add.text(400, 370, 'Play Multiplayer', { fontSize: '32px', fill: '#fff' });
        multiplayerButton.setOrigin(0.5, 0.5);
        multiplayerButton.setInteractive();
        multiplayerButton.on('pointerdown', () => {
            if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
                this.statusText.setText('Already connecting or connected.');
                return;
            }

            this.statusText.setText('Connecting to server...');
            this.socket = new WebSocket('ws://localhost:8080/pong');

            this.socket.onopen = () => {
                console.log('Connected to server.');
                this.statusText.setText('Waiting for opponent...');
            };

            this.socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log('Message received:', message);
                switch (message.type) {
                    case 'PLAYER_ASSIGNMENT':
                        this.playerRole = message.payload.playerRole;
                        console.log(`Assigned role: ${this.playerRole}`);
                        this.statusText.setText(`You are player: ${this.playerRole}. Waiting for game start.`);
                        break;
                    case 'GAME_START':
                        console.log('Game starting...');
                        if (this.playerRole) {
                            // Ensure socket is not cleaned up by onclose if we are transitioning
                            this.socket.onclose = null;
                            this.scene.start('circle', {
                                gameMode: 'multiPlayer',
                                webSocket: this.socket,
                                playerRole: this.playerRole,
                                initialBall: message.payload
                            });
                        } else {
                            console.error('GAME_START received without player role assigned.');
                            this.statusText.setText('Error: Role not assigned before game start.');
                        }
                        break;
                    default:
                        console.log('Unknown message type from server:', message.type);
                }
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.statusText.setText('Connection error. Please try again.');
                this.socket = null; // Reset socket
            };

            this.socket.onclose = () => {
                // Only update status if we are not already transitioning (e.g. due to GAME_START)
                // and if the scene is still active.
                if (this.scene && this.scene.isActive('titlescreen') && this.socket) {
                    console.log('Disconnected from server.');
                    this.statusText.setText('Disconnected. Please try again.');
                }
                this.socket = null; // Reset socket
            };
        });
    }
}