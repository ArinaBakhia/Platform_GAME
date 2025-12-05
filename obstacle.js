class Obstacle {
    constructor(x, y, width, height, type = 'damage') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.collected = false;
        
        // Анимация
        this.frame = 0;
        this.animationSpeed = 0;
        
        // Определяем свойства в зависимости от типа
        switch(type) {
            case 'damage':
                this.color = '#ff0000';
                this.speed = 0;
                break;
            case 'coin':
                this.color = '#ffd700';
                this.speed = 0;
                this.value = 100;
                break;
            case 'shield':
                this.color = '#0088ff';
                this.speed = 0;
                break;
            case 'moving':
                this.color = '#ff5500';
                this.speed = 2;
                this.direction = 1;
                this.originalX = x;
                this.moveRange = 50;
                break;
            default:
                this.color = '#ff0000';
                this.speed = 0;
        }
    }
    
    update(worldWidth) {
        // Обновляем анимацию
        this.animationSpeed += 0.1;
        if (this.animationSpeed > 2) {
            this.frame = (this.frame + 1) % 10;
            this.animationSpeed = 0;
        }
        
        // Обновляем движущиеся препятствия
        if (this.type === 'moving') {
            this.x += this.speed * this.direction;
            
            // Меняем направление при достижении границ
            if (this.x > this.originalX + this.moveRange || this.x < this.originalX - this.moveRange) {
                this.direction *= -1;
            }
            
            // Убедимся, что препятствие не выходит за пределы разумных границ
            if (this.x < 0) {
                this.x = 0;
                this.direction = 1;
            }
            if (this.x + this.width > worldWidth) {
                this.x = worldWidth - this.width;
                this.direction = -1;
            }
        }
    }
    
    draw(ctx) {
        if (this.collected) return;
        
        ctx.save();
        
        if (this.type === 'coin') {
            // Анимированная монета
            const angle = this.frame * 0.5;
            const scale = 0.8 + Math.sin(this.frame * 0.5) * 0.2;
            
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(angle);
            ctx.scale(scale, scale);
            
            // Рисуем монету
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Рисуем внутреннюю часть монеты
            ctx.fillStyle = '#ffed4e';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Рисуем детали монеты
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
            ctx.fill();
            
        } else if (this.type === 'shield') {
            // Анимированный щит
            const pulse = 0.8 + Math.sin(this.frame) * 0.2;
            
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(pulse, pulse);
            
            // Рисуем щит
            ctx.fillStyle = '#0088ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Рисуем символ щита
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#0088ff';
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // Стандартное препятствие
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Добавляем детали для препятствий
            if (this.type === 'damage') {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('!', this.x + this.width / 2, this.y + this.height / 2 + 4);
            } else if (this.type === 'moving') {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(this.x + 5, this.y + 5);
                ctx.lineTo(this.x + this.width - 5, this.y + this.height - 5);
                ctx.moveTo(this.x + this.width - 5, this.y + 5);
                ctx.lineTo(this.x + 5, this.y + this.height - 5);
                ctx.stroke();
                ctx.closePath();
            }
        }
        
        ctx.restore();
    }
}