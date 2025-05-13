-- Переименовываем таблицу folders в pingvim
RENAME TABLE folders TO pingvim;

-- Обновляем внешние ключи в таблице files
ALTER TABLE files DROP FOREIGN KEY files_ibfk_1;
ALTER TABLE files ADD CONSTRAINT files_ibfk_1 FOREIGN KEY (parent_id) REFERENCES pingvim(id) ON DELETE CASCADE;

-- Обновляем внешние ключи в таблице pingvim (ссылка на саму себя)
ALTER TABLE pingvim DROP FOREIGN KEY folders_ibfk_1;
ALTER TABLE pingvim ADD CONSTRAINT pingvim_ibfk_1 FOREIGN KEY (parent_id) REFERENCES pingvim(id) ON DELETE CASCADE;
