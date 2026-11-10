-- Adds waveform data (for the storefront player) to each beat.
alter table public.beats add column if not exists waveform jsonb;
