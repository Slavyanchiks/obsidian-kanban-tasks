import { App, Notice, TFile } from 'obsidian';
import { KanbanBoard } from '../types';
import { KanbanParser } from '../parsers/KanbanParser';
import { BoardSelectorModal } from '../modals/BoardSelectorModal';

/**
 * Менеджер для поиска и управления Kanban досками с is-task-board: true
 */
export class TaskBoardManager {
	private app: App;
	private parser: KanbanParser;

	constructor(app: App) {
		this.app = app;
		this.parser = new KanbanParser();
	}

	/**
	 * Находит все доски с is-task-board: true
	 * @returns Массив KanbanBoard
	 */
	async findTaskBoards(): Promise<KanbanBoard[]> {
		const boards: KanbanBoard[] = [];
		const markdownFiles = this.app.vault.getMarkdownFiles();

		for (const file of markdownFiles) {
			// Проверяем frontmatter через метаданные
			const cache = this.app.metadataCache.getFileCache(file);
			const frontmatter = cache?.frontmatter;

			if (frontmatter && frontmatter['is-task-board'] === true) {
				// Читаем содержимое и парсим
				const content = await this.app.vault.read(file);
				const board = this.parser.parseKanbanBoard(file, content);

				if (board) {
					boards.push(board);
				}
			}
		}

		return boards;
	}

	/**
	 * Выбирает доску для работы (если несколько - показывает модалку выбора)
	 * @returns KanbanBoard или null если не найдено
	 */
	async selectTaskBoard(): Promise<KanbanBoard | null> {
		const boards = await this.findTaskBoards();

		if (boards.length === 0) {
			new Notice('Task boards not found. Add "is-task-board: true" to frontmatter.');
			return null;
		}

		if (boards.length === 1) {
			return boards[0];
		}

		// Несколько досок - показываем модалку выбора
		return new Promise((resolve) => {
			new BoardSelectorModal(this.app, boards, (selectedBoard) => {
				resolve(selectedBoard);
			}).open();
		});
	}
}
