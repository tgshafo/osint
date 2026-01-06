// ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.imageObserver = null;
        this.initImageLazyLoading();
    }
    
    // Мемоизация
    memoize(func, resolver = (...args) => JSON.stringify(args)) {
        return (...args) => {
            const key = resolver(...args);
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }
            const result = func(...args);
            this.cache.set(key, result);
            return result;
        };
    }
    
    // Дебаунс
    debounce(func, wait = 300) {
        return (...args) => {
            clearTimeout(this.debounceTimers.get(func));
            const timer = setTimeout(() => func(...args), wait);
            this.debounceTimers.set(func, timer);
        };
    }
    
    // Ленивая загрузка изображений
    initImageLazyLoading() {
        this.imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        this.imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '100px',
            threshold: 0.1
        });
    }
    
    // Сжатие данных
    compressData(data) {
        try {
            const json = JSON.stringify(data);
            // Простое сжатие для демо (в реальном приложении можно использовать LZ-строки)
            return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode('0x' + p1);
            }));
        } catch (e) {
            console.error('Compression failed:', e);
            return data;
        }
    }
    
    decompressData(compressed) {
        try {
            const json = decodeURIComponent(atob(compressed).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(json);
        } catch (e) {
            console.error('Decompression failed:', e);
            return compressed;
        }
    }
    
    // Виртуальный список
    createVirtualList(container, items, itemHeight, renderItem) {
        const visibleCount = Math.ceil(container.clientHeight / itemHeight);
        let startIndex = 0;
        
        const render = () => {
            const endIndex = Math.min(startIndex + visibleCount * 2, items.length);
            const visibleItems = items.slice(startIndex, endIndex);
            
            container.innerHTML = '';
            visibleItems.forEach((item, index) => {
                const itemElement = renderItem(item, startIndex + index);
                itemElement.style.position = 'absolute';
                itemElement.style.top = `${(startIndex + index) * itemHeight}px`;
                itemElement.style.height = `${itemHeight}px`;
                itemElement.classList.add('virtual-item');
                container.appendChild(itemElement);
            });
            
            container.style.height = `${items.length * itemHeight}px`;
        };
        
        const handleScroll = this.debounce(() => {
            const scrollTop = container.scrollTop;
            const newStartIndex = Math.floor(scrollTop / itemHeight) - Math.floor(visibleCount / 2);
            startIndex = Math.max(0, newStartIndex);
            render();
        }, 16);
        
        container.addEventListener('scroll', handleScroll);
        render();
        
        return {
            update: (newItems) => {
                items = newItems;
                render();
            }
        };
    }
    
    // Web Worker для тяжелых операций
    async processInWorker(operation, data) {
        if (!window.Worker) {
            // Fallback для браузеров без Worker
            return operation(data);
        }
        
        const workerCode = `
            self.onmessage = function(e) {
                const { operation, data } = e.data;
                let result;
                
                switch(operation) {
                    case 'search':
                        result = performSearch(data.query, data.notes);
                        break;
                    case 'graph':
                        result = calculateGraph(data.notes);
                        break;
                    case 'analyze':
                        result = analyzeContent(data.content);
                        break;
                }
                
                self.postMessage(result);
            };
            
            function performSearch(query, notes) {
                const results = [];
                const lowerQuery = query.toLowerCase();
                
                for (let i = 0; i < notes.length; i++) {
                    const note = notes[i];
                    if (note.title.toLowerCase().includes(lowerQuery) ||
                        note.content.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            id: note.id,
                            title: note.title,
                            relevance: calculateRelevance(note, query)
                        });
                    }
                }
                
                return results.sort((a, b) => b.relevance - a.relevance);
            }
            
            function calculateRelevance(note, query) {
                let score = 0;
                if (note.title.toLowerCase().includes(query.toLowerCase())) score += 10;
                if (note.content.toLowerCase().includes(query.toLowerCase())) score += 5;
                return score;
            }
        `;
        
        return new Promise((resolve) => {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            
            worker.onmessage = (e) => {
                resolve(e.data);
                worker.terminate();
            };
            
            worker.postMessage({ operation, data });
        });
    }
}

