import { useState, useEffect } from "react";
import "./CoverArtPicker.css";

const API_URL = "/api.php";

// ---------------------------------------------------------------------------
// Load jQuery exactly once — we need it because the bendodson iTunes Artwork
// Finder relies on jQuery's specific $.ajax JSONP implementation.  Our custom
// JSONP gave different results, so we use the real thing.
// ---------------------------------------------------------------------------
let jQueryReady = null;
function ensureJQuery() {
  if (jQueryReady) return jQueryReady;
  if (window.jQuery) {
    jQueryReady = Promise.resolve(window.jQuery);
    return jQueryReady;
  }
  jQueryReady = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js";
    script.onload = () => resolve(window.jQuery);
    script.onerror = () => reject(new Error("Failed to load jQuery"));
    document.head.appendChild(script);
  });
  return jQueryReady;
}

// ---------------------------------------------------------------------------
// Perform the exact same 3-step AJAX flow from itunes.js:
//   1. GET  api.php?type=request  →  { url: "https://itunes.apple.com/..." }
//   2. GET  data.url  (jQuery JSONP)  →  iTunes raw results
//   3. POST api.php type=data  →  processed results array
// ---------------------------------------------------------------------------
async function performSearch(query, entity, country) {
  const $ = await ensureJQuery();

  // Step 1 — identical to itunes.js
  const step1Data = await $.ajax({
    type: "GET",
    crossDomain: true,
    url: API_URL,
    data: { query, entity, country, type: "request" },
    dataType: "json",
  });

  // Step 2 — identical to itunes.js (jQuery JSONP to iTunes directly)
  const itunesData = await $.ajax({
    type: "GET",
    crossDomain: true,
    url: step1Data.url,
    data: {},
    dataType: "jsonp",
  });

  // Step 3 — identical to itunes.js
  const processed = await $.ajax({
    type: "POST",
    crossDomain: true,
    url: API_URL,
    data: { json: JSON.stringify(itunesData), type: "data", entity },
    dataType: "json",
  });

  return processed;
}

function CoverArtPicker({ artist, title, onSelect, onClose }) {
  const [queryArtist, setQueryArtist] = useState(artist);
  const [query, setQuery] = useState(title);
  const [country, setCountry] = useState("us");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // Pre-load jQuery on mount
  useEffect(() => {
    ensureJQuery();
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError("");
    setResults([]);

    try {
      const searchTerm = [queryArtist.trim(), query.trim()]
        .filter(Boolean)
        .join(" ");
      const processed = await performSearch(searchTerm, "album", country);
      setResults(processed);
    } catch (err) {
      console.error("CoverArtPicker search error:", err);
      setError(err.message || err.statusText || "Search failed");
      setResults([]);
    }
    setLoading(false);
  }

  function handlePick(artworkUrl) {
    const highRes = artworkUrl.replace("100x100bb", "600x600bb");
    onSelect(highRes);
  }

  return (
    <div className="cover-picker-overlay" onClick={onClose}>
      <div className="cover-picker" onClick={(e) => e.stopPropagation()}>
        <div className="cover-picker-header">
          <h3>Find Cover Art</h3>
          <button className="cover-picker-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="cover-picker-subtitle">
          {artist} &mdash; {title}
        </p>
        <form className="cover-picker-search" onSubmit={handleSearch}>
          <input
            type="text"
            value={queryArtist}
            onChange={(e) => setQueryArtist(e.target.value)}
            placeholder="Artist (optional)..."
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Album name..."
          />
          <select
            className="cover-picker-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="us">US</option>
            <option value="ca">CA</option>
            <option value="gb">UK</option>
            <option value="au">AU</option>
            <option value="de">DE</option>
            <option value="jp">JP</option>
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "..." : "Search"}
          </button>
        </form>
        <div className="cover-picker-results">
          {loading && <p className="cover-picker-status">Searching...</p>}
          {error && (
            <p className="cover-picker-status cover-picker-error">{error}</p>
          )}
          {!loading && !error && searched && results.length === 0 && (
            <p className="cover-picker-status">
              No results found. Try a different search or country.
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              className="cover-picker-item"
              onClick={() => handlePick(r.artworkUrl100)}
              title={`${r.artistName} - ${r.collectionName}`}
            >
              <img src={r.artworkUrl100} alt={r.collectionName} />
              <span className="cover-picker-label">
                <strong>{r.collectionName}</strong>
                <small>{r.artistName}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CoverArtPicker;
