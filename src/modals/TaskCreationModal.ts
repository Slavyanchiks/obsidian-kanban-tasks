import { App, Modal, Notice, Setting, DropdownComponent, TextAreaComponent, TextComponent, moment } from 'obsidian';
import { KanbanBoard, Task } from '../types';

/**
 * Модальное окно для создания задачи в Kanban доске
 */
export class TaskCreationModal extends Modal {
	private board: KanbanBoard;
	private onSubmit: (task: Task) => Promise<void>;

	// Поля формы
	private selectedLane: string;
	private taskTitle: string = '';
	private selectedDate: string = '';
	private selectedTime: string = '';
	private selectedTags: Map<string, string> = new Map(); // groupName -> selectedTag

	// Компоненты
	private titleTextArea: TextAreaComponent;
	private dateInput: TextComponent;
	private timeInput: TextComponent;

	constructor(app: App, board: KanbanBoard, onSubmit: (task: Task) => Promise<void>) {
		super(app);
		this.board = board;
		this.onSubmit = onSubmit;
		this.selectedLane = board.lanes[0] || '';
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass('kanban-tasks-modal');

		// Заголовок
		contentEl.createEl('h2', { text: 'Create Kanban Task', cls: 'modal-title' });

		// Lane Dropdown (обязательное)
		new Setting(contentEl)
			.setName('List')
			.setDesc('Select the column to add the task')
			.setClass('required-field')
			.addDropdown((dropdown: DropdownComponent) => {
				this.board.lanes.forEach(lane => {
					dropdown.addOption(lane, lane);
				});
				dropdown.setValue(this.selectedLane);
				dropdown.onChange(value => {
					this.selectedLane = value;
				});
			});

		// Title TextArea (обязательное) - кастомный layout
		const titleContainer = contentEl.createDiv({ cls: 'task-title-container' });

		// Заголовок с обязательной пометкой
		const titleLabel = titleContainer.createDiv({ cls: 'task-title-label' });
		titleLabel.createSpan({ text: 'Task title' });
		titleLabel.createSpan({ text: ' *', cls: 'required-mark' });

		// Текстовое поле
		const titleTextArea = titleContainer.createEl('textarea', {
			cls: 'task-title-input',
			attr: { placeholder: 'Enter task description...' }
		});

		this.titleTextArea = {
			inputEl: titleTextArea,
			getValue: () => titleTextArea.value,
			setValue: (val: string) => { titleTextArea.value = val; },
			onChange: (callback: (value: string) => void) => {
				titleTextArea.addEventListener('input', () => callback(titleTextArea.value));
			}
		} as TextAreaComponent;

		titleTextArea.addEventListener('input', () => {
			this.taskTitle = titleTextArea.value;
		});

		// Date Input (опционально)
		new Setting(contentEl)
			.setName('Date')
			.setDesc(`Format: ${this.board.settings.dateFormat}`)
			.addText((text: TextComponent) => {
				this.dateInput = text;
				text.setPlaceholder(this.board.settings.dateFormat);
				text.onChange(value => {
					this.selectedDate = value;
				});
			})
			.addButton(btn => {
				btn.setButtonText('Today');
				btn.onClick(() => {
					const today = this.formatDate(new Date());
					this.selectedDate = today;
					this.dateInput.setValue(today);
				});
			});

		// Time Input (опционально)
		new Setting(contentEl)
			.setName('Time')
			.setDesc('Format: HH:MM')
			.addText((text: TextComponent) => {
				this.timeInput = text;
				text.setPlaceholder('HH:MM');
				text.onChange(value => {
					this.selectedTime = value;
				});
			});

		// Tags Section - выпадающие списки по группам
		this.createTagsSection(contentEl);

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => this.close();

		// Submit button
		const submitBtn = buttonContainer.createEl('button', {
			text: 'Create Task',
			cls: 'mod-cta'
		});
		submitBtn.onclick = () => this.handleSubmit();
	}

