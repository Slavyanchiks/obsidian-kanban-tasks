import { App } from 'obsidian';
import { KanbanBoard, Task } from '../types';

/**
 * Менеджер для записи задач в Kanban доску
 */
export class TaskWriter {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Форматирует задачу в строку markdown
	 * Формат: - [ ] Title #tag1 #tag2 @{date} @{time}
	 */
	formatTask(task: Task, dateFormat?: string): string {
		let taskLine = `- [ ] ${task.title}`;

		// Добавляем теги
		if (task.tags && task.tags.length > 0) {
			taskLine += ` ${task.tags.join(' ')}`;
		}

		// Добавляем дату
		if (task.date) {
			taskLine += ` @{${task.date}}`;
		}

		// Добавляем время
		if (task.time) {
			taskLine += ` @{${task.time}}`;
		}

		return taskLine;
	}

	/**
	 * Записывает задачу в Kanban доску
	 * Использует vault.process() для атомарного изменения
	 */
	async writeTask(board: KanbanBoard, task: Task): Promise<void> {
		const taskLine = this.formatTask(task, board.settings.dateFormat);

		await this.app.vault.process(board.file, (content) => {
			const lines = content.split('\n');

			// Ищем заголовок lane
			const laneHeaderPattern = `## ${task.lane}`;
			const laneIndex = lines.findIndex(line => line.trim() === laneHeaderPattern);

			if (laneIndex === -1) {
				console.error(`Lane "${task.lane}" not found in board`);
				throw new Error(`Lane "${task.lane}" not found`);
			}

			// Вставляем задачу после заголовка lane
			// Ищем первую не-пустую строку после заголовка или следующий заголовок
			let insertIndex = laneIndex + 1;

			// Если следующая строка пустая, вставляем после нее
			while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
				insertIndex++;
			}

			// Вставляем задачу
			lines.splice(insertIndex, 0, taskLine);

			return lines.join('\n');
		});
	}

	/**
	 * Обновляет существующую задачу (для будущего функционала редактирования)
	 */
	async updateTask(board: KanbanBoard, lineNumber: number, newTask: Task): Promise<void> {
		const taskLine = this.formatTask(newTask, board.settings.dateFormat);

		await this.app.vault.process(board.file, (content) => {
			const lines = content.split('\n');

			if (lineNumber < 0 || lineNumber >= lines.length) {
				throw new Error('Invalid line number');
			}

			// Заменяем строку
			lines[lineNumber] = taskLine;

			return lines.join('\n');
		});
	}
}
