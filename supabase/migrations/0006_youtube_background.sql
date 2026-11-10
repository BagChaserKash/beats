-- Allows a YouTube background image per beat.
alter table public.beat_files drop constraint if exists beat_files_kind_check;
alter table public.beat_files add constraint beat_files_kind_check
  check (kind in ('preview_mp3', 'waveform_json', 'artwork', 'master_mp3', 'master_wav', 'trackout_zip', 'youtube_bg'));
