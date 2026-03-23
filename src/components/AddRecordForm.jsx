import { useState } from "react";
import SubGenrePicker from "./SubGenrePicker";
import "./AddRecordForm.css";

const emptyForm = {
  artist: "",
  title: "",
  year: "",
  genre: "",
  subGenres: [],
  location: "",
  coverUrl: "",
};

function AddRecordForm({
  onAdd,
  genres,
  subGenres,
  onAddSubGenre,
  onDeleteSubGenre,
  onAddGenre,
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [isOpen, setIsOpen] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.artist.trim() || !formData.title.trim()) return;

    onAdd({
      artist: formData.artist.trim(),
      title: formData.title.trim(),
      year: formData.year ? parseInt(formData.year, 10) : null,
      genre: formData.genre || "Unknown",
      subGenres: formData.subGenres,
      location: formData.location.trim(),
      coverUrl: formData.coverUrl.trim() || "",
    });

    setFormData(emptyForm);
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button className="add-record-toggle" onClick={() => setIsOpen(true)}>
        + Add Record
      </button>
    );
  }

  return (
    <form className="add-record-form" onSubmit={handleSubmit}>
      <h2>Add a Record</h2>
      <div className="form-row">
        <input
          type="text"
          name="artist"
          placeholder="Artist *"
          value={formData.artist}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="title"
          placeholder="Album Title *"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      <div className="form-row">
        <input
          type="number"
          name="year"
          placeholder="Year"
          min="1900"
          max={new Date().getFullYear()}
          value={formData.year}
          onChange={handleChange}
        />
        <select
          name="genre"
          className={formData.genre === "" ? "placeholder" : ""}
          style={{ maxWidth: "49.5%" }}
          value={formData.genre}
          onChange={(e) => {
            if (e.target.value === "__add_new__") {
              const name = prompt("Enter new genre:");
              if (name?.trim()) {
                onAddGenre(name.trim());
                setFormData((prev) => ({ ...prev, genre: name.trim() }));
              }
            } else {
              handleChange(e);
            }
          }}
        >
          <option value="">Select Genre</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
          <option value="__add_new__">+ Add new…</option>
        </select>
      </div>
      <div className="form-row">
        <SubGenrePicker
          options={subGenres}
          value={formData.subGenres}
          onChange={(selected) =>
            setFormData((prev) => ({ ...prev, subGenres: selected }))
          }
          onAddNew={onAddSubGenre}
          onDeleteOption={onDeleteSubGenre}
        />
        <input
          type="text"
          name="location"
          style={{ maxWidth: "49.5%" }}
          placeholder="Location (e.g. Record Cabinet 1st Section)"
          value={formData.location}
          onChange={handleChange}
        />
      </div>
      <input
        type="url"
        name="coverUrl"
        placeholder="Cover image URL (optional)"
        value={formData.coverUrl}
        onChange={handleChange}
      />
      <div className="form-actions">
        <button type="submit">Add to Collection</button>
        <button
          type="button"
          className="cancel-btn"
          onClick={() => {
            setFormData(emptyForm);
            setIsOpen(false);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AddRecordForm;
