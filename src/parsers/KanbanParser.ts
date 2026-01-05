import { TFile } from 'obsidian';
import { KanbanBoard } from '../types';
import { SettingsParser } from './SettingsParser';

/**
 * Парсер для извлечения структуры Kanban доски
 */
export class KanbanParser {
	private settingsParser: SettingsParser;

	constructor() {
		this.settingsParser = new SettingsParser();
	}

	/**
	 * Извлекает названия столбцов (lanes) из содержимого
	 * @param content Содержимое markdown файла
	 * @returns Массив названий столбцов
	 */
	parseLanes(content: string): string[] {
		const lanes: string[] = [];
		const laneRegex = /^## (.+)$/gm;
		let match;

		while ((match = laneRegex.exec(content)) !== null) {
			const laneName = match[1].trim();
			if (laneName) {
				lanes.push(laneName);
			}
		}

		return lanes;
	}

	/**
	 * Парсит Kanban доску целиком
	 * @param file Файл Kanban доски
	 * @param content Содержимое файла
	 * @returns Объект KanbanBoard или null если не удалось распарсить
	 */
	parseKanbanBoard(file: TFile, content: string): KanbanBoard | null {
		try {
			const settings = this.settingsParser.parseKanbanSettings(content);
			if (!settings) {
				return null;
			}

			const tasksSettings = this.settingsParser.parseKanbanTasksSettings(content);

			const lanes = this.parseLanes(content);
			if (lanes.length === 0) {
				console.warn(`No lanes found in ${file.path}`);
				return null;
			}

			return {
				file,
				settings,
				tasksSettings,
				lanes
			};
		} catch (error) {
			console.error(`Error parsing Kanban board ${file.path}:`, error);
			return null;
		}
	}
}
