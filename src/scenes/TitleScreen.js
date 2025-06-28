import Phaser from 'phaser'

export default class TitleScreen extends Phaser.Scene {
    init() {
        this.socket = null;
        this.playerRole = null;
        this.selectedIndex = 0; // 0 for single player, 1 for multiplayer
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

        this.menuButtons = [
            this.add.text(250, 300, 'Play Single Player', { fontSize: '32px', fill: '#fff' }),
            this.add.text(250, 370, 'Play Multiplayer', { fontSize: '32px', fill: '#fff' })
        ];
        // Make interactive for mouse as before
        this.menuButtons[0].setInteractive();
        this.menuButtons[1].setInteractive();

        this.menuButtons[0].on('pointerdown', () => this.startSinglePlayer());
        this.menuButtons[1].on('pointerdown', () => this.startMultiplayer());

        // Keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.updateMenuSelection();

        // Keyboard navigation
        this.input.keyboard.on('keydown-UP', () => {
            this.selectedIndex = (this.selectedIndex + this.menuButtons.length - 1) % this.menuButtons.length;
            console.log('[UP] Selected index:', this.selectedIndex);
            this.updateMenuSelection();
        });
        this.input.keyboard.on('keydown-DOWN', () => {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuButtons.length;
            console.log('[DOWN] Selected index:', this.selectedIndex);
            this.updateMenuSelection();
        });
        this.input.keyboard.on('keydown-ENTER', () => {
            console.log('[ENTER] Selected index:', this.selectedIndex);
            if (this.selectedIndex === 0) {
                this.startSinglePlayer();
            } else {
                this.startMultiplayer();
            }
        });

    }

    updateMenuSelection() {
        this.menuButtons.forEach((btn, idx) => {
            btn.setStyle({ backgroundColor: idx === this.selectedIndex ? '#444' : '', fill: idx === this.selectedIndex ? '#ff0' : '#fff' });
        });
    }

    startSinglePlayer() {
        console.log('Starting Single Player mode...');
        this.statusText.setText('Loading Single Player...');
        this.scene.start('pong', { gameMode: 'singlePlayer' });
    }

    startMultiplayer() {
        console.log('Starting Multiplayer mode...');
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
                        this.socket.onclose = null;
                        this.scene.start('pong', {
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
            this.socket = null;
        };

        this.socket.onclose = () => {
            if (this.scene && this.scene.isActive('titlescreen') && this.socket) {
                console.log('Disconnected from server.');
                this.statusText.setText('Disconnected. Please try again.');
            }
            this.socket = null;
        };
    }
}