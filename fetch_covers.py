"""
fetch_covers.py — Auto-fetch album cover art from Discogs for your Vinyl Inventory

Run this from your project root:
    python fetch_covers.py

Requirements: only Python standard library (no pip installs needed)

What it does:
- Reads data/records.json
- For each record that has a discogsId and no coverUrl, fetches the cover from Discogs
- Updates records.json with the cover URLs
- Skips records that already have a coverUrl
- Waits 1 second between requests to respect Discogs rate limits
"""

import json
import time
import urllib.request
import urllib.error
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "records.json")
USER_AGENT = "VinylInventory/1.0 +https://github.com/andreaskinga-lgtm/Vinyl-Inventory"

def get_discogs_cover(release_id):
    url = f"https://api.discogs.com/releases/{release_id}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        images = data.get("images", [])
        # Prefer primary image, fall back to first available
        for img in images:
            if img.get("type") == "primary":
                return img.get("uri150") or img.get("uri")
        if images:
            return images[0].get("uri150") or images[0].get("uri")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"    [404] Release {release_id} not found on Discogs")
        elif e.code == 429:
            print(f"    [429] Rate limited — waiting 60 seconds...")
            time.sleep(60)
        else:
            print(f"    [HTTP {e.code}] Error for release {release_id}")
    except Exception as e:
        print(f"    [Error] {release_id}: {e}")
    return None


def main():
    # Load records
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        records = json.load(f)

    total = len(records)
    updated = 0
    skipped = 0
    failed = 0

    print(f"Found {total} records in {DATA_FILE}\n")

    for i, record in enumerate(records):
        artist = record.get("artist", "?")
        title = record.get("title", "?")
        discogs_id = record.get("discogsId", "")
        existing_cover = record.get("coverUrl", "")

        # Skip if already has a cover
        if existing_cover:
            skipped += 1
            continue

        # Skip if no Discogs ID
        if not discogs_id:
            print(f"[{i+1}/{total}] Skipping (no Discogs ID): {artist} — {title}")
            failed += 1
            continue

        print(f"[{i+1}/{total}] Fetching: {artist} — {title} (id: {discogs_id})")
        cover_url = get_discogs_cover(discogs_id)

        if cover_url:
            record["coverUrl"] = cover_url
            updated += 1
            print(f"    ✓ Got cover: {cover_url}")
        else:
            failed += 1
            print(f"    ✗ No cover found")

        # Save after every 10 records so you don't lose progress if interrupted
        if (i + 1) % 10 == 0:
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=2, ensure_ascii=False)
            print(f"    [Saved progress — {updated} covers added so far]\n")

        # Respect Discogs rate limit (25 requests/min unauthenticated)
        time.sleep(2.5)

    # Final save
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"\n=== Done ===")
    print(f"  Updated: {updated}")
    print(f"  Skipped (already had cover): {skipped}")
    print(f"  Failed/no cover: {failed}")
    print(f"  Total: {total}")
    print(f"\nrecords.json saved. Refresh your browser to see the covers!")


if __name__ == "__main__":
    main()