	private createTagsSection(contentEl: HTMLElement): void {
		// Проверяем наличие настроек kanbantasks
		if (!this.board.tasksSettings || !this.board.tasksSettings.tagGroups.length) {
			// Если нет настроек групп, используем старый стиль (все теги в одном месте)
			this.createLegacyTagsSection(contentEl);
			return;
		}

		// Создаем выпадающие списки для каждой группы тегов
		this.board.tasksSettings.tagGroups.forEach(group => {
			// Фильтруем теги группы, которые существуют в tagColors
			const availableTags = group.keys.filter(tagKey =>
				this.board.settings.tagColors.some(tc => tc.tagKey === tagKey)
			);

			if (availableTags.length === 0) {
				return; // Пропускаем группу если в ней нет доступных тегов
			}

			new Setting(contentEl)
				.setName(group.name)
				.setDesc('Select tag from this group')
				.addDropdown((dropdown: DropdownComponent) => {
					// Добавляем опцию "None"
					dropdown.addOption('', '—');

					// Добавляем теги группы
					availableTags.forEach(tagKey => {
						const tagColor = this.board.settings.tagColors.find(tc => tc.tagKey === tagKey);
						if (tagColor) {
							dropdown.addOption(tagKey, tagKey);
						}
					});

					dropdown.onChange(value => {
						if (value) {
							this.selectedTags.set(group.name, value);
						} else {
							this.selectedTags.delete(group.name);
						}
					});
				});
		});
	}

	private createLegacyTagsSection(contentEl: HTMLElement): void {
		const tagsSetting = new Setting(contentEl)
			.setName('Tags')
			.setDesc('Select tags from board settings');

		if (this.board.settings.tagColors.length === 0) {
			tagsSetting.descEl.appendText(' (No tags configured in board settings)');
			return;
		}

		const tagContainer = contentEl.createDiv({ cls: 'tag-selector' });

		this.board.settings.tagColors.forEach(tagColor => {
			const tagEl = tagContainer.createDiv({
				cls: 'tag-option',
				text: tagColor.tagKey
			});

			// Применяем цвета из настроек
			tagEl.style.color = tagColor.color;
			tagEl.style.backgroundColor = tagColor.backgroundColor;

			tagEl.onclick = () => {
				const tagKey = tagColor.tagKey;
				const isSelected = this.selectedTags.has('legacy');
				const currentTags = isSelected ? this.selectedTags.get('legacy')!.split(' ') : [];
				const index = currentTags.indexOf(tagKey);

				if (index > -1) {
					// Убрать тег
					currentTags.splice(index, 1);
					tagEl.removeClass('selected');
				} else {
					// Добавить тег
					currentTags.push(tagKey);
					tagEl.addClass('selected');
				}

				if (currentTags.length > 0) {
					this.selectedTags.set('legacy', currentTags.join(' '));
				} else {
					this.selectedTags.delete('legacy');
				}
			};
		});
	}

	private formatDate(date: Date): string {
		const format = this.board.settings.dateFormat;
		return moment(date).format(format);
	}

	private validateForm(): string | null {
		// Проверяем обязательные поля
		if (!this.selectedLane) {
			return 'Please select a list';
		}

		if (!this.taskTitle.trim()) {
			return 'Please enter a task title';
		}

		// Проверяем дату если указана
		if (this.selectedDate && !this.isValidDate(this.selectedDate)) {
			return `Invalid date format. Expected: ${this.board.settings.dateFormat}`;
		}

		// Проверяем время если указано
		if (this.selectedTime && !this.isValidTime(this.selectedTime)) {
			return 'Invalid time format. Expected: HH:MM';
		}

		return null;
	}

	private isValidDate(dateStr: string): boolean {
		// Простая проверка формата DD.MM.YYYY
		const parsed = moment(dateStr, this.board.settings.dateFormat, true);
		return parsed.isValid();
	}

	private isValidTime(timeStr: string): boolean {
		// Проверка формата HH:MM
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
		return timeRegex.test(timeStr);
	}

	private async handleSubmit(): Promise<void> {
		// Валидация
		const error = this.validateForm();
		if (error) {
			new Notice(error);
			return;
		}

		// Собираем выбранные теги
		const tags: string[] = [];
		this.selectedTags.forEach(tagValue => {
			if (tagValue.includes(' ')) {
				// Legacy mode - multiple tags in one string
				tags.push(...tagValue.split(' '));
			} else {
				tags.push(tagValue);
			}
		});

		// Создаем объект Task
		const task: Task = {
			title: this.taskTitle.trim(),
			lane: this.selectedLane,
			date: this.selectedDate || undefined,
			time: this.selectedTime || undefined,
			tags: tags
		};

		// Вызываем callback
		try {
			await this.onSubmit(task);
			new Notice('Task created successfully!');
			this.close();
		} catch (e) {
			console.error('Failed to create task:', e);
			new Notice('Failed to create task');
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
