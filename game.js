// Основной игровой класс
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        // Игровые объекты
        this.player = null;
        this.platforms = [];
        this.obstacles = [];
        
        // Игровое состояние
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.level = 1;
        this.distance = 0;
        
        // Система камеры
        this.camera = {
            x: 0,
            y: 0,
            width: this.canvasWidth,
            height: this.canvasHeight
        };
        
        // Управление
        this.keys = {};
        
        // Игровой цикл
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameLoopId = null;
        
        // Генерация уровня
        this.lastPlatformX = 0;
        this.lastObstacleX = 0;
        this.coinsOnLevel = 0;        // ФИКСИРОВАННОЕ количество монет на уровне
        this.coinsCollected = 0;      // Собрано монет на текущем уровне
        this.levelComplete = false;
        this.worldWidth = 3000;
        
        // Уровневые настройки
        this.levelSettings = {
            1: { coins: 5, platforms: 10 },
            2: { coins: 7, platforms: 12 },
            3: { coins: 9, platforms: 14 },
            4: { coins: 11, platforms: 16 },
            5: { coins: 13, platforms: 18 }
        };
        
        // Звук
        this.soundEnabled = true;
        
        // Инициализация игры
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        // Создаем игрока
        this.player = new Player(
            100, 
            this.canvasHeight - 150, 
            30, 
            50, 
            '#3498db'
        );
        
        // Создаем начальные платформы
        this.createInitialPlatforms();
        
        // Создаем начальные препятствия и бонусы
        this.createInitialObstacles();
        
        // Обновляем UI
        this.updateUI();
    }
    
    createInitialPlatforms() {
        // Основание (земля) - на всю ширину мира
        this.platforms.push(new Platform(0, this.canvasHeight - 50, this.worldWidth, 50, 'normal'));
        
        // Несколько стартовых платформ
        this.platforms.push(new Platform(200, this.canvasHeight - 150, 150, 20, 'normal'));
        this.platforms.push(new Platform(400, this.canvasHeight - 200, 100, 20, 'bounce'));
        this.platforms.push(new Platform(600, this.canvasHeight - 250, 120, 20, 'speed'));
        this.platforms.push(new Platform(300, this.canvasHeight - 300, 100, 20, 'moving'));
        this.platforms.push(new Platform(800, this.canvasHeight - 180, 120, 20, 'normal'));
        this.platforms.push(new Platform(1000, this.canvasHeight - 220, 100, 20, 'normal'));
        
        this.lastPlatformX = 1000;
    }
    
    createInitialObstacles() {
        // Сбрасываем счетчики монет
        this.coinsCollected = 0;
        
        // Определяем количество монет для текущего уровня
        const levelSettings = this.levelSettings[this.level] || this.levelSettings[5];
        this.coinsOnLevel = levelSettings.coins;
        
        // Очищаем старые препятствия
        this.obstacles = [];
        this.lastObstacleX = 300; // Начинаем с этой позиции
        
        // Создаем фиксированный набор монет для уровня
        this.generateLevelCoins();
        
        // Добавляем несколько препятствий (не монет)
        this.generateLevelObstacles();
        
        console.log(`Уровень ${this.level}: ${this.coinsOnLevel} монет для сбора`);
    }
    
    generateLevelCoins() {
        const levelSettings = this.levelSettings[this.level] || this.levelSettings[5];
        const coinsToGenerate = levelSettings.coins;
        
        for (let i = 0; i < coinsToGenerate; i++) {
            const minGap = 200;
            const maxGap = 400;
            const gap = minGap + Math.random() * (maxGap - minGap);
            
            const size = 20;
            
            // Размещаем монеты на разной высоте
            const obstacleY = this.canvasHeight - 200 - Math.random() * 250;
            
            this.obstacles.push(new Obstacle(
                this.lastObstacleX + gap,
                obstacleY,
                size,
                size,
                'coin'
            ));
            
            this.lastObstacleX += gap + size;
        }
    }
    
    generateLevelObstacles() {
        // Добавляем препятствия на уровень
        const obstacleCount = 3 + this.level; // Больше препятствий на высоких уровнях
        
        for (let i = 0; i < obstacleCount; i++) {
            const minGap = 150;
            const maxGap = 300;
            const gap = minGap + Math.random() * (maxGap - minGap);
            
            const size = 20;
            
            // Выбираем тип препятствия 
            const rand = Math.random();
            let type;
            
            if (rand < 0.6) {
                type = 'damage';
            } else if (rand < 0.9) {
                type = 'shield';
            } else {
                type = 'moving';
            }
            
            // Размещаем препятствия
            let obstacleY;
            if (type === 'damage' || type === 'moving') {
                obstacleY = this.canvasHeight - 150 - Math.random() * 200;
            } else {
                obstacleY = this.canvasHeight - 200 - Math.random() * 150;
            }
            
            this.obstacles.push(new Obstacle(
                this.lastObstacleX + gap,
                obstacleY,
                size,
                size,
                type
            ));
            
            this.lastObstacleX += gap + size;
        }
    }
    
    countCoinsOnLevel() {
        this.coinsOnLevel = 0;
        for (let obstacle of this.obstacles) {
            if (obstacle.type === 'coin' && !obstacle.collected) {
                this.coinsOnLevel++;
            }
        }
    }
    
    generateNewPlatform() {
        const minGap = 100;
        const maxGap = 250;
        const gap = minGap + Math.random() * (maxGap - minGap);
        
        const platformWidth = 80 + Math.random() * 100;
        const platformHeight = 20;
        
        // Случайная высота платформы
        const minHeight = 100;
        const maxHeight = 350;
        const platformY = this.canvasHeight - 50 - (minHeight + Math.random() * (maxHeight - minHeight));
        
        // Случайный тип платформы
        const types = ['normal', 'normal', 'normal', 'bounce', 'speed', 'moving'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.platforms.push(new Platform(
            this.lastPlatformX + gap,
            platformY,
            platformWidth,
            platformHeight,
            type
        ));
        
        this.lastPlatformX += gap + platformWidth;
    }
    

    
    updateCamera() {
        // Камера следует за игроком по горизонтали
        const targetX = this.player.x - this.camera.width / 2 + this.player.width / 2;
        
        // Плавное движение камеры к цели
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // Ограничиваем камеру
        if (this.camera.x < 0) {
            this.camera.x = 0;
        }
        
        const maxCameraX = Math.max(0, this.worldWidth - this.camera.width);
        if (this.camera.x > maxCameraX) {
            this.camera.x = maxCameraX;
        }
        
        // Вертикальная камера
        const targetY = this.player.y - this.camera.height / 2 + this.player.height / 2;
        
        if (targetY < this.camera.y) {
            this.camera.y += (targetY - this.camera.y) * 0.1;
        } else if (targetY > this.camera.y + 100) {
            this.camera.y += (targetY - this.camera.y - 100) * 0.05;
        }
        
        if (this.camera.y < 0) {
            this.camera.y = 0;
        }
        
        const maxCameraY = this.canvasHeight - 100;
        if (this.camera.y > maxCameraY) {
            this.camera.y = maxCameraY;
        }
    }
    
    isVisible(object) {
        return (
            object.x < this.camera.x + this.camera.width + 100 &&
            object.x + object.width > this.camera.x - 100 &&
            object.y < this.camera.y + this.camera.height + 100 &&
            object.y + object.height > this.camera.y - 100
        );
    }
    
    updateCoinsCollected() {
        let collectedCoins = 0;
        for (let obstacle of this.obstacles) {
            if (obstacle.type === 'coin' && obstacle.collected) {
                collectedCoins++;
            }
        }
        this.coinsCollected = this.player.coinsCollected;
    }
    
    update(deltaTime) {
        // Обновляем игрока
        this.player.update(this.platforms, this.obstacles, this.canvas);
        
        // Обновляем камеру
        this.updateCamera();
        
        // Обновляем платформы
        for (let platform of this.platforms) {
            platform.update(this.worldWidth);
        }
        
        // Обновляем препятствия
        for (let obstacle of this.obstacles) {
            obstacle.update(this.worldWidth);
        }
        
        // Обновляем счетчик собранных монет
        this.updateCoinsCollected();
        
        // Генерируем новые платформы по мере продвижения
        if (this.lastPlatformX - this.camera.x < this.camera.width * 1.5) {
            this.generateNewPlatform();
        }
        

        
        // Обновляем игровую статистику
        this.score = this.player.score;
        this.distance = Math.floor(this.player.distance);
        
        // Обновляем уровень в зависимости от пройденной дистанции
        const newLevel = Math.floor(this.distance / 500) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            // Увеличиваем сложность с уровнем
            this.player.speed = 5 + this.level * 0.2;
            this.player.gravity = 0.8 + this.level * 0.05;
        }
        
        // Проверяем, собраны ли все монеты на уровне
        if (this.coinsOnLevel > 0 && this.coinsCollected >= this.coinsOnLevel && !this.levelComplete) {
            this.levelComplete = true;
            this.completeLevel();
        }
        
        // Проверяем условия окончания игры
        if (this.player.health <= 0) {
            this.gameOver();
        }
        
        // Обновляем UI
        this.updateUI();
    }
    
    completeLevel() {
        // Добавляем бонусные очки за сбор всех монет
        const bonus = this.level * 500;
        this.player.score += bonus;
        this.score = this.player.score;
        
        // Показываем сообщение о завершении уровня
        this.showLevelCompleteMessage(bonus);
        
        // Через 2 секунды переходим на следующий уровень
        setTimeout(() => {
            this.nextLevel();
        }, 2000);
    }
    
    showLevelCompleteMessage(bonus) {
        // Временно приостанавливаем игру
        const previousState = this.gameState;
        this.gameState = 'paused';
        
        // Создаем и показываем сообщение
        const messageDiv = document.createElement('div');
        messageDiv.className = 'level-complete-message';
        messageDiv.innerHTML = `
            <h2>Уровень ${this.level} пройден!</h2>
            <p>Все ${this.coinsOnLevel} монет собраны!</p>
            <p>Бонус: +${bonus} очков</p>
            <p>Переход на уровень ${this.level + 1}...</p>
        `;
        
        document.querySelector('.canvas-container').appendChild(messageDiv);
        
        // Убираем сообщение через 1.8 секунды
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
            // Возвращаем предыдущее состояние игры
            if (previousState === 'playing') {
                this.gameState = 'playing';
            }
        }, 1800);
    }
    
    nextLevel() {

        // Увеличиваем уровень
        this.level++;
        
        // Сбрасываем флаг завершения уровня
        this.levelComplete = false;
        
        // Сбрасываем счетчик собранных монет у игрока
        this.player.coinsCollected = 0;
        
        // Определяем количество монет для нового уровня
        const levelSettings = this.levelSettings[this.level] || this.levelSettings[5];
        this.coinsOnLevel = levelSettings.coins;
        
        // Очищаем старые препятствия и создаем новые для нового уровня
        this.obstacles = [];
        this.lastObstacleX = 300;
        this.generateLevelCoins();
        this.generateLevelObstacles();
        
        // Обновляем UI
        this.updateUI();
        
        console.log(`Начался уровень ${this.level}: ${this.coinsOnLevel} монет для сбора`);
    }
    
    
    drawBackground() {
        // Градиентное небо
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        gradient.addColorStop(0, '#1a237e');
        gradient.addColorStop(1, '#0d47a1');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.worldWidth, this.canvasHeight);
        
        // Облака с параллакс-эффектом (используем Math.floor для устранения дергания)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        for (let i = 0; i < 10; i++) {
            // Используем Math.floor для целочисленных координат
            const cloudX = Math.floor(this.camera.x * 0.3 + i * 300) % (this.worldWidth + 400) - 200;
            const cloudY = 50 + (i % 5) * 40;
            this.drawCloud(cloudX, cloudY, 60 + i * 5, 30);
        }
        
        // Звезды 
        this.ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const starX = (i * 97) % this.worldWidth;
            const starY = (i * 37) % 150;
            const size = Math.random() * 2 + 0.5;
            this.ctx.fillRect(starX, starY, size, size);
        }
        
        // Земля
        this.ctx.fillStyle = '#2d3436';
        this.ctx.fillRect(0, this.canvasHeight - 50, this.worldWidth, 100);

    }
    
    drawCloud(x, y, width, height) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, height / 2, 0, Math.PI * 2);
        this.ctx.arc(x + width / 3, y - height / 4, height / 2.5, 0, Math.PI * 2);
        this.ctx.arc(x + width * 2/3, y, height / 2, 0, Math.PI * 2);
        this.ctx.arc(x + width, y, height / 3, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    draw() {
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Сохраняем контекст и применяем трансформацию камеры
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Рисуем фон
        this.drawBackground();
        
        // Рисуем платформы
        for (let platform of this.platforms) {
            if (this.isVisible(platform)) {
                platform.draw(this.ctx);
            }
        }
        
        // Рисуем препятствия
        for (let obstacle of this.obstacles) {
            if (this.isVisible(obstacle) && !obstacle.collected) {
                obstacle.draw(this.ctx);
            }
        }
        
        // Рисуем игрока
        this.player.draw(this.ctx);
        
        // Восстанавливаем контекст
        this.ctx.restore();
        
        // Рисуем UI
        this.drawGameUI();
    }
    
    drawGameUI() {
        // Рисуем счет
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Счет: ${this.score}`, 20, 40);
        
        // Рисуем уровень
        this.ctx.fillText(`Уровень: ${this.level}`, 20, 70);
        
        // Рисуем прогресс сбора монет
        if (this.coinsOnLevel > 0) {
            const progress = this.coinsCollected / this.coinsOnLevel;
            
            // Текст с прогрессом
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 18px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Монеты: ${this.coinsCollected}/${this.coinsOnLevel}`, this.canvasWidth - 20, 40);
            
            // Прогресс-бар
            const barWidth = 150;
            const barHeight = 15;
            const barX = this.canvasWidth - barWidth - 20;
            const barY = 50;
            
            // Фон прогресс-бара
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Заполнение прогресс-бара
            this.ctx.fillStyle = progress === 1 ? '#00ff00' : '#ffd700';
            this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            
            // Рамка прогресс-бара
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Если все монеты собраны
            if (progress === 1 && !this.levelComplete) {
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('ВСЕ МОНЕТЫ СОБРАНЫ!', this.canvasWidth / 2, 100);
            }
        }
        
        // Рисуем предупреждение о низком здоровье
        if (this.player.health < 30) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            this.ctx.font = 'bold 30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('НИЗКОЕ ЗДОРОВЬЕ!', this.canvasWidth / 2, this.canvasHeight / 2);
        }
        
        // Рисуем индикатор щита
        if (this.player.hasShield) {
            this.ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'right';
            const shieldTime = Math.ceil(this.player.shieldTime / 60);
            this.ctx.fillText(`ЩИТ: ${shieldTime}с`, this.canvasWidth - 20, 80);
        }
    }
    
    updateUI() {
        // Обновляем здоровье
        const healthFill = document.getElementById('health-fill');
        const healthText = document.getElementById('health-text');
        const healthPercent = Math.max(0, this.player.health);
        
        healthFill.style.width = `${healthPercent}%`;
        healthText.textContent = `${Math.round(healthPercent)}%`;
        
        // Обновляем цвет индикатора здоровья
        if (healthPercent > 70) {
            healthFill.style.background = 'linear-gradient(90deg, #00ff00, #00ff00)';
        } else if (healthPercent > 40) {
            healthFill.style.background = 'linear-gradient(90deg, #ffff00, #ffff00)';
        } else {
            healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff0000)';
        }
        
        // Обновляем счет
        document.getElementById('score').textContent = this.score;
        
        // Обновляем уровень
        document.getElementById('level').textContent = this.level;
        
        // Обновляем дистанцию
        document.getElementById('distance').textContent = this.distance;
        
        // Обновляем монеты
        document.getElementById('coins').textContent = `${this.coinsCollected}/${this.coinsOnLevel}`;
    }
    
    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (this.gameState === 'playing') {
            this.update(this.deltaTime);
            this.draw();
        }
        
        this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    startGame() {
        this.gameState = 'playing';
        this.lastTime = 0;
        
        // Показываем/скрываем экраны
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('pauseScreen').style.display = 'none';
        
        // Запускаем игровой цикл
        if (!this.gameLoopId) {
            this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseScreen').style.display = 'flex';
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseScreen').style.display = 'none';
            this.lastTime = 0;
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // Обновляем финальный счет
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalDistance').textContent = this.distance;
        document.getElementById('finalLevel').textContent = this.level;
        
        // Показываем экран окончания игры
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
    
    restartGame() {
        
        // Сбрасываем игру
        this.player = new Player(
            100, 
            this.canvasHeight - 150, 
            30, 
            50, 
            '#3498db'
        );
        
        this.platforms = [];
        this.obstacles = [];
        
        this.score = 0;
        this.level = 1;
        this.distance = 0;
        
        this.lastPlatformX = 0;
        this.lastObstacleX = 0;
        
        // Сбрасываем счетчики монет
        const levelSettings = this.levelSettings[this.level] || this.levelSettings[5];
        this.coinsOnLevel = levelSettings.coins;
        this.coinsCollected = 0;
        this.levelComplete = false;
        
        this.camera.x = 0;
        this.camera.y = 0;
        
        // Создаем начальные объекты
        this.createInitialPlatforms();
        this.createInitialObstacles();
        
        // Обновляем UI
        this.updateUI();
        
        // Начинаем игру заново
        this.startGame();

    }
    
    setupEventListeners() {
        // Обработка нажатий клавиш
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            if (this.gameState === 'playing') {
                if (key === ' ' || key === 'w' || key === 'arrowup') {
                    this.player.jump();
                }
                
                if (key === 'p' || key === 'escape') {
                    this.pauseGame();
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // Обработка нажатий кнопок
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('restartButton2').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            const soundIcon = document.querySelector('#soundToggle i');
            soundIcon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        });
        
        // Непрерывное движение
        setInterval(() => {
            if (this.gameState === 'playing') {
                if (this.keys['a'] || this.keys['arrowleft']) {
                    this.player.move('left');
                }
                if (this.keys['d'] || this.keys['arrowright']) {
                    this.player.move('right');
                }
            }
        }, 16);
    }
}

// Инициализация игры
window.addEventListener('load', () => {
    const game = new Game();
});
