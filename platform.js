class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        
        // Определяем цвет в зависимости от типа
        switch(type) {
            case 'normal':
                this.color = '#8B4513'; // Коричневый
                break;
            case 'bounce':
                this.color = '#00aa00'; // Зеленый
                break;
            case 'speed':
                this.color = '#0088ff'; // Синий
                break;
            case 'moving':
                this.color = '#aa5500'; // Темно-оранжевый
                this.speed = 2;
                this.direction = 1;
                this.originalX = x;
                this.moveRange = 100;
                break;
            default:
                this.color = '#8B4513';
        }
    }
    
    update(worldWidth) {
        // Обновляем движущиеся платформы
        if (this.type === 'moving') {
            this.x += this.speed * this.direction;
            
            // Меняем направление при достижении границ
            if (this.x > this.originalX + this.moveRange || this.x < this.originalX - this.moveRange) {
                this.direction *= -1;
            }
            
            // Убедимся, что платформа не выходит за пределы разумных границ
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
        // Рисуем основу платформы
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Добавляем текстуру
        ctx.fillStyle = this.type === 'normal' ? '#A0522D' : '#ffffff';
        for (let i = 0; i < this.width; i += 10) {
            ctx.fillRect(this.x + i, this.y, 5, 3);
        }
        
        // Добавляем специальные эффекты для разных типов платформ
        if (this.type === 'bounce') {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + 5, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        } else if (this.type === 'speed') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width - 10, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height - 5);
            ctx.fill();
            ctx.closePath();
        } else if (this.type === 'moving') {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width - 5, this.y + this.height / 2);
            ctx.stroke();
            ctx.closePath();
        }
    }
}