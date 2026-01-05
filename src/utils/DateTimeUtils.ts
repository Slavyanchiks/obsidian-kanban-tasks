import { moment } from 'obsidian';

/**
 * Утилиты для работы с датами и временем
 */
export class DateTimeUtils {
	/**
	 * Форматирует дату в соответствии с указанным форматом
	 * @param date Дата для форматирования
	 * @param format Формат (например, DD.MM.YYYY)
	 * @returns Отформатированная строка даты
	 */
	static formatDate(date: Date, format: string): string {
		return moment(date).format(format);
	}

	/**
	 * Парсит строку даты в объект Date
	 * @param dateStr Строка с датой
	 * @param format Формат даты
	 * @returns Date или null если не удалось распарсить
	 */
	static parseDate(dateStr: string, format: string): Date | null {
		const parsed = moment(dateStr, format, true);
		return parsed.isValid() ? parsed.toDate() : null;
	}

	/**
	 * Форматирует время в формат HH:MM
	 * @param hours Часы
	 * @param minutes Минуты
	 * @returns Строка времени в формате HH:MM
	 */
	static formatTime(hours: number, minutes: number): string {
		const h = hours.toString().padStart(2, '0');
		const m = minutes.toString().padStart(2, '0');
		return `${h}:${m}`;
	}

	/**
	 * Парсит время из строки HH:MM
	 * @param timeStr Строка времени
	 * @returns Объект { hours, minutes } или null если не удалось распарсить
	 */
	static parseTime(timeStr: string): { hours: number; minutes: number } | null {
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
		const match = timeStr.match(timeRegex);

		if (!match) {
			return null;
		}

		return {
			hours: parseInt(match[1], 10),
			minutes: parseInt(match[2], 10)
		};
	}

	/**
	 * Возвращает текущую дату в указанном формате
	 * @param format Формат даты
	 * @returns Отформатированная строка даты
	 */
	static today(format: string): string {
		return this.formatDate(new Date(), format);
	}

	/**
	 * Возвращает текущее время в формате HH:MM
	 * @returns Строка времени
	 */
	static now(): string {
		const now = new Date();
		return this.formatTime(now.getHours(), now.getMinutes());
	}
}
