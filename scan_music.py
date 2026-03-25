"""
scan_music.py — Scan your local music folder and extract track metadata into digitalTracks.json

Requirements:
    pip install mutagen

Run from anywhere:
    python scan_music.py "C:/path/to/your/music/folder"

Or edit MUSIC_FOLDER below and just run:
    python scan_music.py
"""

import os
import sys
import json
import hashlib
from pathlib import Path

# ── CONFIG ────────────────────────────────────────────────────────────────────
# Set this to your music folder if you don't want to pass it as an argument
MUSIC_FOLDER = ""

# Where to write the output (relative to this script)
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "digitalTracks.json")

# Supported file extensions
SUPPORTED_EXTENSIONS = {".mp3", ".flac", ".wav", ".aiff", ".aif", ".m4a", ".ogg"}
# ─────────────────────────────────────────────────────────────────────────────


def generate_id(seed):
    return hashlib.md5(seed.encode()).hexdigest()[:12]


def clean(value):
    """Convert tag value to a clean string."""
    if value is None:
        return ""
    if isinstance(value, list):
        return str(value[0]).strip() if value else ""
    return str(value).strip()


def extract_tags(filepath):
    """Extract metadata from an audio file using mutagen."""
    try:
        from mutagen import File
        from mutagen.mp3 import MP3
        from mutagen.flac import FLAC
        from mutagen.mp4 import MP4

        audio = File(filepath, easy=True)
        if audio is None:
            return None

        tags = audio.tags or {}

        # Duration
        duration_sec = int(audio.info.length) if hasattr(audio, 'info') else 0
        duration_str = f"{duration_sec // 60}:{duration_sec % 60:02d}" if duration_sec else ""

        # Format
        ext = Path(filepath).suffix.lower().lstrip(".")
        fmt = ext.upper()

        # Try to get BPM and Key from common tag fields
        bpm = clean(tags.get("bpm") or tags.get("tbpm") or tags.get("tempo") or "")
        key = clean(tags.get("initialkey") or tags.get("tkey") or tags.get("key") or "")

        # For non-easy tags (ID3), try harder for BPM and key
        if not bpm or not key:
            try:
                raw = File(filepath)
                if raw and raw.tags:
                    if not bpm:
                        bpm = clean(raw.tags.get("TBPM") or raw.tags.get("BPM") or "")
                    if not key:
                        key = clean(raw.tags.get("TKEY") or raw.tags.get("KEY") or "")
            except Exception:
                pass

        return {
            "id": generate_id(str(filepath)),
            "artist": clean(tags.get("artist") or tags.get("albumartist") or ""),
            "title": clean(tags.get("title") or Path(filepath).stem),
            "album": clean(tags.get("album") or ""),
            "year": clean(tags.get("date") or tags.get("year") or "")[:4],
            "genre": clean(tags.get("genre") or ""),
            "bpm": bpm,
            "key": key,
            "format": fmt,
            "duration": duration_str,
            "filename": Path(filepath).name,
            "folder": Path(filepath).parent.name,
            "coverUrl": "",
        }
    except Exception as e:
        print(f"    [Error reading {filepath}]: {e}")
        return None


def scan_folder(folder):
    folder = Path(folder)
    if not folder.exists():
        print(f"Error: Folder not found: {folder}")
        sys.exit(1)

    print(f"Scanning: {folder}\n")
    tracks = []
    skipped = 0
    total_files = 0

    for root, dirs, files in os.walk(folder):
        # Skip hidden folders
        dirs[:] = [d for d in dirs if not d.startswith(".")]

        for filename in sorted(files):
            ext = Path(filename).suffix.lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            total_files += 1
            filepath = Path(root) / filename
            print(f"[{total_files}] {filepath.relative_to(folder)}")

            tags = extract_tags(str(filepath))
            if tags:
                tracks.append(tags)
            else:
                skipped += 1

    return tracks, total_files, skipped


def main():
    # Get music folder from argument or config
    if len(sys.argv) > 1:
        music_folder = sys.argv[1]
    elif MUSIC_FOLDER:
        music_folder = MUSIC_FOLDER
    else:
        print("Usage: python scan_music.py \"C:/path/to/your/music\"")
        print("Or set MUSIC_FOLDER in the script.")
        sys.exit(1)

    # Check mutagen is installed
    try:
        import mutagen
    except ImportError:
        print("Error: mutagen is not installed.")
        print("Run: pip install mutagen")
        sys.exit(1)

    tracks, total, skipped = scan_folder(music_folder)

    # Save output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(tracks, f, indent=2, ensure_ascii=False)

    print(f"\n=== Done ===")
    print(f"  Scanned:  {total} files")
    print(f"  Imported: {len(tracks)} tracks")
    print(f"  Skipped:  {skipped} files")
    print(f"\nSaved to: {OUTPUT_FILE}")
    print("Now copy data/digitalTracks.json to your Vinyl-Inventory project.")


if __name__ == "__main__":
    main()
