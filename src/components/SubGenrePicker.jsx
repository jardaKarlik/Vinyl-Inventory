import { useEffect, useRef, useState } from "react";
import "./SubGenrePicker.css";

function SubGenrePicker({
  options,
  value = [],
  onChange,
  onAddNew,
  onDeleteOption,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter(
    (o) => !value.includes(o) && o.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setHighlightIndex(0);
  }, [query, open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (!document.contains(e.target)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addItem(item) {
    onChange([...value, item]);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  }

  function removeItem(item) {
    onChange(value.filter((v) => v !== item));
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[highlightIndex]) {
        addItem(filtered[highlightIndex]);
      } else if (query.trim() && !value.includes(query.trim())) {
        const newItem = query.trim();
        onAddNew?.(newItem);
        addItem(newItem);
      }
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeItem(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="subgenre-picker" ref={containerRef}>
      {value.length > 0 && (
        <div className="subgenre-picker-pills">
          {value.map((v) => (
            <span key={v} className="subgenre-pill">
              {v}
              <button
                type="button"
                className="subgenre-pill-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(v);
                }}
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div
        className="subgenre-picker-input-area"
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          className="subgenre-picker-text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search sub genres…"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="subgenre-picker-dropdown">
          {filtered.map((item, i) => (
            <li
              key={item}
              className={`subgenre-picker-option${i === highlightIndex ? " highlighted" : ""}`}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                addItem(item);
              }}
            >
              <span className="subgenre-option-label">{item}</span>
              {onDeleteOption && (
                <button
                  type="button"
                  className="subgenre-option-delete"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteOption(item);
                  }}
                  aria-label={`Delete ${item}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SubGenrePicker;
