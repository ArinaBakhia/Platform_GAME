class Player {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        
        // Физика игрока
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.jumpForce = 15;
        this.gravity = 0.8;
        this.isJumping = false;
        this.isOnGround = false;
        
        // Состояние игрока
        this.health = 100;
        this.score = 0;
        this.coinsCollected = 0;
        this.distance = 0;
        
        // Анимация
        this.frame = 0;
        this.animationSpeed = 0;
        this.direction = 1; // 1 - вправо, -1 - влево
        
        // Дополнительные возможности
        this.doubleJumpAvailable = false;
        this.hasShield = false;
        this.shieldTime = 0;
    }
    
    update(platforms, obstacles, canvas) {
        // Применяем гравитацию
        this.velocityY += this.gravity;
        
        // Обновляем позицию
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Минимальная граница слева (чтобы не уйти слишком далеко назад)
        if (this.x < -100) {
            this.x = -100;
            this.velocityX = 0;
        }
        
        // Проверяем столкновение с землей (низом канваса)
        if (this.y + this.height > canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            this.velocityY = 0;
            this.isOnGround = true;
            this.isJumping = false;
            this.doubleJumpAvailable = true;
        } else {
            this.isOnGround = false;
        }
        
        // Проверяем столкновения с платформами
        this.checkPlatformCollisions(platforms);
        
        // Проверяем столкновения с препятствиями
        this.checkObstacleCollisions(obstacles);
        
        // Обновляем анимацию при движении
        if (Math.abs(this.velocityX) > 0) {
            this.animationSpeed += 0.2;
            if (this.animationSpeed > 5) {
                this.frame = (this.frame + 1) % 4;
                this.animationSpeed = 0;
            }
        } else {
            this.frame = 0;
        }
        
        // Обновляем щит, если он активен
        if (this.hasShield) {
            this.shieldTime--;
            if (this.shieldTime <= 0) {
                this.hasShield = false;
            }
        }
        
        // Увеличиваем дистанцию при движении вправо
        if (this.velocityX > 0) {
            this.distance += this.velocityX * 0.1;
        }
        
        // Замедляем горизонтальное движение (трение)
        this.velocityX *= 0.85;
        if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
    }
    
    checkPlatformCollisions(platforms) {
        for (let platform of platforms) {
            // Проверяем столкновение с платформой сверху
            if (this.velocityY > 0 && 
                this.x + this.width > platform.x && 
                this.x < platform.x + platform.width &&
                this.y + this.height > platform.y && 
                this.y + this.height < platform.y + platform.height + 10) {
                
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isOnGround = true;
                this.isJumping = false;
                this.doubleJumpAvailable = true;
                
                // Особые эффекты от разных типов платформ
                if (platform.type === 'bounce') {
                    this.velocityY = -this.jumpForce * 1.5;
                } else if (platform.type === 'speed') {
                    this.velocityX = this.direction * this.speed * 1.5;
                }
            }
        }
    }
    
    checkObstacleCollisions(obstacles) {
        for (let obstacle of obstacles) {
            if (this.collidesWith(obstacle) && !obstacle.collected) {
                if (obstacle.type === 'damage') {
                    if (!this.hasShield) {
                        this.health -= 10;
                        // Эффект отталкивания при получении урона
                        this.velocityY = -this.jumpForce * 0.5;
                        if (this.x < obstacle.x) {
                            this.velocityX = -this.speed * 2;
                        } else {
                            this.velocityX = this.speed * 2;
                        }
                    }
                } else if (obstacle.type === 'coin') {
                    this.score += 100;
                    this.coinsCollected++;
                    obstacle.collected = true;
                } else if (obstacle.type === 'shield') {
                    this.hasShield = true;
                    this.shieldTime = 300; // 300 кадров = 5 секунд при 60 FPS
                    obstacle.collected = true;
                }
            }
        }
    }
    
    collidesWith(object) {
        return (
            this.x < object.x + object.width &&
            this.x + this.width > object.x &&
            this.y < object.y + object.height &&
            this.y + this.height > object.y
        );
    }
    
    move(direction) {
        if (direction === 'left') {
            this.velocityX = -this.speed;
            this.direction = -1;
        } else if (direction === 'right') {
            this.velocityX = this.speed;
            this.direction = 1;
        }
    }
    
    jump() {
        if (this.isOnGround) {
            this.velocityY = -this.jumpForce;
            this.isJumping = true;
            this.isOnGround = false;
        } else if (this.doubleJumpAvailable) {
            this.velocityY = -this.jumpForce * 0.8;
            this.isJumping = true;
            this.doubleJumpAvailable = false;
        }
    }
    
    draw(ctx) {
        // Рисуем щит, если он активен
        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width * 0.8,
                0,
                Math.PI * 2
            );
            ctx.strokeStyle = 'rgba(0, 150, 255, 0.7)';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.closePath();
        }
        
        // Рисуем тело игрока
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Рисуем глаза
        ctx.fillStyle = '#fff';
        const eyeX = this.direction > 0 ? this.x + this.width - 10 : this.x + 10;
        ctx.fillRect(eyeX, this.y + 10, 5, 5);
        
        // Рисуем анимацию ног при движении
        if (Math.abs(this.velocityX) > 0) {
            const legOffset = Math.sin(this.frame) * 5;
            ctx.fillRect(this.x + 5, this.y + this.height - 5, 5, legOffset + 10);
            ctx.fillRect(this.x + this.width - 10, this.y + this.height - 5, 5, -legOffset + 10);
        } else {
            ctx.fillRect(this.x + 5, this.y + this.height - 5, 5, 10);
            ctx.fillRect(this.x + this.width - 10, this.y + this.height - 5, 5, 10);
        }
        
        // Рисуем индикатор двойного прыжка
        if (this.doubleJumpAvailable) {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y - 10, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff00';
            ctx.fill();
            ctx.closePath();
        }
    }
}