import "./DigitalTrackList.css";

function sortTracks(tracks, sort) {
  return [...tracks].sort((a, b) => {
    switch (sort) {
      case "artist-asc":
        return (a.artist || "").localeCompare(b.artist || "");
      case "artist-desc":
        return (b.artist || "").localeCompare(a.artist || "");
      case "year-asc":
        return (a.year || "0").localeCompare(b.year || "0");
      case "year-desc":
        return (b.year || "0").localeCompare(a.year || "0");
      case "genre-asc":
        return (a.genre || "").localeCompare(b.genre || "");
      case "genre-desc":
        return (b.genre || "").localeCompare(a.genre || "");
      case "bpm-asc":
        return (parseFloat(a.bpm) || 0) - (parseFloat(b.bpm) || 0);
      case "bpm-desc":
        return (parseFloat(b.bpm) || 0) - (parseFloat(a.bpm) || 0);
      default:
        return 0;
    }
  });
}

function keyColor(key) {
  if (!key) return "#666";
  const k = key.toLowerCase();
  if (k.includes("m")) return "#6a9ec5"; // minor = blue
  if (k.includes("d")) return "#c5896a"; // dominant = orange
  return "#6ac58e"; // major = green
}

export default function DigitalTrackList({ tracks, sort }) {
  const sorted = sortTracks(tracks, sort);

  if (sorted.length === 0) {
    return (
      <div className="digital-empty">
        No tracks found.
      </div>
    );
  }

  return (
    <div className="digital-track-list">
      <div className="digital-track-header">
        <span className="col-artist">Artist</span>
        <span className="col-title">Title</span>
        <span className="col-genre">Genre</span>
        <span className="col-bpm">BPM</span>
        <span className="col-key">Key</span>
        <span className="col-format">Format</span>
        <span className="col-duration">Duration</span>
      </div>
      {sorted.map((track) => (
        <div key={track.id} className="digital-track-row">
          <span className="col-artist" title={track.artist}>
            {track.artist || <span className="dim">—</span>}
          </span>
          <span className="col-title" title={track.title}>
            {track.title}
          </span>
          <span className="col-genre" title={track.genre}>
            {track.genre || <span className="dim">—</span>}
          </span>
          <span className="col-bpm">
            {track.bpm || <span className="dim">—</span>}
          </span>
          <span className="col-key">
            {track.key ? (
              <span
                className="key-badge"
                style={{ backgroundColor: keyColor(track.key) }}
              >
                {track.key}
              </span>
            ) : (
              <span className="dim">—</span>
            )}
          </span>
          <span className="col-format">
            <span className={`format-badge format-${track.format?.toLowerCase()}`}>
              {track.format}
            </span>
          </span>
          <span className="col-duration">
            {track.duration || <span className="dim">—</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