// РАСШИРЕННАЯ ОБРАБОТКА MARKDOWN

class MarkdownProcessor {
    constructor() {
        this.processors = {
            code: this.processCode.bind(this),
            table: this.processTable.bind(this),
            todo: this.processTodo.bind(this),
            math: this.processMath.bind(this),
            mermaid: this.processMermaid.bind(this),
            footnotes: this.processFootnotes.bind(this),
            abbr: this.processAbbreviations.bind(this),
            definition: this.processDefinition.bind(this),
            sup: this.processSuperscript.bind(this),
            sub: this.processSubscript.bind(this),
            mark: this.processHighlight.bind(this),
            kbd: this.processKeyboard.bind(this),
            details: this.processDetails.bind(this)
        };
        
        this.loadPrism();
    }
    
    loadPrism() {
        // Динамически загружаем Prism.js для подсветки кода
        if (!window.Prism) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js';
            script.onload = () => {
                this.loadPrismLanguages();
            };
            document.head.appendChild(script);
        }
    }
    
    loadPrismLanguages() {
        const languages = ['javascript', 'python', 'html', 'css', 'bash', 'json', 'sql'];
        languages.forEach(lang => {
            const script = document.createElement('script');
            script.src = `https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-${lang}.min.js`;
            document.head.appendChild(script);
        });
    }
    
    processCode(content) {
        // Обработка блоков кода с подсветкой синтаксиса
        return content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'text';
            const escaped = this.escapeHtml(code.trim());
            return `<div class="code-block">
                <div class="language-label">${language}</div>
                <pre><code class="language-${language}">${escaped}</code></pre>
            </div>`;
        });
    }
    
    processTable(content) {
        // Обработка таблиц
        return content.replace(/\|(.+)\|\n\|([-:| ]+)\|\n((?:\|.+\|\n?)*)/g, (match, headers, align, rows) => {
            const headerCells = headers.split('|').map(cell => cell.trim());
            const alignments = align.split('|').map(col => {
                if (col.startsWith(':') && col.endsWith(':')) return 'center';
                if (col.startsWith(':')) return 'left';
                if (col.endsWith(':')) return 'right';
                return 'left';
            });
            
            let table = '<div class="table-wrapper"><table><thead><tr>';
            headerCells.forEach((cell, i) => {
                table += `<th style="text-align: ${alignments[i] || 'left'}">${cell}</th>`;
            });
            table += '</tr></thead><tbody>';
            
            rows.trim().split('\n').forEach(row => {
                if (row.trim()) {
                    const cells = row.split('|').map(cell => cell.trim());
                    table += '<tr>';
                    cells.forEach((cell, i) => {
                        table += `<td style="text-align: ${alignments[i] || 'left'}">${cell}</td>`;
                    });
                    table += '</tr>';
                }
            });
            
            table += '</tbody></table></div>';
            return table;
        });
    }
    
    processTodo(content) {
        // Обработка списков задач
        return content.replace(/^- \[( |x)\] (.+)$/gm, (match, checked, text) => {
            const isChecked = checked === 'x';
            return `<div class="todo-item">
                <input type="checkbox" class="todo-checkbox" ${isChecked ? 'checked' : ''} onclick="this.nextElementSibling.style.textDecoration = this.checked ? 'line-through' : 'none'">
                <span>${text}</span>
            </div>`;
        });
    }
    
    processMath(content) {
        // Обработка математических формул (базовая поддержка)
        return content
            .replace(/\$\$([^$]+)\$\$/g, '<div class="math-block">$$$1$$</div>')
            .replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>');
    }
    
    processMermaid(content) {
        // Обработка диаграмм Mermaid
        return content.replace(/```mermaid\n([\s\S]*?)```/g, (match, diagram) => {
            const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
            return `<div class="mermaid-diagram" id="${id}">${diagram}</div>`;
        });
    }
    
    processFootnotes(content) {
        // Обработка сносок
        const footnotes = [];
        let footnoteCount = 1;
        
        content = content.replace(/\[\^(\d+)\]/g, (match, num) => {
            const id = `fn-${num}`;
            footnotes.push({ id, num, content: '' });
            return `<sup><a href="#fnref-${num}" id="${id}">[${num}]</a></sup>`;
        });
        
        content = content.replace(/\[\^(\d+)\]: (.+)/g, (match, num, text) => {
            const footnote = footnotes.find(f => f.num === num);
            if (footnote) footnote.content = text;
            return '';
        });
        
        if (footnotes.length > 0) {
            content += '\n<div class="footnotes">';
            footnotes.forEach(fn => {
                if (fn.content) {
                    content += `<div class="footnote" id="fnref-${fn.num}">`;
                    content += `<a href="#${fn.id}">↑</a> ${fn.content}`;
                    content += '</div>';
                }
            });
            content += '</div>';
        }
        
        return content;
    }
    
    processAbbreviations(content) {
        // Обработка аббревиатур
        return content.replace(/\*\[(.+?)\]: (.+)/g, (match, abbr, definition) => {
            return `<abbr title="${definition}">${abbr}</abbr>`;
        });
    }
    
    processDefinition(content) {
        // Обработка определений
        return content.replace(/^([^:]+):\n?: (.+)$/gm, '<dl><dt>$1</dt><dd>$2</dd></dl>');
    }
    
    processSuperscript(content) {
        return content.replace(/\^\((.+?)\)/g, '<sup>$1</sup>');
    }
    
    processSubscript(content) {
        return content.replace(/~\((.+?)\)/g, '<sub>$1</sub>');
    }
    
    processHighlight(content) {
        return content.replace(/==(.+?)==/g, '<mark>$1</mark>');
    }
    
    processKeyboard(content) {
        return content.replace(/<kbd>(.+?)<\/kbd>/g, '<kbd>$1</kbd>');
    }
    
    processDetails(content) {
        return content.replace(/<details>\s*<summary>(.+?)<\/summary>\s*(.+?)\s*<\/details>/gs, 
            '<details><summary>$1</summary><div>$2</div></details>');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    process(content) {
        let processed = content;
        
        // Применяем все процессоры
        Object.values(this.processors).forEach(processor => {
            processed = processor(processed);
        });
        
        // Базовая обработка Markdown (остается для совместимости)
        processed = processed
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="lazy-image" data-src="$2">')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
            .replace(/^\s*-\s+(.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^\s*(.*)$/gm, '<p>$1</p>');
        
        return processed;
    }
}

// ОБНОВЛЕННЫЙ КЛАСС ObsidianApp С ОПТИМИЗАЦИЯМИ

class ObsidianApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentNote = null;
        this.performance = new PerformanceOptimizer();
        this.markdown = new MarkdownProcessor();
        this.cache = new Map();
        this.noteProperties = this.loadNoteProperties();
        this.favorites = this.loadFavorites();
        this.readStatus = this.loadReadStatus();
        
        // Инициализация с оптимизациями
        this.initWithPerformance();
    }
    
    // Загрузка с оптимизациями
    initWithPerformance() {
        this.showLoading(true);
        
        // Загружаем данные с кэшированием
        setTimeout(() => {
            this.bindEvents();
            this.loadHomePage();
            this.updateStats();
            this.loadRecentNotes();
            this.loadTags();
            this.bindModalEvents();
            this.initNewFeatures();
            this.setupPerformanceMonitoring();
            
            this.showLoading(false);
        }, 100);
    }
    
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }
    
    // Оптимизированная загрузка заметок
    loadNotes() {
        const notesJson = localStorage.getItem('obsidianNotes');
        if (notesJson) {
            try {
                return this.performance.decompressData(notesJson);
            } catch {
                return JSON.parse(notesJson) || [];
            }
        }
        
        const demoNotes = [/* демо заметки */];
        this.saveNotes(demoNotes);
        return demoNotes;
    }
    
    // Оптимизированное сохранение
    saveNotes(notes = this.notes) {
        const compressed = this.performance.compressData(notes);
        localStorage.setItem('obsidianNotes', compressed);
        
        // Инвалидируем кэш
        this.cache.clear();
        
        // Асинхронное обновление UI
        setTimeout(() => {
            this.updateStats();
            this.loadRecentNotes();
            this.loadTags();
        }, 0);
    }
    
    // Оптимизированный рендеринг
    renderContent(content) {
        const cacheKey = `render_${content.length}_${content.hashCode()}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const rendered = this.markdown.process(content);
        this.cache.set(cacheKey, rendered);
        
        // Ограничиваем размер кэша
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        return rendered;
    }
    
    // Оптимизированный поиск
    searchNotes(query) {
        const cacheKey = `search_${query}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const results = this.performance.memoize((q) => {
            if (!q.trim()) return this.notes;
            
            const lowerQuery = q.toLowerCase();
            return this.notes.filter(note => {
                // Взвешенный поиск
                const titleScore = note.title.toLowerCase().includes(lowerQuery) ? 10 : 0;
                const contentScore = note.content.toLowerCase().includes(lowerQuery) ? 5 : 0;
                const tagScore = note.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ? 8 : 0;
                
                note.searchScore = titleScore + contentScore + tagScore;
                return note.searchScore > 0;
            }).sort((a, b) => b.searchScore - a.searchScore);
        })(query);
        
        this.cache.set(cacheKey, results);
        return results;
    }
    
    // Улучшенная навигация
    setupEnhancedNavigation() {
        // История просмотра
        this.navigationHistory = JSON.parse(localStorage.getItem('navHistory') || '[]');
        this.historyIndex = this.navigationHistory.length - 1;
        
        // Быстрая навигация
        this.setupQuickNavigation();
        
        // Навигация по связям
        this.setupLinkNavigation();
    }
    
    setupQuickNavigation() {
        const quickNav = document.getElementById('quick-nav');
        const input = document.getElementById('quick-nav-input');
        const results = document.querySelector('.quick-nav-results');
        
        if (!input || !results) return;
        
        // Показ/скрытие по Ctrl+O
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                quickNav.style.display = quickNav.style.display === 'block' ? 'none' : 'block';
                if (quickNav.style.display === 'block') {
                    input.value = '';
                    input.focus();
                    this.updateQuickNavResults('');
                }
            }
        });
        
        // Поиск при вводе
        input.addEventListener('input', this.performance.debounce((e) => {
            this.updateQuickNavResults(e.target.value);
        }, 150));
        
        // Закрытие по Escape
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                quickNav.style.display = 'none';
            }
        });
    }
    
    updateQuickNavResults(query) {
        const results = document.querySelector('.quick-nav-results');
        if (!results) return;
        
        const filtered = this.searchNotes(query).slice(0, 10);
        
        results.innerHTML = filtered.map(note => `
            <div class="quick-nav-item" data-note-id="${note.id}">
                <div>
                    <div class="nav-title">${note.title}</div>
                    <div class="nav-path">${this.getNotePath(note.id)}</div>
                </div>
                <div class="nav-hotkey">↲</div>
            </div>
        `).join('');
        
        // Привязываем события
        results.querySelectorAll('.quick-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = item.dataset.noteId;
                this.loadNoteView(noteId);
                document.getElementById('quick-nav').style.display = 'none';
            });
        });
    }
    
    getNotePath(noteId) {
        const note = this.getNoteById(noteId);
        if (!note) return '';
        
        // Получаем связанные заметки
        const linked = this.getLinkedNotes(noteId);
        
        // Находим "родительскую" заметку (которая чаще всего ссылается на эту)
        if (linked.incoming.length > 0) {
            const parent = linked.incoming[0];
            return `${parent.title} → ${note.title}`;
        }
        
        return note.tags[0] || 'Без категории';
    }
    
    setupLinkNavigation() {
        // Динамическая обработка ссылок на лету
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.internal-link');
            if (link) {
                e.preventDefault();
                const noteId = link.dataset.noteId;
                this.navigateToNote(noteId);
            }
        });
    }
    
    navigateToNote(noteId) {
        // Добавляем в историю
        this.addToHistory(noteId);
        
        // Загружаем заметку
        this.loadNoteView(noteId);
        
        // Прокручиваем к верху
        window.scrollTo(0, 0);
        
        // Обновляем навигацию
        this.updateNavigationControls();
    }
    
    addToHistory(noteId) {
        if (this.navigationHistory[this.navigationHistory.length - 1] !== noteId) {
            this.navigationHistory.push(noteId);
            
            // Ограничиваем историю
            if (this.navigationHistory.length > 50) {
                this.navigationHistory.shift();
            }
            
            this.historyIndex = this.navigationHistory.length - 1;
            localStorage.setItem('navHistory', JSON.stringify(this.navigationHistory));
        }
    }
    
    navigateBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const noteId = this.navigationHistory[this.historyIndex];
            this.loadNoteView(noteId);
            this.updateNavigationControls();
        }
    }
    
    navigateForward() {
        if (this.historyIndex < this.navigationHistory.length - 1) {
            this.historyIndex++;
            const noteId = this.navigationHistory[this.historyIndex];
            this.loadNoteView(noteId);
            this.updateNavigationControls();
        }
    }
    
    updateNavigationControls() {
        const backBtn = document.getElementById('nav-back');
        const forwardBtn = document.getElementById('nav-forward');
        
        if (backBtn) {
            backBtn.disabled = this.historyIndex <= 0;
        }
        if (forwardBtn) {
            forwardBtn.disabled = this.historyIndex >= this.navigationHistory.length - 1;
        }
    }
    
    // Система свойств заметок
    loadNoteProperties() {
        const props = localStorage.getItem('noteProperties');
        return props ? JSON.parse(props) : {};
    }
    
    saveNoteProperties() {
        localStorage.setItem('noteProperties', JSON.stringify(this.noteProperties));
    }
    
    getNoteProperty(noteId, property, defaultValue = null) {
        if (!this.noteProperties[noteId]) {
            this.noteProperties[noteId] = {};
        }
        return this.noteProperties[noteId][property] || defaultValue;
    }
    
    setNoteProperty(noteId, property, value) {
        if (!this.noteProperties[noteId]) {
            this.noteProperties[noteId] = {};
        }
        this.noteProperties[noteId][property] = value;
        this.saveNoteProperties();
    }
    
    openNoteProperties(noteId) {
        const modal = document.getElementById('note-properties');
        if (!modal) return;
        
        const priority = this.getNoteProperty(noteId, 'priority', 'medium');
        const status = this.getNoteProperty(noteId, 'status', 'in-progress');
        const marker = this.getNoteProperty(noteId, 'marker', '');
        
        document.getElementById('note-priority').value = priority;
        document.getElementById('note-status').value = status;
        document.getElementById('note-marker').value = marker;
        
        modal.style.display = 'block';
        
        // Сохраняем при изменениях
        document.getElementById('note-priority').onchange = () => {
            this.setNoteProperty(noteId, 'priority', document.getElementById('note-priority').value);
        };
        
        document.getElementById('note-status').onchange = () => {
            this.setNoteProperty(noteId, 'status', document.getElementById('note-status').value);
        };
        
        document.getElementById('note-marker').onchange = () => {
            this.setNoteProperty(noteId, 'marker', document.getElementById('note-marker').value);
        };
    }
    
    // Система избранного
    loadFavorites() {
        const favs = localStorage.getItem('favorites');
        return new Set(favs ? JSON.parse(favs) : []);
    }
    
    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify([...this.favorites]));
    }
    
    toggleFavorite(noteId) {
        if (this.favorites.has(noteId)) {
            this.favorites.delete(noteId);
        } else {
            this.favorites.add(noteId);
        }
        this.saveFavorites();
    }
    
    isFavorite(noteId) {
        return this.favorites.has(noteId);
    }
    
    // Система статуса прочтения
    loadReadStatus() {
        const status = localStorage.getItem('readStatus');
        return status ? JSON.parse(status) : {};
    }
    
    saveReadStatus() {
        localStorage.setItem('readStatus', JSON.stringify(this.readStatus));
    }
    
    markAsRead(noteId) {
        this.readStatus[noteId] = new Date().toISOString();
        this.saveReadStatus();
    }
    
    isUnread(noteId) {
        return !this.readStatus[noteId];
    }
    
    // Улучшенный редактор
    loadEditor(noteId = null) {
        // ... существующий код ...
        
        // Добавляем кнопку свойств
        const propsBtn = document.createElement('button');
        propsBtn.className = 'btn';
        propsBtn.innerHTML = '<i class="fas fa-cog"></i> Свойства';
        propsBtn.addEventListener('click', () => this.openNoteProperties(this.currentNote.id));
        document.querySelector('.editor-actions').appendChild(propsBtn);
        
        // Добавляем кнопку избранного
        const favBtn = document.createElement('button');
        favBtn.className = 'btn';
        favBtn.innerHTML = this.isFavorite(this.currentNote.id) 
            ? '<i class="fas fa-star"></i> В избранном'
            : '<i class="far fa-star"></i> В избранное';
        favBtn.addEventListener('click', () => {
            this.toggleFavorite(this.currentNote.id);
            favBtn.innerHTML = this.isFavorite(this.currentNote.id)
                ? '<i class="fas fa-star"></i> В избранном'
                : '<i class="far fa-star"></i> В избранное';
        });
        document.querySelector('.editor-actions').appendChild(favBtn);
    }
    
    // Улучшенный просмотр заметки
    loadNoteView(noteId) {
        // ... существующий код ...
        
        // Добавляем панель навигации
        const noteView = document.querySelector('.note-view');
        if (noteView) {
            const toolbar = document.createElement('div');
            toolbar.className = 'note-toolbar';
            toolbar.innerHTML = `
                <div class="nav-controls">
                    <button id="nav-back"><i class="fas fa-arrow-left"></i> Назад</button>
                    <button id="nav-forward"><i class="fas fa-arrow-right"></i> Вперед</button>
                    <button id="nav-properties"><i class="fas fa-cog"></i> Свойства</button>
                    <button id="nav-favorite">
                        ${this.isFavorite(noteId) ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>'}
                    </button>
                </div>
                <div class="note-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${this.calculateNoteProgress(noteId)}%"></div>
                    </div>
                    <span>${Math.round(this.calculateNoteProgress(noteId))}%</span>
                </div>
            `;
            noteView.insertBefore(toolbar, noteView.firstChild);
            
            // Привязываем события
            document.getElementById('nav-back').addEventListener('click', () => this.navigateBack());
            document.getElementById('nav-forward').addEventListener('click', () => this.navigateForward());
            document.getElementById('nav-properties').addEventListener('click', () => this.openNoteProperties(noteId));
            document.getElementById('nav-favorite').addEventListener('click', () => {
                this.toggleFavorite(noteId);
                document.getElementById('nav-favorite').innerHTML = this.isFavorite(noteId) 
                    ? '<i class="fas fa-star"></i>' 
                    : '<i class="far fa-star"></i>';
            });
        }
        
        // Помечаем как прочитанную
        this.markAsRead(noteId);
    }
    
    calculateNoteProgress(noteId) {
        const note = this.getNoteById(noteId);
        if (!note) return 0;
        
        // Простой расчет прогресса по заполненности
        const content = note.content || '';
        const title = note.title || '';
        
        if (content.length < 100) return 10;
        if (content.length < 500) return 30;
        if (content.length < 1000) return 60;
        if (content.length < 2000) return 80;
        return 100;
    }
    
    // Оптимизированный граф
    renderOptimizedGraph() {
        const canvas = document.getElementById('graph-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Используем Barnes-Hut алгоритм для больших графов
        if (this.notes.length > 100) {
            this.renderBarnesHutGraph(ctx, canvas.width, canvas.height);
        } else {
            this.renderSimpleGraph(ctx, canvas.width, canvas.height);
        }
    }
    
    renderBarnesHutGraph(ctx, width, height) {
        // Упрощенная версия Barnes-Hut алгоритма
        const nodes = this.notes.map((note, i) => ({
            id: note.id,
            x: Math.random() * width,
            y: Math.random() * height,
            vx: 0,
            vy: 0,
            radius: this.getNoteImages(note.id).length > 0 ? 25 : 20,
            color: this.getNoteImages(note.id).length > 0 ? '#ff6b6b' : '#8b6cef'
        }));
        
        // Симуляция сил
        for (let iteration = 0; iteration < 100; iteration++) {
            nodes.forEach(node => {
                // Отталкивание
                nodes.forEach(other => {
                    if (node === other) return;
                    
                    const dx = other.x - node.x;
                    const dy = other.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        const force = -1000 / (distance * distance);
                        node.vx += force * dx / distance;
                        node.vy += force * dy / distance;
                    }
                });
                
                // Притяжение связей
                const note = this.getNoteById(node.id);
                const links = this.extractLinks(note.content);
                
                links.forEach(linkText => {
                    const targetNote = this.getNoteByTitle(linkText);
                    if (targetNote) {
                        const targetNode = nodes.find(n => n.id === targetNote.id);
                        if (targetNode) {
                            const dx = targetNode.x - node.x;
                            const dy = targetNode.y - node.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance > 0) {
                                const force = distance * 0.01;
                                node.vx += force * dx / distance;
                                node.vy += force * dy / distance;
                            }
                        }
                    }
                });
                
                // Демпфирование
                node.vx *= 0.95;
                node.vy *= 0.95;
                
                // Обновление позиции
                node.x += node.vx;
                node.y += node.vy;
                
                // Границы
                node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
                node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
            });
        }
        
        // Рисуем граф
        this.drawGraph(ctx, nodes, width, height);
    }
    
    drawGraph(ctx, nodes, width, height) {
        // Очищаем канвас
        ctx.clearRect(0, 0, width, height);
        
        // Рисуем связи
        nodes.forEach(node => {
            const note = this.getNoteById(node.id);
            const links = this.extractLinks(note.content);
            
            links.forEach(linkText => {
                const targetNote = this.getNoteByTitle(linkText);
                if (targetNote) {
                    const targetNode = nodes.find(n => n.id === targetNote.id);
                    if (targetNode) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(targetNode.x, targetNode.y);
                        ctx.strokeStyle = 'rgba(139, 108, 239, 0.2)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            });
        });
        
        // Рисуем узлы
        nodes.forEach(node => {
            // Круг
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Иконка
            if (node.radius > 20) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('📷', node.x, node.y);
            }
            
            // Название (только для видимых узлов)
            if (node.x > 0 && node.x < width && node.y > 0 && node.y < height) {
                const note = this.getNoteById(node.id);
                if (note) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(note.title.substring(0, 12), node.x, node.y + node.radius + 10);
                }
            }
        });
    }
    
    // Мониторинг производительности
    setupPerformanceMonitoring() {
        this.performanceStats = {
            renderTime: 0,
            searchTime: 0,
            saveTime: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
        
        // Периодическая очистка кэша
        setInterval(() => {
            if (this.cache.size > 500) {
                const keys = Array.from(this.cache.keys());
                for (let i = 0; i < 100; i++) {
                    this.cache.delete(keys[i]);
                }
            }
        }, 60000); // Каждую минуту
    }
    
    showPerformanceStats() {
        const stats = this.performanceStats;
        const hitRate = stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100 || 0;
        
        alert(`Статистика производительности:
        Среднее время рендеринга: ${stats.renderTime.toFixed(2)}ms
        Среднее время поиска: ${stats.searchTime.toFixed(2)}ms
        Среднее время сохранения: ${stats.saveTime.toFixed(2)}ms
        Попаданий в кэш: ${stats.cacheHits}
        Промахов кэша: ${stats.cacheMisses}
        Эффективность кэша: ${hitRate.toFixed(1)}%
        Размер кэша: ${this.cache.size} записей`);
    }
}

// Вспомогательные функции
String.prototype.hashCode = function() {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash;
};

// Инициализация приложения с оптимизациями
document.addEventListener('DOMContentLoaded', () => {
    // Показываем загрузку
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'flex';
    
    // Инициализируем приложение
    window.obsidianApp = new ObsidianApp();
    
    // Прячем загрузку после инициализации
    setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
    }, 500);
});