import { useCallback, useEffect, useRef, useState } from "react";

const ACCEPTED = ["image/png", "image/jpeg", "image/bmp", "image/gif", "image/tiff", "image/webp"];

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

function withoutExtension(name) {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
}

async function convertToWebp(file, quality) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Conversion failed"))),
      "image/webp",
      quality / 100
    );
  });
}

let nextId = 0;

export default function App() {
  const [items, setItems] = useState([]);
  const [quality, setQuality] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const debounceRef = useRef(null);

  const runConversion = useCallback((id, file, q) => {
    convertToWebp(file, q)
      .then((blob) => {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: "done",
                  convertedBlob: blob,
                  convertedSize: blob.size,
                  convertedUrl: URL.createObjectURL(blob),
                }
              : it
          )
        );
      })
      .catch(() => {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, status: "error" } : it))
        );
      });
  }, []);

  const addFiles = useCallback(
    (fileList) => {
      const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (incoming.length === 0) return;

      const newItems = incoming.map((file) => ({
        id: nextId++,
        file,
        name: file.name,
        originalSize: file.size,
        previewUrl: URL.createObjectURL(file),
        status: "converting",
        convertedBlob: null,
        convertedSize: null,
        convertedUrl: null,
      }));

      setItems((prev) => [...prev, ...newItems]);
      newItems.forEach((it) => runConversion(it.id, it.file, quality));
    },
    [quality, runConversion]
  );

  // Re-convert everything when the quality slider settles.
  useEffect(() => {
    if (items.length === 0) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setItems((prev) => prev.map((it) => ({ ...it, status: "converting" })));
      items.forEach((it) => runConversion(it.id, it.file, quality));
    }, 250);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality]);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const clearAll = () => setItems([]);

  const downloadItem = (item) => {
    const a = document.createElement("a");
    a.href = item.convertedUrl;
    a.download = `${withoutExtension(item.name)}.webp`;
    a.click();
  };

  const downloadAll = () => {
    items.filter((it) => it.status === "done").forEach((it, i) => {
      setTimeout(() => downloadItem(it), i * 150);
    });
  };

  const doneCount = items.filter((it) => it.status === "done").length;
  const totalBefore = items.reduce((sum, it) => sum + it.originalSize, 0);
  const totalAfter = items.reduce((sum, it) => sum + (it.convertedSize || 0), 0);
  const totalPct = totalBefore ? (1 - totalAfter / totalBefore) * 100 : 0;

  return (
    <div className="page">
      <header className="header">
        <h1>WebP Converter</h1>
        <p className="subhead">Convert images to WebP entirely in your browser. Nothing is uploaded anywhere.</p>
      </header>

      <section
        className={`dropzone ${isDragging ? "dropzone--active" : ""} ${items.length ? "dropzone--compact" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {items.length === 0 ? (
          <>
            <span className="dropzone__title">Drop images here, or click to browse</span>
            <span className="dropzone__hint">PNG · JPEG · BMP · GIF · TIFF · WebP</span>
          </>
        ) : (
          <span className="dropzone__title dropzone__title--compact">+ Add more images</span>
        )}
      </section>

      {items.length > 0 && (
        <section className="controls">
          <label className="quality">
            <span>Quality</span>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
            />
            <span className="quality__value">{quality}</span>
          </label>

          <div className="actions">
            <button className="btn btn--ghost" onClick={clearAll}>
              Clear all
            </button>
            <button className="btn btn--primary" onClick={downloadAll} disabled={doneCount === 0}>
              Download all ({doneCount})
            </button>
          </div>
        </section>
      )}

      {items.length > 0 && (
        <ul className="list">
          {items.map((item) => (
            <li className="row" key={item.id}>
              <img className="row__thumb" src={item.previewUrl} alt="" />
              <div className="row__name">{item.name}</div>
              <div className="row__sizes">
                <span className="mono">{humanSize(item.originalSize)}</span>
                <span className="row__arrow">→</span>
                {item.status === "converting" && <span className="mono muted">converting…</span>}
                {item.status === "error" && <span className="row__error">failed</span>}
                {item.status === "done" && (
                  <>
                    <span className="mono">{humanSize(item.convertedSize)}</span>
                    <span className="row__pct">
                      {(1 - item.convertedSize / item.originalSize) * 100 >= 0 ? "-" : "+"}
                      {Math.abs((1 - item.convertedSize / item.originalSize) * 100).toFixed(0)}%
                    </span>
                  </>
                )}
              </div>
              <div className="row__buttons">
                {item.status === "done" && (
                  <button className="btn btn--small" onClick={() => downloadItem(item)}>
                    Download
                  </button>
                )}
                <button className="btn btn--small btn--ghost" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {doneCount > 0 && (
        <p className="summary mono">
          Total: {humanSize(totalBefore)} → {humanSize(totalAfter)} ({totalPct >= 0 ? "-" : "+"}
          {Math.abs(totalPct).toFixed(0)}%)
        </p>
      )}

      <footer className="footer">
        <p>Runs fully client-side using the browser's built-in WebP encoder. Works offline once loaded.</p>
      </footer>
    </div>
  );
}
