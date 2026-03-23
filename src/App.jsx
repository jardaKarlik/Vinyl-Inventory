import { useState, useEffect, useRef, useCallback } from "react";
import bgImage from "./assets/RecordCollectionBG.png";
import RecordList from "./components/RecordList";
import AddRecordForm from "./components/AddRecordForm";
import EditRecordModal from "./components/EditRecordModal";
import { sampleRecords, generateId } from "./data/records.js";
import {
  GENRES as DEFAULT_GENRES,
  SUB_GENRES as DEFAULT_SUB_GENRES,
} from "./data/genreOptions";
import "./App.css";

function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("artist-asc");
  const [editingRecord, setEditingRecord] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [genres, setGenres] = useState(DEFAULT_GENRES);
  const [subGenres, setSubGenres] = useState(DEFAULT_SUB_GENRES);
  const initialized = useRef(false);
  const optionsInitialized = useRef(false);
  const bgRef = useRef(null);

  // Load genre options from server on mount
  useEffect(() => {
    fetch("/api/genre-options")
      .then((r) => r.json())
      .then((data) => {
        if (data?.genres) setGenres(data.genres);
        if (data?.subGenres) setSubGenres(data.subGenres);
        optionsInitialized.current = true;
      })
      .catch((e) => {
        console.error("Failed to load genre options:", e);
        optionsInitialized.current = true;
      });
  }, []);

  // Load records from server on mount
  useEffect(() => {
    fetch("/api/records")
      .then((r) => r.json())
      .then((data) => {
        // If server has saved data use it, otherwise seed with defaults
        setRecords(data.records ?? sampleRecords);
        setLoading(false);
        initialized.current = true;
      })
      .catch((e) => {
        console.error("Failed to load records:", e);
        setRecords(sampleRecords);
        setLoading(false);
        initialized.current = true;
      });
  }, []);

  // Save records to server whenever they change (skip the initial load)
  useEffect(() => {
    if (!initialized.current) return;
    fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    }).catch((e) => console.error("Failed to save records:", e));
  }, [records]);

  function handleAdd(newRecord) {
    setRecords((prev) => [{ id: generateId(), ...newRecord }, ...prev]);
  }

  function handleDelete(id) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }

  function handleEdit(id, updatedFields) {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r)),
    );
    setEditingRecord(null);
  }

  function saveGenreOptions(nextGenres, nextSubGenres) {
    fetch("/api/genre-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genres: nextGenres, subGenres: nextSubGenres }),
    }).catch((e) => console.error("Failed to save genre options:", e));
  }

  const handleAddSubGenre = useCallback(
    (newSubGenre) => {
      setSubGenres((prev) => {
        if (prev.includes(newSubGenre)) return prev;
        const next = [...prev, newSubGenre].sort((a, b) => a.localeCompare(b));
        saveGenreOptions(genres, next);
        return next;
      });
    },
    [genres],
  );

  const handleDeleteSubGenre = useCallback(
    (subGenre) => {
      setSubGenres((prev) => {
        const next = prev.filter((sg) => sg !== subGenre);
        saveGenreOptions(genres, next);
        return next;
      });
    },
    [genres],
  );

  const handleAddGenre = useCallback(
    (newGenre) => {
      setGenres((prev) => {
        if (prev.includes(newGenre)) return prev;
        const next = [...prev, newGenre].sort((a, b) => a.localeCompare(b));
        saveGenreOptions(next, subGenres);
        return next;
      });
    },
    [subGenres],
  );

  useEffect(() => {
    const parallaxFactor = 0.3;
    const updateBg = () => {
      if (!bgRef.current) return;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const extraHeight = maxScroll * parallaxFactor;
      bgRef.current.style.height = `calc(100vh + ${extraHeight}px)`;
      bgRef.current.style.transform = `translateY(${window.scrollY * -parallaxFactor}px)`;
    };
    updateBg();
    window.addEventListener("scroll", updateBg, { passive: true });
    window.addEventListener("resize", updateBg, { passive: true });
    const observer = new ResizeObserver(updateBg);
    observer.observe(document.documentElement);
    return () => {
      window.removeEventListener("scroll", updateBg);
      window.removeEventListener("resize", updateBg);
      observer.disconnect();
    };
  }, []);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.artist.toLowerCase().includes(q) ||
      r.genre.toLowerCase().includes(q) ||
      (Array.isArray(r.subGenres) &&
        r.subGenres.some((sg) => sg.toLowerCase().includes(q))) ||
      (r.location && r.location.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <>
        <div
          className="parallax-bg"
          ref={bgRef}
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div
          style={{ textAlign: "center", marginTop: "4rem", fontSize: "1.2rem" }}
        >
          Loading collection…
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="parallax-bg"
        ref={bgRef}
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <header className="app-header">
        <div className="app-header-top">
          <h1>Vinyl Collection</h1>
          <button
            className={`edit-mode-btn${editMode ? " active" : ""}`}
            onClick={() => {
              if (editMode) {
                setEditMode(false);
              } else {
                const pw = prompt("Enter password to enable editing:");
                if (pw === "EditRecords") setEditMode(true);
              }
            }}
          >
            {editMode ? "🔒 Lock" : "✏️ Edit Mode"}
          </button>
        </div>
        <p className="collection-count">{filtered.length} records</p>
      </header>

      <div className="search-sort-row">
        <input
          className="search-input"
          type="text"
          placeholder="Search by title, artist, genre, or location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="artist-asc">Artist A–Z</option>
          <option value="artist-desc">Artist Z–A</option>
          <option value="year-asc">Year Old–New</option>
          <option value="year-desc">Year New–Old</option>
          <option value="genre-asc">Genre A–Z</option>
          <option value="genre-desc">Genre Z–A</option>
        </select>
        {editMode && (
          <AddRecordForm
            onAdd={handleAdd}
            genres={genres}
            subGenres={subGenres}
            onAddSubGenre={handleAddSubGenre}
            onDeleteSubGenre={handleDeleteSubGenre}
            onAddGenre={handleAddGenre}
          />
        )}
      </div>

      <RecordList
        records={filtered}
        sort={sort}
        onClickRecord={(record) => setEditingRecord(record)}
      />

      {editingRecord && (
        <EditRecordModal
          key={editingRecord.id}
          record={editingRecord}
          onSave={handleEdit}
          onDelete={editMode ? handleDelete : null}
          onClose={() => setEditingRecord(null)}
          readOnly={!editMode}
          genres={genres}
          subGenres={subGenres}
          onAddSubGenre={handleAddSubGenre}
          onDeleteSubGenre={handleDeleteSubGenre}
          onAddGenre={handleAddGenre}
        />
      )}
    </>
  );
}

export default App;
