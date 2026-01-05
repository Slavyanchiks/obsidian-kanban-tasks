import { App, SuggestModal } from 'obsidian';
import { KanbanBoard } from '../types';

/**
 * Модальное окно для выбора Kanban доски
 */
export class BoardSelectorModal extends SuggestModal<KanbanBoard> {
	private boards: KanbanBoard[];
	private onSelect: (board: KanbanBoard) => void;

	constructor(app: App, boards: KanbanBoard[], onSelect: (board: KanbanBoard) => void) {
		super(app);
		this.boards = boards;
		this.onSelect = onSelect;
		this.setPlaceholder('Select a Kanban board...');
	}

	getSuggestions(query: string): KanbanBoard[] {
		const lowerQuery = query.toLowerCase();
		return this.boards.filter(board =>
			board.file.basename.toLowerCase().includes(lowerQuery) ||
			board.file.path.toLowerCase().includes(lowerQuery)
		);
	}

	renderSuggestion(board: KanbanBoard, el: HTMLElement): void {
		const container = el.createDiv({ cls: 'board-suggestion' });

		// Название доски
		container.createDiv({
			text: board.file.basename,
			cls: 'board-name'
		});

		// Путь к файлу (мелким шрифтом)
		container.createDiv({
			text: board.file.path,
			cls: 'board-path'
		}).style.fontSize = '0.8em';

		// Количество lanes
		container.createDiv({
			text: `${board.lanes.length} lanes`,
			cls: 'board-info'
		}).style.color = 'var(--text-muted)';
	}

	onChooseSuggestion(board: KanbanBoard, evt: MouseEvent | KeyboardEvent): void {
		this.onSelect(board);
	}
}
