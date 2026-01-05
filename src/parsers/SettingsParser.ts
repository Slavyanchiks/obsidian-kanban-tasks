import { KanbanSettings } from '../types';

/**
 * Парсер для извлечения настроек Kanban из комментария %% kanban:settings %%
 */
export class SettingsParser {
	/**
	 * Извлекает настройки Kanban из содержимого файла
	 * @param content Содержимое markdown файла
	 * @returns Настройки или null если не найдены
	 */
	parseKanbanSettings(content: string): KanbanSettings | null {
		try {
			// Ищем блок с настройками в комментарии
			const settingsRegex = /%%\s*kanban:settings\s*```\s*({[\s\S]*?})\s*```\s*%%/;
			const match = content.match(settingsRegex);

			if (!match || !match[1]) {
				console.warn('Kanban settings block not found');
				return this.getDefaultSettings();
			}

			// Парсим JSON
			const settingsJson = JSON.parse(match[1]);

			// Конвертируем в наш формат
			return {
				dateFormat: settingsJson['date-format'] || 'DD.MM.YYYY',
				dateDisplayFormat: settingsJson['date-display-format'] || 'DD.MM.YYYY',
				tagColors: settingsJson['tag-colors'] || [],
				tagGroups: settingsJson['tag_groups'] || undefined
			};
		} catch (error) {
			console.error('Error parsing Kanban settings:', error);
			return this.getDefaultSettings();
		}
	}

	/**
	 * Возвращает настройки по умолчанию
	 */
	private getDefaultSettings(): KanbanSettings {
		return {
			dateFormat: 'DD.MM.YYYY',
			dateDisplayFormat: 'DD.MM.YYYY',
			tagColors: []
		};
	}
}
