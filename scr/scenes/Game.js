import Phaser from "phaser";
import { COLORS } from "../constants";

class Game extends Phaser.Scene {
    preload() {

    }
    create() {
        this.physics.world.setBounds(-100, 0, 1000, 500);

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



    }
    
    update() {             
        // Move the left rectangle (player-controlled) based on cursor input
        
        if (this.cursors.up.isDown) {
            console.log('UP')
            this.rectangleLeft.y -= 10
            this.rectangleLeft.body.updateFromGameObject()
        } else if (this.cursors.down.isDown) {
            console.log('DOWN')
            this.rectangleLeft.y += 10
            this.rectangleLeft.body.updateFromGameObject()
        }

        // Keep the right rectangle (computer-controlled) centered on the ball
        // this.rectangleRight.y = this.ball.y;
        // this.rectangleRight.body.updateFromGameObject();

        //score left and right
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

    // Handle the collision with the left rectangle, increasing the ball's velocity
    handleLeftRectBounce(ball, rectangle) {
        // Increase the ball's velocity by a factor of 1.1
        const newVelocityX = this.ball.body.velocity.x * Phaser.Math.Between(1.1, 1.9);
        const newVelocityY = this.ball.body.velocity.y * Phaser.Math.Between(1.1, 1.9);

        // Set the new velocity
        this.ball.body.setVelocity(newVelocityX, newVelocityY);

        // Log the new velocity for debugging
        console.log(`New Velocity: (${newVelocityX}, ${newVelocityY})`);
    }

    resetBall(x, y, velocityX, velocityY) {
        if (x !== undefined && y !== undefined && velocityX !== undefined && velocityY !== undefined) {
            this.ball.setPosition(x, y);
            this.ball.body.setVelocity(velocityX, velocityY);
        } else {
            this.ball.setPosition(400, 250);
            const angle = Phaser.Math.Between(0, 360);
            const vec = this.physics.velocityFromAngle(angle, 200);
            this.ball.body.setVelocity(vec.x, vec.y);
        }
    }

    setRightPaddleY(y_position) {
        this.rectangleRight.y = y_position;
        this.rectangleRight.body.updateFromGameObject();
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