// Основной класс приложения
class ObsidianApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentNote = null;
        this.init();
        this.imageData = this.loadImageData();
    }
    
    // Инициализация приложения
    init() {
        this.bindEvents();
        this.loadHomePage();
        this.updateStats();
        this.loadRecentNotes();
        this.loadTags();
        this.bindModalEvents();
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
3. **Фотографии** - добавляйте изображения к заметкам
4. **Теги** - организуйте заметки с помощью #тегов
5. **Граф связей** - визуализируйте связи между заметками

## Как добавить фото?

1. В редакторе нажмите кнопку "📷 Добавить фото"
2. Выберите изображение с компьютера
3. Фото будет добавлено в заметку

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
    
    // Загрузка данных изображений
    loadImageData() {
        const imageDataJson = localStorage.getItem('obsidianImages');
        return imageDataJson ? JSON.parse(imageDataJson) : {};
    }
    
    // Сохранение данных изображений
    saveImageData() {
        localStorage.setItem('obsidianImages', JSON.stringify(this.imageData));
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
        let html = content;
        
        // Обработка заголовков
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
                   .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                   .replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Обработка жирного текста
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Обработка курсива
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Обработка списков
        html = html.replace(/^\s*-\s+(.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Обработка изображений (кастомный синтаксис [image:id])
        html = html.replace(/\[image:(\w+)\]/g, (match, imageId) => {
            const imageData = this.imageData[imageId];
            if (imageData) {
                return `<div class="image-attachment">
                          <img src="${imageData.data}" 
                               alt="${imageData.name || 'Изображение'}" 
                               class="note-image" 
                               data-image-id="${imageId}">
                          <div class="image-caption">${imageData.name || ''}</div>
                        </div>`;
            }
            return '<span class="broken-link">[Изображение не найдено]</span>';
        });
        
        // Обработка ссылок на заметки
        html = html.replace(/\[\[(.*?)\]\]/g, (match, linkText) => {
            const linkedNote = this.getNoteByTitle(linkText);
            if (linkedNote) {
                return `<a href="#" class="internal-link" data-note-id="${linkedNote.id}">${linkText}</a>`;
            } else {
                return `<span class="broken-link">${linkText}</span>`;
            }
        });
        
        // Обработка тегов
        html = html.replace(/#(\w+)/g, '<span class="tag">#$1</span>');
        
        // Обработка абзацев
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/^\s*(.*)$/gm, '<p>$1</p>');
        
        return html;
    }
    
    // Добавление изображения
    async addImageToNote(noteId, file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                this.imageData[imageId] = {
                    id: imageId,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    noteId: noteId,
                    createdAt: new Date().toISOString()
                };
                
                this.saveImageData();
                
                // Добавляем маркер изображения в контент
                const note = this.getNoteById(noteId);
                if (note) {
                    const imageMarkdown = `\n[image:${imageId}]\n`;
                    this.updateNote(noteId, {
                        content: note.content + imageMarkdown
                    });
                }
                
                resolve(imageId);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // Получение изображений заметки
    getNoteImages(noteId) {
        return Object.values(this.imageData).filter(img => img.noteId === noteId);
    }
    
    // Навигация
    loadHomePage() {
        document.getElementById('page-content').innerHTML = `
            <div class="welcome-section">
                <h2>Добро пожаловать в Осинтан!</h2>
                <p>Система для заметок с перекрестными ссылками в стиле Obsidian с поддержкой фотографий.</p>
                
                <div class="features">
                    <div class="feature-card">
                        <i class="fas fa-link"></i>
                        <h3>Связанные заметки</h3>
                        <p>Используйте [[двойные скобки]] для создания ссылок между заметками</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-camera"></i>
                        <h3>Фотографии</h3>
                        <p>Добавляйте изображения к вашим заметкам</p>
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
                        <span id="total-images">${Object.keys(this.imageData).length}</span>
                        <small>Фотографий</small>
                    </div>
                </div>
                
                <button id="create-first-note" class="btn primary">
                    <i class="fas fa-plus"></i> Создать первую заметку
                </button>
            </div>
        `;
        
        // Привязываем событие кнопки
        const createBtn = document.getElementById('create-first-note');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.loadEditor();
            });
        }
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
                    <button id="add-photo" class="btn">
                        <i class="fas fa-camera"></i> Добавить фото
                    </button>
                    <input type="file" id="photo-input" accept="image/*" style="display: none;" multiple>
                </div>
                
                <div id="editor" contenteditable="true">${note.content}</div>
                
                <div class="image-preview" id="image-preview" style="margin-top: 20px; display: ${this.getNoteImages(note.id).length > 0 ? 'block' : 'none'}">
                    <h3>Прикрепленные фотографии</h3>
                    <div id="image-list" class="images-grid" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                        ${this.getNoteImages(note.id).map(img => `
                            <div style="position: relative;">
                                <img src="${img.data}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                                <button class="btn small delete-image" data-image-id="${img.id}" 
                                        style="position: absolute; top: 5px; right: 5px; padding: 2px 6px; background: var(--danger-color);">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.bindEditorEvents();
    }
    
    // Загрузка просмотра заметки
    loadNoteView(noteId) {
        const note = this.getNoteById(noteId);
        if (!note) return;
        
        const linkedNotes = this.getLinkedNotes(noteId);
        const images = this.getNoteImages(noteId);
        
        document.getElementById('page-content').innerHTML = `
            <div class="note-view">
                <div class="note-view-header">
                    <h1>${note.title}</h1>
                    <div class="note-meta">
                        <span>Создано: ${new Date(note.createdAt).toLocaleDateString()}</span>
                        <span>Обновлено: ${new Date(note.updatedAt).toLocaleDateString()}</span>
                        <span>Теги: ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}</span>
                        ${images.length > 0 ? `<span><i class="fas fa-camera"></i> ${images.length} фото</span>` : ''}
                    </div>
                </div>
                
                <div class="note-content">
                    ${this.renderContent(note.content)}
                </div>
                
                <div class="editor-actions">
                    <button id="edit-note" class="btn primary">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button id="add-photo-view" class="btn">
                        <i class="fas fa-camera"></i> Добавить фото
                    </button>
                    <input type="file" id="photo-input-view" accept="image/*" style="display: none;" multiple>
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
        
        // Привязываем события
        document.getElementById('edit-note').addEventListener('click', () => {
            this.loadEditor(noteId);
        });
        
        document.getElementById('add-photo-view').addEventListener('click', () => {
            document.getElementById('photo-input-view').click();
        });
        
        document.getElementById('photo-input-view').addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                await this.addImageToNote(noteId, file);
            }
            this.loadNoteView(noteId);
            this.showNotification(`Добавлено ${files.length} фотографий`);
        });
        
        this.bindLinkEvents();
        this.bindImageEvents();
    }
    
    // Загрузка графа
    loadGraph() {
        document.getElementById('page-content').innerHTML = `
            <div class="graph-container">
                <div class="graph-controls">
                    <button id="refresh-graph" class="btn">
                        <i class="fas fa-redo"></i> Обновить граф
                    </button>
                    <button id="add-image-node" class="btn">
                        <i class="fas fa-camera"></i> Добавить фото в граф
                    </button>
                    <input type="file" id="graph-image-input" accept="image/*" style="display: none;" multiple>
                </div>
                <canvas id="graph-canvas"></canvas>
            </div>
        `;
        
        this.renderGraph();
        
        // Привязываем события кнопок графа
        document.getElementById('refresh-graph').addEventListener('click', () => {
            this.renderGraph();
        });
        
        document.getElementById('add-image-node').addEventListener('click', () => {
            document.getElementById('graph-image-input').click();
        });
        
        document.getElementById('graph-image-input').addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            const note = this.createNote();
            note.title = `Фото: ${files.length > 1 ? 'Альбом' : files[0].name}`;
            note.tags = ['фото', 'изображение'];
            
            let content = `# ${note.title}\n\n`;
            
            for (const file of files) {
                const imageId = await this.addImageToNote(note.id, file);
                content += `[image:${imageId}]\n\n`;
            }
            
            this.updateNote(note.id, {
                title: note.title,
                content: content,
                tags: note.tags
            });
            
            this.renderGraph();
            this.showNotification(`Создана заметка с ${files.length} фотографиями`);
        });
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
                    ${results.length > 0 ? results.map(note => `
                        <div class="search-result-item" data-note-id="${note.id}">
                            <h3>${note.title}</h3>
                            <div class="preview">
                                ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}
                            </div>
                            <div class="tags">
                                ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                            </div>
                        </div>
                    `).join('') : '<p class="text-center">Ничего не найдено</p>'}
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
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        // Очистка канваса
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Подготавливаем данные
        const nodes = this.notes.map((note, index) => {
            const angle = (index / this.notes.length) * 2 * Math.PI;
            const radius = Math.min(canvas.width, canvas.height) * 0.35;
            const hasImages = this.getNoteImages(note.id).length > 0;
            
            return {
                id: note.id,
                title: note.title,
                x: canvas.width / 2 + radius * Math.cos(angle),
                y: canvas.height / 2 + radius * Math.sin(angle),
                radius: hasImages ? 25 : 20,
                color: hasImages ? '#ff6b6b' : '#8b6cef'
            };
        });
        
        // Рисуем связи
        this.notes.forEach(note => {
            const sourceNode = nodes.find(n => n.id === note.id);
            const links = this.extractLinks(note.content);
            
            links.forEach(linkText => {
                const targetNote = this.getNoteByTitle(linkText);
                if (targetNote) {
                    const targetNode = nodes.find(n => n.id === targetNote.id);
                    
                    // Рисуем линию
                    ctx.beginPath();
                    ctx.moveTo(sourceNode.x, sourceNode.y);
                    ctx.lineTo(targetNode.x, targetNode.y);
                    ctx.strokeStyle = 'rgba(139, 108, 239, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
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
            
            // Иконка камеры для заметок с фото
            if (node.radius > 20) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px FontAwesome';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('📷', node.x, node.y);
            }
            
            // Название
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(node.title.substring(0, 15), node.x, node.y + node.radius + 15);
        });
        
        // Обработка кликов
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
    }
    
    // Обновление статистики
    updateStats() {
        document.getElementById('total-notes')?.textContent = this.notes.length;
        document.getElementById('total-tags')?.textContent = this.getAllTags().length;
        document.getElementById('total-images')?.textContent = Object.keys(this.imageData).length;
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
        const data = {
            notes: this.notes,
            images: this.imageData
        };
        
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
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
                const data = JSON.parse(e.target.result);
                this.notes = data.notes || [];
                this.imageData = data.images || {};
                this.saveNotes();
                this.saveImageData();
                this.loadHomePage();
                this.showNotification('Данные успешно импортированы!');
            } catch (error) {
                this.showNotification('Ошибка при импорте файла', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    // Показ уведомления
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.backgroundColor = type === 'error' ? 'var(--danger-color)' : 'var(--success-color)';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Привязка событий модального окна
    bindModalEvents() {
        const modal = document.getElementById('image-modal');
        const closeBtn = document.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Показать изображение в модальном окне
    showImageModal(imageData) {
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-image');
        const imageInfo = document.getElementById('image-info');
        
        modalImg.src = imageData.data;
        imageInfo.textContent = `${imageData.name || 'Изображение'} (${Math.round(imageData.size / 1024)} KB)`;
        modal.style.display = 'flex';
    }
    
    // Привязка событий изображений
    bindImageEvents() {
        document.querySelectorAll('.note-image').forEach(img => {
            img.addEventListener('click', (e) => {
                const imageId = e.target.dataset.imageId;
                if (imageId && this.imageData[imageId]) {
                    this.showImageModal(this.imageData[imageId]);
                }
            });
        });
    }
    
    // Привязка основных событий
    bindEvents() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Удаляем активный класс
                document.querySelectorAll('.nav-item').forEach(nav => {
                    nav.classList.remove('active');
                });
                
                // Добавляем активный класс
                e.currentTarget.classList.add('active');
                
                // Загружаем страницу
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
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.loadSearch(e.target.value);
            });
        }
        
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
        const addPhotoBtn = document.getElementById('add-photo');
        const photoInput = document.getElementById('photo-input');
        
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
        
        if (addPhotoBtn) {
            addPhotoBtn.addEventListener('click', () => {
                photoInput.click();
            });
        }
        
        if (photoInput) {
            photoInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                for (const file of files) {
                    await this.addImageToNote(this.currentNote.id, file);
                }
                
                // Обновляем превью изображений
                const images = this.getNoteImages(this.currentNote.id);
                const imageList = document.getElementById('image-list');
                const imagePreview = document.getElementById('image-preview');
                
                if (imageList) {
                    imageList.innerHTML = images.map(img => `
                        <div style="position: relative;">
                            <img src="${img.data}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
                            <button class="btn small delete-image" data-image-id="${img.id}" 
                                    style="position: absolute; top: 5px; right: 5px; padding: 2px 6px; background: var(--danger-color);">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('');
                }
                
                if (imagePreview && images.length > 0) {
                    imagePreview.style.display = 'block';
                }
                
                this.showNotification(`Добавлено ${files.length} фотографий`);
                
                // Привязываем события удаления изображений
                document.querySelectorAll('.delete-image').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const imageId = e.currentTarget.dataset.imageId;
                        delete this.imageData[imageId];
                        this.saveImageData();
                        this.loadEditor(this.currentNote.id);
                    });
                });
            });
        }
        
        // Привязываем события удаления изображений
        document.querySelectorAll('.delete-image').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const imageId = e.currentTarget.dataset.imageId;
                delete this.imageData[imageId];
                this.saveImageData();
                this.loadEditor(this.currentNote.id);
            });
        });
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

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.obsidianApp = new ObsidianApp();
});