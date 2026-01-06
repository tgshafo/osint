// Основной класс приложения
class ObsidianApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentNote = null;
        this.init();
    }
    
    // Инициализация приложения
    init() {
        this.bindEvents();
        this.loadHomePage();
        this.updateStats();
        this.loadRecentNotes();
        this.loadTags();
    }
    
    // Загрузка заметок из localStorage
    loadNotes() {
        const notesJson = localStorage.getItem('obsidianNotes');
        if (notesJson) {
            return JSON.parse(notesJson);
        }
        
        // Создаем несколько демо-заметок
        const demoNotes = [
            {
                id: '1',
                title: 'Добро пожаловать в Осинтан',
                content: `# Добро пожаловать!

Это ваша первая заметка в системе Осинтан — инструменте для создания заметок с перекрестными ссылками.

## Основные возможности:

1. **Создание заметок** - просто начните писать
2. **Перекрестные ссылки** - используйте [[двойные скобки]]
3. **Теги** - организуйте заметки с помощью #тегов
4. **Граф связей** - визуализируйте связи между заметками

## Пример использования ссылок:

Создайте новую заметку с названием "Идеи проекта", а затем ссылайтесь на нее так: [[Идеи проекта]]

Попробуйте создать [[Вторая заметка]] и посмотрите, как формируются связи.

---
*Создано: ${new Date().toLocaleString()}*`,
                tags: ['добро пожаловать', 'инструкция'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Вторая заметка',
                content: `# Вторая заметка

Эта заметка связана с [[Добро пожаловать в Осинтан]].

## Связи между заметками

Когда вы используете [[двойные скобки]], система автоматически создает связи между заметками. Это помогает создавать сеть знаний.

## Теги

Можно добавлять теги: #пример #тестирование

---
*Создано: ${new Date().toISOString()}*`,
                tags: ['пример', 'тестирование'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        this.saveNotes(demoNotes);
        return demoNotes;
    }
    
    // Сохранение заметок
    saveNotes(notes = this.notes) {
        localStorage.setItem('obsidianNotes', JSON.stringify(notes));
        this.updateStats();
        this.loadRecentNotes();
        this.loadTags();
    }
    
    // Поиск заметок
    searchNotes(query) {
        if (!query) return this.notes;
        
        const lowerQuery = query.toLowerCase();
        return this.notes.filter(note => 
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }
    
    // Получение заметки по ID
    getNoteById(id) {
        return this.notes.find(note => note.id === id);
    }
    
    // Получение заметки по названию
    getNoteByTitle(title) {
        return this.notes.find(note => 
            note.title.toLowerCase() === title.toLowerCase()
        );
    }
    
    // Создание новой заметки
    createNote() {
        const id = Date.now().toString();
        const newNote = {
            id,
            title: 'Новая заметка',
            content: '',
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.push(newNote);
        this.saveNotes();
        return newNote;
    }
    
    // Обновление заметки
    updateNote(id, updates) {
        const index = this.notes.findIndex(note => note.id === id);
        if (index !== -1) {
            this.notes[index] = {
                ...this.notes[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveNotes();
        }
    }
    
    // Удаление заметки
    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
    }
    
    // Извлечение ссылок из контента
    extractLinks(content) {
        const linkRegex = /\[\[(.*?)\]\]/g;
        const links = [];
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
            links.push(match[1]);
        }
        
        return links;
    }
    
    // Получение связанных заметок
    getLinkedNotes(noteId) {
        const note = this.getNoteById(noteId);
        if (!note) return { outgoing: [], incoming: [] };
        
        const outgoingLinks = this.extractLinks(note.content);
        const outgoingNotes = outgoingLinks
            .map(link => this.getNoteByTitle(link))
            .filter(Boolean);
        
        const incomingNotes = this.notes.filter(otherNote => {
            if (otherNote.id === noteId) return false;
            const links = this.extractLinks(otherNote.content);
            return links.some(link => 
                link.toLowerCase() === note.title.toLowerCase()
            );
        });
        
        return {
            outgoing: outgoingNotes,
            incoming: incomingNotes
        };
    }
    
    // Получение всех тегов
    getAllTags() {
        const tags = new Set();
        this.notes.forEach(note => {
            note.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }
    
    // Обработка Markdown и ссылок
    renderContent(content) {
        // Обработка заголовков
        let html = content
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            
            // Обработка жирного текста
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            
            // Обработка курсива
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // Обработка списков
            .replace(/^\s*-\s+(.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            
            // Обработка ссылок
            .replace(/\[\[(.*?)\]\]/g, (match, linkText) => {
                const linkedNote = this.getNoteByTitle(linkText);
                if (linkedNote) {
                    return `<a href="#" class="internal-link" data-note-id="${linkedNote.id}">${linkText}</a>`;
                } else {
                    return `<span class="broken-link">${linkText}</span>`;
                }
            })
            
            // Обработка тегов
            .replace(/#(\w+)/g, '<span class="tag">#$1</span>')
            
            // Обработка абзацев
            .replace(/\n\n/g, '</p><p>')
            .replace(/^\s*(.*)$/gm, '<p>$1</p>');
        
        return html;
    }
    
    // Навигация
    loadHomePage() {
        document.getElementById('page-content').innerHTML = `
            <div class="welcome-section">
                <h2>Добро пожаловать в Осинтан!</h2>
                <p>Система для заметок с перекрестными ссылками в стиле Obsidian.</p>
                
                <div class="features">
                    <div class="feature-card">
                        <i class="fas fa-link"></i>
                        <h3>Связанные заметки</h3>
                        <p>Используйте [[двойные скобки]] для создания ссылок между заметками</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-tags"></i>
                        <h3>Теги</h3>
                        <p>Организуйте заметки с помощью тегов</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-project-diagram"></i>
                        <h3>Визуализация графа</h3>
                        <p>Смотрите связи между вашими заметками</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-search"></i>
                        <h3>Поиск</h3>
                        <p>Быстро находите нужную информацию</p>
                    </div>
                </div>
                
                <div class="quick-stats">
                    <div class="stat">
                        <span id="total-notes">${this.notes.length}</span>
                        <small>Всего заметок</small>
                    </div>
                    <div class="stat">
                        <span id="total-tags">${this.getAllTags().length}</span>
                        <small>Тегов</small>
                    </div>
                    <div class="stat">
                        <span id="total-links">${this.calculateTotalLinks()}</span>
                        <small>Связей</small>
                    </div>
                </div>
                
                <button id="create-first-note" class="btn primary">
                    <i class="fas fa-plus"></i> Создать первую заметку
                </button>
            </div>
        `;
    }
    
    // Расчет общего количества связей
    calculateTotalLinks() {
        let totalLinks = 0;
        this.notes.forEach(note => {
            totalLinks += this.extractLinks(note.content).length;
        });
        return totalLinks;
    }
    
    // Загрузка редактора
    loadEditor(noteId = null) {
        let note;
        if (noteId) {
            note = this.getNoteById(noteId);
        } else {
            note = this.createNote();
        }
        
        this.currentNote = note;
        
        document.getElementById('page-content').innerHTML = `
            <div class="editor-container">
                <div class="editor-header">
                    <input type="text" id="note-title" value="${note.title}" placeholder="Название заметки">
                    <input type="text" id="note-tags" value="${note.tags.join(', ')}" placeholder="Теги через запятую">
                </div>
                
                <div class="editor-actions">
                    <button id="save-note" class="btn primary">
                        <i class="fas fa-save"></i> Сохранить
                    </button>
                    <button id="delete-note" class="btn">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                    <button id="preview-note" class="btn">
                        <i class="fas fa-eye"></i> Просмотр
                    </button>
                </div>
                
                <div id="editor" contenteditable="true">${note.content}</div>
            </div>
        `;
        
        this.bindEditorEvents();
    }
    
    // Загрузка просмотра заметки
    loadNoteView(noteId) {
        const note = this.getNoteById(noteId);
        if (!note) return;
        
        const linkedNotes = this.getLinkedNotes(noteId);
        
        document.getElementById('page-content').innerHTML = `
            <div class="note-view">
                <div class="note-view-header">
                    <h1>${note.title}</h1>
                    <div class="note-meta">
                        <span>Создано: ${new Date(note.createdAt).toLocaleDateString()}</span>
                        <span>Обновлено: ${new Date(note.updatedAt).toLocaleDateString()}</span>
                        <span>Теги: ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</span>
                    </div>
                </div>
                
                <div class="note-content">
                    ${this.renderContent(note.content)}
                </div>
                
                <div class="editor-actions">
                    <button id="edit-note" class="btn primary">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                </div>
                
                <div class="note-links">
                    ${linkedNotes.incoming.length > 0 ? `
                        <div class="link-section">
                            <h3>Ссылаются на эту заметку</h3>
                            <div class="link-list">
                                ${linkedNotes.incoming.map(linkedNote => `
                                    <div class="link-item" data-note-id="${linkedNote.id}">
                                        ${linkedNote.title}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${linkedNotes.outgoing.length > 0 ? `
                        <div class="link-section">
                            <h3>Эта заметка ссылается на</h3>
                            <div class="link-list">
                                ${linkedNotes.outgoing.map(linkedNote => `
                                    <div class="link-item" data-note-id="${linkedNote.id}">
                                        ${linkedNote.title}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.getElementById('edit-note').addEventListener('click', () => {
            this.loadEditor(noteId);
        });
        
        this.bindLinkEvents();
    }
    
    // Загрузка графа
    loadGraph() {
        document.getElementById('page-content').innerHTML = `
            <div class="graph-container">
                <div class="graph-controls">
                    <button id="refresh-graph" class="btn">
                        <i class="fas fa-redo"></i> Обновить
                    </button>
                </div>
                <canvas id="graph-canvas"></canvas>
            </div>
        `;
        
        this.renderGraph();
    }
    
    // Загрузка поиска
    loadSearch(query = '') {
        const results = this.searchNotes(query);
        
        document.getElementById('page-content').innerHTML = `
            <div class="search-results">
                <div class="search-results-header">
                    <h2>Поиск заметок</h2>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-input" value="${query}" placeholder="Введите поисковый запрос...">
                    </div>
                </div>
                
                <div id="search-results-list">
                    ${results.map(note => `
                        <div class="search-result-item" data-note-id="${note.id}">
                            <h3>${note.title}</h3>
                            <div class="preview">
                                ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}
                            </div>
                            <div class="tags">
                                ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.loadSearch(e.target.value);
        });
        
        this.bindSearchEvents();
    }
    
    // Отрисовка графа
    renderGraph() {
        const canvas = document.getElementById('graph-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight - 50;
        
        // Очистка канваса
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Расположение узлов
        const nodes = this.notes.map((note, index) => {
            const angle = (index / this.notes.length) * 2 * Math.PI;
            const radius = Math.min(canvas.width, canvas.height) * 0.35;
            
            return {
                id: note.id,
                title: note.title,
                x: canvas.width / 2 + radius * Math.cos(angle),
                y: canvas.height / 2 + radius * Math.sin(angle),
                radius: 20
            };
        });
        
        // Отрисовка связей
        this.notes.forEach(note => {
            const sourceNode = nodes.find(n => n.id === note.id);
            const links = this.extractLinks(note.content);
            
            links.forEach(linkText => {
                const targetNote = this.getNoteByTitle(linkText);
                if (targetNote) {
                    const targetNode = nodes.find(n => n.id === targetNote.id);
                    
                    // Рисование линии
                    ctx.beginPath();
                    ctx.moveTo(sourceNode.x, sourceNode.y);
                    ctx.lineTo(targetNode.x, targetNode.y);
                    ctx.strokeStyle = 'rgba(139, 108, 239, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });
        });
        
        // Отрисовка узлов
        nodes.forEach(node => {
            // Рисование круга
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#8b6cef';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Рисование текста
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(node.title.substring(0, 15), node.x, node.y + 30);
        });
        
        // Обработка кликов по узлам
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            nodes.forEach(node => {
                const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
                if (distance <= node.radius) {
                    this.loadNoteView(node.id);
                }
            });
        });
        
        document.getElementById('refresh-graph').addEventListener('click', () => {
            this.renderGraph();
        });
    }
    
    // Обновление статистики
    updateStats() {
        document.getElementById('total-notes')?.textContent = this.notes.length;
        document.getElementById('total-tags')?.textContent = this.getAllTags().length;
        document.getElementById('total-links')?.textContent = this.calculateTotalLinks();
    }
    
    // Загрузка последних заметок
    loadRecentNotes() {
        const recentNotes = [...this.notes]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);
        
        const recentNotesContainer = document.getElementById('recent-notes');
        if (recentNotesContainer) {
            recentNotesContainer.innerHTML = recentNotes.map(note => `
                <div class="note-item" data-note-id="${note.id}">
                    ${note.title}
                </div>
            `).join('');
            
            // Добавление обработчиков событий
            recentNotesContainer.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const noteId = e.currentTarget.dataset.noteId;
                    this.loadNoteView(noteId);
                });
            });
        }
    }
    
    // Загрузка тегов
    loadTags() {
        const tags = this.getAllTags();
        const tagsContainer = document.getElementById('tags-list');
        
        if (tagsContainer) {
            tagsContainer.innerHTML = tags.map(tag => `
                <span class="tag" data-tag="${tag}">${tag}</span>
            `).join('');
            
            // Добавление обработчиков событий
            tagsContainer.querySelectorAll('.tag').forEach(tagElement => {
                tagElement.addEventListener('click', (e) => {
                    const tag = e.currentTarget.dataset.tag;
                    this.loadSearch(`#${tag}`);
                });
            });
        }
    }
    
    // Экспорт заметок
    exportNotes() {
        const data = JSON.stringify(this.notes, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `obsidian-notes-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Импорт заметок
    importNotes(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedNotes = JSON.parse(e.target.result);
                this.notes = importedNotes;
                this.saveNotes();
                this.loadHomePage();
                alert('Заметки успешно импортированы!');
            } catch (error) {
                alert('Ошибка при импорте файла');
            }
        };
        reader.readAsText(file);
    }
    
    // Привязка событий
    bindEvents() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Удаление активного класса
                document.querySelectorAll('.nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                
                // Добавление активного класса
                e.currentTarget.classList.add('active');
                
                // Загрузка страницы
                const page = e.currentTarget.dataset.page;
                switch(page) {
                    case 'home':
                        this.loadHomePage();
                        break;
                    case 'new-note':
                        this.loadEditor();
                        break;
                    case 'graph':
                        this.loadGraph();
                        break;
                    case 'search':
                        this.loadSearch();
                        break;
                }
            });
        });
        
        // Глобальный поиск
        document.getElementById('global-search')?.addEventListener('input', (e) => {
            this.loadSearch(e.target.value);
        });
        
        // Создание первой заметки
        document.getElementById('create-first-note')?.addEventListener('click', () => {
            this.loadEditor();
        });
        
        // Экспорт/импорт
        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportNotes();
        });
        
        document.getElementById('import-btn')?.addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file')?.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.importNotes(e.target.files[0]);
            }
        });
    }
    
    // Привязка событий редактора
    bindEditorEvents() {
        const saveBtn = document.getElementById('save-note');
        const deleteBtn = document.getElementById('delete-note');
        const previewBtn = document.getElementById('preview-note');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.updateNote(this.currentNote.id, {
                    title: document.getElementById('note-title').value,
                    content: document.getElementById('editor').innerText,
                    tags: document.getElementById('note-tags').value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag)
                });
                
                this.loadNoteView(this.currentNote.id);
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (confirm('Удалить эту заметку?')) {
                    this.deleteNote(this.currentNote.id);
                    this.loadHomePage();
                }
            });
        }
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.loadNoteView(this.currentNote.id);
            });
        }
    }
    
    // Привязка событий ссылок
    bindLinkEvents() {
        document.querySelectorAll('.internal-link, .link-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const noteId = e.currentTarget.dataset.noteId;
                if (noteId) {
                    this.loadNoteView(noteId);
                }
            });
        });
    }
    
    // Привязка событий поиска
    bindSearchEvents() {
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const noteId = e.currentTarget.dataset.noteId;
                this.loadNoteView(noteId);
            });
        });
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ObsidianApp();
});