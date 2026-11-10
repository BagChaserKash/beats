-- Short code for the single link in receipt emails.
alter table public.orders add column if not exists access_code text unique;
