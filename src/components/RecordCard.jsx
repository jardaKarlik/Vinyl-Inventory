import { useRef } from "react";
import "./RecordCard.css";

function RecordCard({ record, onClick }) {
  // Prevent tapping and holding on mobile for a short time triggering onclick
  const TAP_MAX_MS = 250;
  const touchStartMsRef = useRef(0);
  const suppressNextClickRef = useRef(false);

  function handlePointerDown(e) {
    if (e.pointerType !== "touch") return;
    touchStartMsRef.current = performance.now();
    suppressNextClickRef.current = true;
  }

  function handlePointerUp(e) {
    if (e.pointerType !== "touch") return;
    const elapsedMs = performance.now() - touchStartMsRef.current;

    if (elapsedMs <= TAP_MAX_MS) {
      onClick?.(e);
    }
  }

  function handlePointerCancel(e) {
    if (e.pointerType !== "touch") return;
    suppressNextClickRef.current = false;
  }

  function handleClick(e) {
    if (suppressNextClickRef.current) {
      // Swallow the synthetic/native click that follows touch interactions.
      suppressNextClickRef.current = false;
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    onClick?.(e);
  }

  return (
    <div
      className="record-card"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="record-cover" onContextMenu={(e) => e.preventDefault()}>
        {record.coverUrl ? (
          <>
            <img
              className="record-cover-main"
              src={record.coverUrl}
              alt={`${record.title} cover`}
            />
            {record.vinylUrl && (
              <img
                className="record-cover-vinyl"
                src={record.vinylUrl}
                alt={`${record.title} vinyl`}
              />
            )}
          </>
        ) : (
          <div className="record-cover-placeholder">🎵</div>
        )}
      </div>

      <div className="record-info">
        <h3 className="record-title">{record.title}</h3>
        <p className="record-artist">{record.artist}</p>
        <p className="record-meta">
          <span className="record-year">{record.year + " "}</span>
          &middot; {record.genre}
          {record.subGenres && record.subGenres.length > 0 && (
            <span className="record-subgenres">
              {" "}
              &middot; {record.subGenres.join(", ")}
            </span>
          )}
        </p>
        {record.location && (
          <p className="record-location">📍 {record.location}</p>
        )}
      </div>
    </div>
  );
}

export default RecordCard;
