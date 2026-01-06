// Монитор производительности
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            memory: [],
            fps: [],
            loadTime: []
        };
        this.startTime = Date.now();
        this.frameCount = 0;
        this.lastTime = Date.now();
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        // Мониторинг FPS
        const measureFPS = () => {
            const now = Date.now();
            this.frameCount++;
            
            if (now - this.lastTime >= 1000) {
                const fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
                this.metrics.fps.push(fps);
                
                // Сохраняем только последние 60 измерений
                if (this.metrics.fps.length > 60) {
                    this.metrics.fps.shift();
                }
                
                this.frameCount = 0;
                this.lastTime = now;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
        
        // Мониторинг памяти
        if (performance.memory) {
            setInterval(() => {
                this.metrics.memory.push({
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                });
                
                if (this.metrics.memory.length > 60) {
                    this.metrics.memory.shift();
                }
            }, 1000);
        }
        
        // Мониторинг времени загрузки
        window.addEventListener('load', () => {
            this.metrics.loadTime.push(Date.now() - this.startTime);
        });
    }
    
    getStats() {
        const stats = {
            averageFPS: this.calculateAverage(this.metrics.fps),
            averageMemory: this.calculateAverage(this.metrics.memory.map(m => m.usedJSHeapSize / 1024 / 1024)),
            loadTime: this.metrics.loadTime[0] || 0,
            currentMemory: performance.memory ? 
                Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' : 
                'N/A'
        };
        
        return stats;
    }
    
    calculateAverage(array) {
        if (array.length === 0) return 0;
        const sum = array.reduce((a, b) => a + b, 0);
        return Math.round(sum / array.length);
    }
    
    showDashboard() {
        const stats = this.getStats();
        const dashboard = document.createElement('div');
        dashboard.className = 'performance-dashboard';
        dashboard.innerHTML = `
            <h3>📊 Панель производительности</h3>
            <div class="metric">
                <span class="metric-label">FPS:</span>
                <span class="metric-value">${stats.averageFPS}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Память:</span>
                <span class="metric-value">${stats.currentMemory}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Время загрузки:</span>
                <span class="metric-value">${stats.loadTime}ms</span>
            </div>
        `;
        
        dashboard.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 9999;
            font-family: monospace;
            font-size: 12px;
        `;
        
        document.body.appendChild(dashboard);
        
        // Автоскрытие через 10 секунд
        setTimeout(() => {
            dashboard.remove();
        }, 10000);
    }
}

// Добавляем монитор в глобальную область видимости
window.PerformanceMonitor = PerformanceMonitor;