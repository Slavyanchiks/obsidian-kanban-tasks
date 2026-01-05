import { TFile } from 'obsidian';

/**
 * Настройки Kanban доски, извлеченные из %% kanban:settings %%
 */
export interface KanbanSettings {
	dateFormat: string;
	dateDisplayFormat: string;
	tagColors: TagColor[];
}

/**
 * Настройки KanbanTasks, извлеченные из %% kanbantasks:settings %%
 */
export interface KanbanTasksSettings {
	tagGroups: TagGroup[];
}

/**
 * Группа тегов для отображения в выпадающем списке
 */
export interface TagGroup {
	name: string;
	keys: string[];
}

/**
 * Цвет тега из настроек Kanban
 */
export interface TagColor {
	tagKey: string;
	color: string;
	backgroundColor: string;
}

/**
 * Представление Kanban доски
 */
export interface KanbanBoard {
	file: TFile;
	settings: KanbanSettings;
	tasksSettings: KanbanTasksSettings | null;
	lanes: string[];
}

/**
 * Задача для создания
 */
export interface Task {
	title: string;
	lane: string;
	date?: string;
	time?: string;
	tags: string[];
}
