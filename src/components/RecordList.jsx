import RecordCard from "./RecordCard";
import "./RecordList.css";

function normalizeArtist(value) {
  const stripped = value.replace(/^(?:the|a)\s+/i, "").trim();
  return stripped.length > 0 ? stripped : value;
}

function compareArtist(a, b) {
  const aA = normalizeArtist((a.artist ?? "").trim());
  const aB = normalizeArtist((b.artist ?? "").trim());
  const cmp = aA.localeCompare(aB, undefined, { sensitivity: "base" });
  if (cmp !== 0) return cmp;
  return (a.artist ?? "").localeCompare(b.artist ?? "", undefined, {
    sensitivity: "base",
  });
}

function compareYear(a, b) {
  const yA = Number(a.year);
  const yB = Number(b.year);
  if (Number.isNaN(yA) && Number.isNaN(yB)) return 0;
  if (Number.isNaN(yA)) return 1;
  if (Number.isNaN(yB)) return -1;
  return yA - yB;
}

function compareGenre(a, b) {
  return (a.genre ?? "").localeCompare(b.genre ?? "", undefined, {
    sensitivity: "base",
  });
}

function sortRecords(records, sort) {
  const [field, dir] = sort.split("-");
  const mul = dir === "desc" ? -1 : 1;
  return [...records].sort((a, b) => {
    let primary = 0;
    let secondary = 0;
    if (field === "artist") {
      primary = compareArtist(a, b);
      secondary = compareYear(a, b);
    } else if (field === "year") {
      primary = compareYear(a, b);
      secondary = compareArtist(a, b);
    } else if (field === "genre") {
      primary = compareGenre(a, b);
      secondary = compareArtist(a, b);
    }
    return primary * mul || secondary;
  });
}

function RecordList({ records, sort = "artist-asc", onClickRecord }) {
  if (records.length === 0) {
    return (
      <div className="empty-state">
        <p>🎶 No records yet. Add some vinyl to your collection!</p>
      </div>
    );
  }

  const sortedRecords = sortRecords(records, sort);

  return (
    <div className="record-grid">
      {sortedRecords.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          onClick={() => onClickRecord(record)}
        />
      ))}
    </div>
  );
}

export default RecordList;
