# MahoraPeak Scraper v63

The v63 pipeline replaces `npm start`'s legacy entry point. It reads targets from `scraper/url.txt` by default, scrapes one configured source host, checks existing series/chapters, validates pages, and stores images in the configured R2 bucket.

## Safe preview

From the `scraper` folder:

```powershell
npm start -- --dry-run --limit=1
```

Preview mode is the default. It does not upload images or write to Supabase. If credentials are present it reads the matching series and chapters to report what would be new or repaired.

## Apply changes

After reviewing a preview, explicitly enable writes:

```powershell
npm start -- --apply --limit=1
```

Live mode requires `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and the `R2_*` values listed in `.env.example`. It only handles URLs for `SCRAPER_BASE_URL`; put one series URL per line in `url.txt`. Do not run the legacy recovery scripts for a first production run.

## Controls

- `--limit=1` limits the run to one series.
- `--preview-chapters=5` bounds page-level preview requests.
- Pass explicit series URLs after the flags to override `url.txt`.
- `SCRAPER_DELAY_MS` controls the pause between chapter requests.
- `SCRAPER_PAGE_CONCURRENCY` is clamped to 1–5.
- `SCRAPER_MIN_PAGES` prevents incomplete/empty chapters from being saved.
- Existing complete chapters are skipped; incomplete chapters are updated only after replacement pages are successfully uploaded.

Keep `.env` local. If a real credential was ever committed or shared, rotate it; adding it to `.gitignore` does not erase Git history.
