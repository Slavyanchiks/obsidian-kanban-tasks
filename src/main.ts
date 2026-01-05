import { Plugin } from 'obsidian';
import { TaskBoardManager } from './managers/TaskBoardManager';
import { TaskCreationModal } from './modals/TaskCreationModal';
import { TaskWriter } from './managers/TaskWriter';

export default class KanbanTasksPlugin extends Plugin {
	private taskBoardManager: TaskBoardManager;

	async onload() {
		console.log('Loading Kanban Tasks plugin');

		// Initialize managers
		this.taskBoardManager = new TaskBoardManager(this.app);

		// Register command for creating tasks
		this.addCommand({
			id: 'create-kanban-task',
			name: 'Create Kanban task',
			callback: async () => {
				await this.createTask();
			}
		});
	}

	async createTask() {
		// Select a task board
		const board = await this.taskBoardManager.selectTaskBoard();
		if (!board) {
			return;
		}

		// Open task creation modal
		new TaskCreationModal(this.app, board, async (task) => {
			const writer = new TaskWriter(this.app);
			await writer.writeTask(board, task);
		}).open();
	}

	onunload() {
		console.log('Unloading Kanban Tasks plugin');
	}
}
