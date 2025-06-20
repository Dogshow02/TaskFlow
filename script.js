// TaskFlow - Gerenciador de Tarefas
// Esta é a classe principal que gerencia todas as funcionalidades das tarefas.
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'todas';
        this.editingTaskId = null;
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    bindEvents() {
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        document.getElementById('clearCompletedBtn').addEventListener('click', () => this.clearCompleted());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEdit());
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') this.closeEditModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeEditModal();
        });
    }

    loadTasks() {
        try {
            const tasks = localStorage.getItem('taskflow_tasks');
            return tasks ? JSON.parse(tasks) : [];
        } catch {
            return [];
        }
    }

    saveTasks() {
        localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const priority = document.getElementById('prioritySelect').value;
        const text = input.value.trim();
        if (!text) return this.showToast('Por favor, digite uma tarefa', 'error');

        const task = {
            id: this.generateId(),
            text,
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        input.value = '';
        document.getElementById('prioritySelect').value = 'media';
        this.showToast('Tarefa adicionada com sucesso!');
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showToast(task.completed ? 'Tarefa concluída!' : 'Tarefa reaberta!');
        }
    }

    deleteTask(id) {
        if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showToast('Tarefa excluída!');
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            document.getElementById('editTaskInput').value = task.text;
            document.getElementById('editPrioritySelect').value = task.priority;
            document.getElementById('editModal').classList.add('active');
        }
    }

    saveEdit() {
        const text = document.getElementById('editTaskInput').value.trim();
        const priority = document.getElementById('editPrioritySelect').value;
        if (!text) return this.showToast('Por favor, digite uma tarefa', 'error');

        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.text = text;
            task.priority = priority;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.closeEditModal();
            this.showToast('Tarefa atualizada!');
        }
    }

    closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
        this.editingTaskId = null;
    }

    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderTasks();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'pendentes': return this.tasks.filter(t => !t.completed);
            case 'concluidas': return this.tasks.filter(t => t.completed);
            case 'alta': return this.tasks.filter(t => t.priority === 'alta');
            default: return this.tasks;
        }
    }

    clearCompleted() {
        if (confirm('Tem certeza que deseja limpar as tarefas concluídas?')) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showToast('Tarefas concluídas removidas!');
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const filteredTasks = this.getFilteredTasks();
        container.innerHTML = '';

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Nenhuma tarefa encontrada</h3>
                    <p>Adicione sua primeira tarefa para começar a organizar seu dia!</p>
                </div>`;
            return;
        }

        filteredTasks.forEach(task => {
            const temp = document.createElement('div');
            temp.innerHTML = this.createTaskHTML(task);
            const taskElement = temp.firstElementChild;
            container.appendChild(taskElement);

            taskElement.querySelector('.task-checkbox').addEventListener('click', () => {
                this.toggleTask(task.id);
            });

            taskElement.querySelector('.edit-btn').addEventListener('click', () => {
                this.editTask(task.id);
            });

            taskElement.querySelector('.delete-btn').addEventListener('click', () => {
                this.deleteTask(task.id);
            });
        });
    }

    createTaskHTML(task) {
        return `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        document.getElementById('totalTasks').textContent = this.tasks.length;
        document.getElementById('completedTasks').textContent = this.tasks.filter(t => t.completed).length;
        document.getElementById('pendingTasks').textContent = this.tasks.filter(t => !t.completed).length;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

window.addEventListener('DOMContentLoaded', () => new TaskManager());


