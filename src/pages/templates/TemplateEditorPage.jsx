import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fabric } from "fabric";
import api from "@/lib/api";
import { Spinner, ErrorMessage } from "@/components/ui";

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({ onClick, title, active, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-brand-100 text-brand-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

// ── Property panel for selected object ───────────────────────────────────────
function PropertiesPanel({ selected, canvas }) {
  if (!selected)
    return (
      <div className="text-xs text-gray-400 px-4 py-6 text-center">
        Select an object to edit its properties
      </div>
    );

  function update(props) {
    selected.set(props);
    canvas.renderAll();
  }

  const isText = ["textbox", "text", "i-text"].includes(selected.type);
  const isImage = selected.type === "image";
  const isRect = selected.type === "rect";
  const isCirc = selected.type === "circle";

  return (
    <div className="px-4 py-4 space-y-4 text-sm overflow-y-auto">
      <p className="font-medium text-gray-700 capitalize">{selected.type}</p>

      {/* Position */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Position</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["X", "left"],
            ["Y", "top"],
          ].map(([label, prop]) => (
            <div key={prop}>
              <label className="text-xs text-gray-400">{label}</label>
              <input
                type="number"
                className="input text-xs py-1 mt-0.5"
                value={Math.round(selected[prop] || 0)}
                onChange={(e) => update({ [prop]: Number(e.target.value) })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Size</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400">W</label>
            <input
              type="number"
              className="input text-xs py-1 mt-0.5"
              value={Math.round((selected.width || 0) * (selected.scaleX || 1))}
              onChange={(e) =>
                update({
                  scaleX: Number(e.target.value) / (selected.width || 1),
                })
              }
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">H</label>
            <input
              type="number"
              className="input text-xs py-1 mt-0.5"
              value={Math.round(
                (selected.height || 0) * (selected.scaleY || 1),
              )}
              onChange={(e) =>
                update({
                  scaleY: Number(e.target.value) / (selected.height || 1),
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Text properties */}
      {isText && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Text content
            </label>
            <textarea
              rows={3}
              className="input text-xs py-1 resize-none"
              value={selected.text || ""}
              onChange={(e) => update({ text: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">
              Use{" "}
              <code className="bg-gray-100 px-1 rounded">
                {"{placeholder}"}
              </code>{" "}
              for variable data
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">Size</label>
              <input
                type="number"
                className="input text-xs py-1 mt-0.5"
                value={selected.fontSize || 16}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Color</label>
              <input
                type="color"
                className="w-full h-8 rounded border border-gray-300 mt-0.5 cursor-pointer"
                value={selected.fill || "#000000"}
                onChange={(e) => update({ fill: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">
              Font weight
            </label>
            <select
              className="input text-xs py-1"
              value={selected.fontWeight || "normal"}
              onChange={(e) => update({ fontWeight: e.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Align</label>
            <div className="flex gap-1">
              {["left", "center", "right"].map((a) => (
                <button
                  key={a}
                  onClick={() => update({ textAlign: a })}
                  className={`flex-1 py-1 text-xs rounded border transition-colors ${
                    selected.textAlign === a
                      ? "bg-brand-50 border-brand-300 text-brand-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {a[0].toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shape fill */}
      {(isRect || isCirc) && (
        <div>
          <label className="text-xs text-gray-400 block mb-1">Fill color</label>
          <input
            type="color"
            className="w-full h-8 rounded border border-gray-300 cursor-pointer"
            value={selected.fill || "#cccccc"}
            onChange={(e) => update({ fill: e.target.value })}
          />
        </div>
      )}

      {/* Opacity */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">
          Opacity ({Math.round((selected.opacity ?? 1) * 100)}%)
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          className="w-full"
          value={selected.opacity ?? 1}
          onChange={(e) => update({ opacity: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────
export default function TemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const isEdit = !!id;

  const [name, setName] = useState("Untitled template");
  const [category, setCategory] = useState("other");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(500);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const skipHistory = useRef(false);

  const categories = [
    "id_card",
    "certificate",
    "invite",
    "badge",
    "business_card",
    "ticket",
    "label",
    "other",
  ];

  // ── Init canvas ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    const fc = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });

    fabricRef.current = fc;

    fc.on("selection:created", (e) => setSelected(e.selected?.[0] || null));

    fc.on("selection:updated", (e) => setSelected(e.selected?.[0] || null));

    fc.on("selection:cleared", () => setSelected(null));

    fc.on("object:modified", () => saveHistory(fc));
    fc.on("object:added", () => saveHistory(fc));
    fc.on("object:removed", () => saveHistory(fc));

    // IMPORTANT

    if (!isEdit) return;

    loadTemplate();

    return () => {
      fc.dispose();
    };
  }, []);

  // ── Load existing template ───────────────────────────────────────────────────
  async function loadTemplate() {
    console.log("runing....");

    try {
      const { data } = await api.get(`/templates/${id}`);

      const t = data.data;
      console.log("Loading......", data);

      setName(t.name);
      setCategory(t.category);

      setWidth(t.width_px);
      setHeight(t.height_px);

      const fc = fabricRef.current;

      fc.setWidth(t.width_px);
      fc.setHeight(t.height_px);

      let canvasJson = t.canvas_json;

      if (typeof canvasJson === "string") {
        canvasJson = JSON.parse(canvasJson);
      }

      fc.loadFromJSON(canvasJson, () => {
        fc.renderAll();

        // force rerender
        fc.calcOffset();

        // initial history
        const initial = JSON.stringify(fc.toJSON());
        setHistory([initial]);
        setHistIdx(0);
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load template");
    } finally {
      setLoading(false);
    }
  }
  //   useEffect(() => {}, [id, isEdit, canvasReady]);

  // ── History ──────────────────────────────────────────────────────────────────
  function saveHistory(fc) {
    if (skipHistory.current) return;
    const json = JSON.stringify(fc.toJSON());
    setHistory((h) => {
      const next = [...h.slice(0, histIdx + 1), json];
      setHistIdx(next.length - 1);
      return next;
    });
  }

  function undo() {
    if (histIdx <= 0) return;
    skipHistory.current = true;
    const prev = history[histIdx - 1];
    fabricRef.current.loadFromJSON(JSON.parse(prev), () => {
      fabricRef.current.renderAll();
      setHistIdx((i) => i - 1);
      skipHistory.current = false;
    });
  }

  function redo() {
    if (histIdx >= history.length - 1) return;
    skipHistory.current = true;
    const next = history[histIdx + 1];
    fabricRef.current.loadFromJSON(JSON.parse(next), () => {
      fabricRef.current.renderAll();
      setHistIdx((i) => i + 1);
      skipHistory.current = false;
    });
  }

  // ── Add objects ──────────────────────────────────────────────────────────────
  function addText() {
    const obj = new fabric.Textbox("Text here", {
      left: 50,
      top: 50,
      width: 200,
      fontSize: 24,
      fill: "#222222",
      fontFamily: "Arial",
    });
    fabricRef.current.add(obj);
    fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll();
  }

  function addPlaceholderText(key) {
    const obj = new fabric.Textbox(`{${key}}`, {
      left: 50,
      top: 50,
      width: 250,
      fontSize: 24,
      fill: "#222222",
      fontFamily: "Arial",
    });
    fabricRef.current.add(obj);
    fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll();
  }

  function addRect() {
    const obj = new fabric.Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 120,
      fill: "#e8e8e8",
      stroke: "#cccccc",
      strokeWidth: 1,
      rx: 4,
      ry: 4,
    });
    fabricRef.current.add(obj);
    fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll();
  }

  function addCircle() {
    const obj = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 60,
      fill: "#e8e8e8",
      stroke: "#cccccc",
      strokeWidth: 1,
    });
    fabricRef.current.add(obj);
    fabricRef.current.setActiveObject(obj);
    fabricRef.current.renderAll();
  }

  function addImagePlaceholder() {
  const key = prompt("Placeholder key (e.g. photo, logo):", "photo");
  if (!key) return;

  const W = 180, H = 220;

  // Children coords are relative to group CENTER
  const rect = new fabric.Rect({
    left: -W / 2,
    top:  -H / 2,
    width: W,
    height: H,
    fill: "#f0f4ff",
    stroke: "#6366f1",
    strokeWidth: 2,
    strokeDashArray: [6, 4],
    rx: 4,
    ry: 4,
  });

  const text = new fabric.Text(`{${key}}`, {
    left: 0,
    top:  0,
    fontSize: 14,
    fill: "#6366f1",
    fontFamily: "Arial",
    originX: "center",
    originY: "center",
    selectable: false,
    evented: false,
  });

  const group = new fabric.Group([rect, text], {
    left: 200,
    top:  50,
    // Store on the object directly — passed via toObject's extra props
    _placeholderKey:       key,
    _isImagePlaceholder:   true,
  });

  // Tell Fabric to include these custom props in toJSON/toObject
  group.toObject = (function (original) {
    return function (extraProps) {
      return {
        ...original.call(this, extraProps),
        _placeholderKey:     this._placeholderKey,
        _isImagePlaceholder: this._isImagePlaceholder,
      };
    };
  })(group.toObject);   // ← override toObject, NOT toJSON

  fabricRef.current.add(group);
  fabricRef.current.setActiveObject(group);
  fabricRef.current.renderAll();
}

  function uploadBgImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      fabric.Image.fromURL(ev.target.result, (img) => {
        img.scaleToWidth(width);
        img.set({ left: 0, top: 0, selectable: true });
        fabricRef.current.add(img);
        fabricRef.current.sendToBack(img);
        fabricRef.current.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── Delete / layer ────────────────────────────────────────────────────────────
  function deleteSelected() {
    const obj = fabricRef.current.getActiveObject();
    if (!obj) return;
    fabricRef.current.remove(obj);
    fabricRef.current.renderAll();
  }

  function bringForward() {
    fabricRef.current.getActiveObject()?.bringForward();
    fabricRef.current.renderAll();
  }
  function sendBackward() {
    fabricRef.current.getActiveObject()?.sendBackwards();
    fabricRef.current.renderAll();
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function handleSave() {
  setSaving(true);
  setError("");
  try {
    // Tell Fabric to include custom props in the serialized JSON
    const canvasJson = JSON.stringify(
      fabricRef.current.toJSON(["_placeholderKey", "_isImagePlaceholder"])
    );
    const payload = {
      name,
      category,
      canvas_json: canvasJson,
      width_px: width,
      height_px: height,
    };

    if (isEdit) {
      await api.put(`/templates/${id}`, payload);
    } else {
      const { data } = await api.post("/templates", payload);
      navigate(`/templates/${data.data.id}/edit`, { replace: true });
    }
  } catch (err) {
    setError(
      err.response?.data?.error?.description || "Failed to save template",
    );
  } finally {
    setSaving(false);
  }
}

  // ── Canvas size change ────────────────────────────────────────────────────────
  function applySize() {
    fabricRef.current.setWidth(width);
    fabricRef.current.setHeight(height);
    fabricRef.current.renderAll();
  }

  //   if (loading)
  //     return (
  //       <div className="flex items-center justify-center h-64">
  //         <Spinner className="w-8 h-8" />
  //       </div>
  //     );

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-[calc(100vh-0px)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-my-8">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shrink-0 flex-wrap">
        <button
          onClick={() => navigate("/templates")}
          className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
        >
          ←
        </button>

        <input
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium w-40 sm:w-56 focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm hidden sm:block focus:outline-none"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        {error && (
          <span className="text-xs text-red-500 hidden sm:block">{error}</span>
        )}

        <button
          onClick={undo}
          disabled={histIdx <= 0}
          title="Undo"
          className="btn-secondary text-xs py-1.5 px-2.5 hidden sm:flex"
        >
          ↩
        </button>
        <button
          onClick={redo}
          disabled={histIdx >= history.length - 1}
          title="Redo"
          className="btn-secondary text-xs py-1.5 px-2.5 hidden sm:flex"
        >
          ↪
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm py-1.5"
        >
          {saving ? <Spinner className="w-4 h-4" /> : null}
          {saving ? "Saving…" : isEdit ? "Save" : "Save template"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="w-12 sm:w-14 bg-white border-r border-gray-200 flex flex-col items-center py-3 gap-1 shrink-0 overflow-y-auto">
          <ToolBtn onClick={addText} title="Add text">
            T
          </ToolBtn>
          <ToolBtn onClick={addRect} title="Add rectangle">
            ▭
          </ToolBtn>
          <ToolBtn onClick={addCircle} title="Add circle">
            ○
          </ToolBtn>
          <ToolBtn onClick={addImagePlaceholder} title="Add image placeholder">
            🖼
          </ToolBtn>
          <Divider />
          <label
            title="Upload background image"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer text-sm"
          >
            🌄
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={uploadBgImage}
            />
          </label>
          <Divider />
          <ToolBtn onClick={deleteSelected} title="Delete selected">
            🗑
          </ToolBtn>
          <ToolBtn onClick={bringForward} title="Bring forward">
            ↑
          </ToolBtn>
          <ToolBtn onClick={sendBackward} title="Send backward">
            ↓
          </ToolBtn>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-center p-4 sm:p-8 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <Spinner className="w-8 h-8" />
            </div>
          )}

          <div className="shadow-xl">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-52 sm:w-60 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
          {/* Canvas size */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Canvas size
            </p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                className="input text-xs py-1 w-16"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
              <span className="text-gray-400 text-xs">×</span>
              <input
                type="number"
                className="input text-xs py-1 w-16"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
              />
              <button
                onClick={applySize}
                className="btn-secondary text-xs py-1 px-2"
              >
                ✓
              </button>
            </div>
          </div>

          {/* Quick placeholders */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Add placeholder
            </p>
            <div className="flex flex-wrap gap-1">
              {["name", "roll_no", "class", "date", "id"].map((key) => (
                <button
                  key={key}
                  onClick={() => addPlaceholderText(key)}
                  className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded hover:bg-brand-100 font-mono transition-colors"
                >
                  {"{" + key + "}"}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                const k = prompt("Custom placeholder key:");
                if (k) addPlaceholderText(k);
              }}
              className="text-xs text-gray-400 hover:text-brand-600 mt-1.5 block"
            >
              + Custom…
            </button>
          </div>

          {/* Properties */}
          <div className="flex-1 overflow-y-auto">
            <PropertiesPanel selected={selected} canvas={fabricRef.current} />
          </div>
        </div>
      </div>
    </div>
  );
}
