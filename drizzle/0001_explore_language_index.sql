DROP INDEX `study_set_visibility_idx`;--> statement-breakpoint
CREATE INDEX `study_set_visibility_lang_idx` ON `study_set` (`visibility`,`term_lang`);