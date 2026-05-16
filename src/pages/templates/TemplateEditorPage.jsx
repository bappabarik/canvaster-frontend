import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fabric } from "fabric";
import api from "@/lib/api";
import { initAligningGuidelines } from "@/lib/smartGuides";

/* ─────────────────────────────────────────────────────────────────────────────
   ICON SYSTEM
───────────────────────────────────────────────────────────────────────────── */
const Ico = ({ d, size = 16, className = "", fill = "none", sw = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {Array.isArray(d) ? (
      d.map((p, i) => <path key={i} d={p} />)
    ) : (
      <path d={d} />
    )}
  </svg>
);

const I = {
  back: "M19 12H5M5 12l7 7M5 12l7-7",
  text: "M4 7V4h16v3M9 20h6M12 4v16",
  rect: "M3 3h18v18H3z",
  circle:
    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  tri: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  img: [
    "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z",
    "M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z",
  ],
  upload: [
    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
    "M17 8l-5-5-5 5",
    "M12 3v12",
  ],
  trash: [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  ],
  undo: "M3 7v6h6M3 13C5 7 11 3 18 5a9 9 0 1 1-9 9",
  redo: "M21 7v6h-6M21 13C19 7 13 3 6 5a9 9 0 1 0 9 9",
  up: "M12 19V5M5 12l7-7 7 7",
  down: "M12 5v14M19 12l-7 7-7-7",
  copy: [
    "M20 9H11a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z",
    "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  ],
  save: [
    "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
    "M17 21v-8H7v8",
    "M7 3v5h8",
  ],
  search: ["M21 21l-4.35-4.35", "M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16z"],
  x: "M18 6L6 18M6 6l12 12",
  ph: [
    "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 0-2-2V9m0 0h18",
  ],
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  layers: ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  eye: [
    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
    "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ],
  eyeOff: [
    "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94",
    "M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19",
    "M1 1l22 22",
  ],
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  ],
  zoomIn: [
    "M21 21l-4.35-4.35",
    "M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16z",
    "M11 8v6",
    "M8 11h6",
  ],
  zoomOut: [
    "M21 21l-4.35-4.35",
    "M11 19A8 8 0 1 0 11 3a8 8 0 0 0 0 16z",
    "M8 11h6",
  ],
  fit: ["M15 3h6v6", "M9 21H3v-6", "M21 3l-7 7", "M3 21l7-7"],
  group: [
    "M2 7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z",
    "M14 7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z",
    "M2 17a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z",
  ],
  ungroup: [
    "M8 3H5a2 2 0 0 0-2 2v3",
    "M21 8V5a2 2 0 0 0-2-2h-3",
    "M3 16v3a2 2 0 0 0 2 2h3",
    "M16 21h3a2 2 0 0 0 2-2v-3",
  ],
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  chevD: "M6 9l6 6 6-6",
};

/* ─────────────────────────────────────────────────────────────────────────────
   TOOLTIP
───────────────────────────────────────────────────────────────────────────── */
function Tip({ label, kbd, side = "top", children, delay = 400 }) {
  const [v, setV] = useState(false);
  const timer = useRef(null);
  const show = () => {
    timer.current = setTimeout(() => setV(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setV(false);
  };
  const pos =
    {
      top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
      bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
      right: "left-full ml-2 top-1/2 -translate-y-1/2",
      left: "right-full mr-2 top-1/2 -translate-y-1/2",
    }[side] || "bottom-full mb-2 left-1/2 -translate-x-1/2";
  return (
    <div
      className="relative flex shrink-0"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {v && label && (
        <div
          className={`absolute ${pos} z-[9999] pointer-events-none whitespace-nowrap bg-gray-900 text-white text-[11px] font-medium rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-xl`}
        >
          {label}
          {kbd && (
            <kbd className="bg-white/20 text-white/80 text-[9px] px-1.5 py-0.5 rounded font-mono">
              {kbd}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}

const Sep = () => <div className="w-px h-5 bg-gray-200 shrink-0 mx-0.5" />;
const HSep = () => <div className="h-px bg-gray-100 my-2" />;

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_KEY;
const PER_PAGE = 24;
const BLANK_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const COLORS = [
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#e94560",
  "#f5a623",
  "#7ed321",
  "#4a90e2",
  "#50e3c2",
  "#ffffff",
  "#f8f9fa",
  "#dee2e6",
];

const SHAPES = [
  {
    label: "Rectangle",
    make: () =>
      new fabric.Rect({
        width: 200,
        height: 130,
        fill: "#e0e7ff",
        strokeWidth: 0,
        rx: 0,
      }),
  },
  {
    label: "Rounded",
    make: () =>
      new fabric.Rect({
        width: 200,
        height: 130,
        fill: "#e0e7ff",
        strokeWidth: 0,
        rx: 20,
      }),
  },
  {
    label: "Circle",
    make: () =>
      new fabric.Circle({ radius: 80, fill: "#e0e7ff", strokeWidth: 0 }),
  },
  {
    label: "Triangle",
    make: () =>
      new fabric.Triangle({
        width: 160,
        height: 140,
        fill: "#fef3c7",
        strokeWidth: 0,
      }),
  },
  {
    label: "Line",
    make: () =>
      new fabric.Line([0, 0, 200, 0], { stroke: "#6366f1", strokeWidth: 3 }),
  },
  {
    label: "Star",
    make: () => {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? 80 : 35,
          a = (i * Math.PI) / 5 - Math.PI / 2;
        return { x: 80 + r * Math.cos(a), y: 80 + r * Math.sin(a) };
      });
      return new fabric.Polygon(pts, {
        fill: "#fef3c7",
        stroke: "#f59e0b",
        strokeWidth: 0,
      });
    },
  },
  {
    label: "Diamond",
    make: () =>
      new fabric.Polygon(
        [
          { x: 80, y: 0 },
          { x: 160, y: 80 },
          { x: 80, y: 160 },
          { x: 0, y: 80 },
        ],
        { fill: "#fce7f3", strokeWidth: 0 },
      ),
  },
  {
    label: "Hexagon",
    make: () => {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3;
        return { x: 80 + 80 * Math.cos(a), y: 80 + 80 * Math.sin(a) };
      });
      return new fabric.Polygon(pts, { fill: "#ede9fe", strokeWidth: 0 });
    },
  },
  {
    label: "Arrow",
    make: () => {
      const line = new fabric.Line([0, 0, 160, 0], {
        stroke: "#6366f1",
        strokeWidth: 3,
        originX: "left",
        originY: "center",
      });
      const head = new fabric.Triangle({
        width: 20,
        height: 20,
        fill: "#6366f1",
        left: 150,
        top: -10,
        angle: 90,
      });
      return new fabric.Group([line, head]);
    },
  },
];

const PLACEHOLDERS = [
  { key: "name", label: "Name", emoji: "👤" },
  { key: "roll_no", label: "Roll No.", emoji: "#" },
  { key: "class", label: "Class", emoji: "🎓" },
  { key: "photo", label: "Photo", emoji: "📷", isImage: true },
  { key: "date", label: "Date", emoji: "📅" },
  { key: "id", label: "ID", emoji: "🪪" },
  { key: "email", label: "Email", emoji: "✉️" },
  { key: "phone", label: "Phone", emoji: "📱" },
  { key: "department", label: "Department", emoji: "🏢" },
  { key: "designation", label: "Designation", emoji: "💼" },
];

const SIZE_PRESETS = [
  { label: "ID Card", w: 1050, h: 675 },
  { label: "Certificate", w: 3300, h: 2550 },
  { label: "Business Card", w: 1125, h: 675 },
  { label: "A4 Portrait", w: 2480, h: 3508 },
  { label: "A4 Landscape", w: 3508, h: 2480 },
  { label: "Badge", w: 600, h: 800 },
  { label: "Ticket", w: 1000, h: 400 },
  { label: "Instagram", w: 1080, h: 1080 },
];

const CATEGORIES = [
  "id_card",
  "certificate",
  "invite",
  "badge",
  "business_card",
  "ticket",
  "label",
  "other",
];
const FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Impact",
  "Tahoma",
  "Palatino",
];

/* ─────────────────────────────────────────────────────────────────────────────
   ICONIFY ELEMENT SEARCH (NEW)
───────────────────────────────────────────────────────────────────────────── */
function ElementSearch({ onSelect }) {
  const [q, setQ] = useState("shape");
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function doSearch(query) {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=48`,
      );
      const data = await res.json();
      setResults(data.icons || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    const q2 = input.trim();
    if (!q2) return;
    setQ(q2);
    doSearch(q2);
  }

  useEffect(() => {
    doSearch("shape");
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-100 shrink-0">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Ico
              d={I.search}
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Search elements…"
              className="w-full pl-8 pr-2 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 shrink-0"
          >
            {loading ? "…" : "Go"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0 ps">
        {loading ? (
          <div className="flex justify-center py-12">
            <svg
              className="w-6 h-6 animate-spin text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Ico d={I.star} size={36} className="text-gray-200" />
            <p className="text-xs text-gray-400 font-medium">Search vectors</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 content-start">
            {results.map((iconName) => {
              const [prefix, name] = iconName.split(":");
              // Inside ElementSearch component:

              const svgUrl = `https://api.iconify.design/${prefix}/${name}.svg?color=%231a1a2e`;
              return (
                <button
                  key={iconName}
                  onClick={() => onSelect(svgUrl)}
                  className="relative aspect-square rounded-xl bg-white border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all flex items-center justify-center p-2 group"
                >
                  <img
                    src={svgUrl}
                    alt={iconName}
                    className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGINATED PIXABAY SEARCH
───────────────────────────────────────────────────────────────────────────── */
function ImageSearch({ onSelect }) {
  const [q, setQ] = useState("");
  const [input, setInput] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  async function doSearch(query, pg) {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=${PER_PAGE}&page=${pg}`,
      );
      const d = await r.json();
      setResults(d.hits || []);
      setTotal(d.totalHits || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }

  function submit() {
    const q2 = input.trim();
    if (!q2) return;
    setQ(q2);
    setPage(1);
    doSearch(q2, 1);
  }

  function goPage(pg) {
    if (pg < 1 || pg > totalPages) return;
    setPage(pg);
    doSearch(q, pg);
    document.getElementById("pb-grid")?.scrollTo(0, 0);
  }

  const pageNums = () => {
    const s = Math.max(1, page - 2),
      e = Math.min(totalPages, s + 4);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-100 shrink-0">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Ico
              d={I.search}
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Search free photos…"
              className="w-full pl-8 pr-2 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 shrink-0"
          >
            {loading ? "…" : "Go"}
          </button>
        </div>
        {total > 0 && (
          <p className="text-[10px] text-gray-400 mt-1">
            {total.toLocaleString()} results · page {page}/{totalPages}
          </p>
        )}
      </div>

      {/* Grid */}
      <div id="pb-grid" className="flex-1 overflow-y-auto p-2 min-h-0">
        {loading && (
          <div className="flex justify-center py-12">
            <svg
              className="w-6 h-6 animate-spin text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        )}
        {!loading && results.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Ico d={I.img} size={36} className="text-gray-200" />
            <p className="text-xs text-gray-400 font-medium">
              Search Pixabay photos
            </p>
          </div>
        )}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {results.map((img) => (
              <button
                key={img.id}
                onClick={() => onSelect(img.webformatURL)}
                className="relative aspect-[4/3] rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <img
                  src={img.previewURL}
                  alt={img.tags}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end p-1.5 opacity-0 group-hover:opacity-100">
                  <span className="text-white text-[9px] bg-black/60 rounded-lg px-1.5 py-0.5">
                    Add
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="shrink-0 border-t border-gray-100 px-2 py-2 flex items-center justify-center gap-1 flex-wrap">
          <button
            onClick={() => goPage(page - 1)}
            disabled={page <= 1}
            className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-xs flex items-center justify-center"
          >
            ‹
          </button>
          {page > 3 && (
            <>
              <button
                onClick={() => goPage(1)}
                className="w-7 h-7 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
              >
                1
              </button>
              {page > 4 && <span className="text-gray-400 text-xs">…</span>}
            </>
          )}
          {pageNums().map((n) => (
            <button
              key={n}
              onClick={() => goPage(n)}
              className={`w-7 h-7 rounded-lg border text-xs font-medium ${n === page ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {n}
            </button>
          ))}
          {page < totalPages - 2 && (
            <>
              {page < totalPages - 3 && (
                <span className="text-gray-400 text-xs">…</span>
              )}
              <button
                onClick={() => goPage(totalPages)}
                className="w-7 h-7 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => goPage(page + 1)}
            disabled={page >= totalPages}
            className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-xs flex items-center justify-center"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SHADOW CONTROL
───────────────────────────────────────────────────────────────────────────── */
function ShadowPanel({ obj, fc, onUpdate }) {
  const on = !!obj.shadow;
  const s = obj.shadow || {};
  const color = (typeof s === "object" ? s.color : null) || "#00000066";
  const blur = (typeof s === "object" ? s.blur : null) ?? 15;
  const offsetX = (typeof s === "object" ? s.offsetX : null) ?? 5;
  const offsetY = (typeof s === "object" ? s.offsetY : null) ?? 5;

  function apply(u) {
    const next = { color, blur, offsetX, offsetY, ...u };
    obj.set({ shadow: new fabric.Shadow(next) });
    fc.requestRenderAll();
    onUpdate();
  }
  function toggle() {
    obj.set({
      shadow: on
        ? null
        : new fabric.Shadow({
            color: "#00000066",
            blur: 15,
            offsetX: 5,
            offsetY: 5,
          }),
    });
    fc.requestRenderAll();
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Shadow
        </span>
        <button
          onClick={toggle}
          className={`relative w-9 h-5 rounded-full transition-colors ${on ? "bg-indigo-600" : "bg-gray-200"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`}
          />
        </button>
      </div>
      {on && (
        <div className="grid grid-cols-2 gap-1.5">
          <label>
            <span className="text-[10px] text-gray-500">Color</span>
            <input
              type="color"
              className="w-full h-7 rounded-lg border border-gray-200 mt-0.5 cursor-pointer p-0.5 bg-white"
              value={color.slice(0, 7)}
              onChange={(e) => apply({ color: e.target.value + "66" })}
            />
          </label>
          <label>
            <span className="text-[10px] text-gray-500">Blur</span>
            <input
              type="number"
              min={0}
              max={100}
              className="block w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
              value={blur}
              onChange={(e) => apply({ blur: +e.target.value })}
            />
          </label>
          <label>
            <span className="text-[10px] text-gray-500">Offset X</span>
            <input
              type="number"
              min={-100}
              max={100}
              className="block w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
              value={offsetX}
              onChange={(e) => apply({ offsetX: +e.target.value })}
            />
          </label>
          <label>
            <span className="text-[10px] text-gray-500">Offset Y</span>
            <input
              type="number"
              min={-100}
              max={100}
              className="block w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
              value={offsetY}
              onChange={(e) => apply({ offsetY: +e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   RIGHT PROPERTIES DRAWER (slides in from right, Canva style)
───────────────────────────────────────────────────────────────────────────── */
function PropDrawer({ obj, fc, onUpdate, onClose }) {
  if (!obj) return null;

  function set(p) {
    obj.set(p);
    fc.requestRenderAll();
    onUpdate();
  }

  const isText = ["textbox", "text", "i-text"].includes(obj.type);
  // FIX 1: Recognize SVGs (paths and vector groups) as Shapes so the Color menu shows up
  const isShape = ["rect", "circle", "triangle", "polygon", "path"].includes(obj.type) || (obj.type === "group" && !obj._isImagePlaceholder);
  const isLine = obj.type === "line";
  const isGroup = obj.type === "group";
  const isMulti = obj.type === "activeSelection";

  // FIX 2: Recursive color applier for SVGs and Multiple Selections
  function applyColor(target, key, val) {
    if (target.type === "group" || target.type === "activeSelection") {
      target.getObjects().forEach((child) => applyColor(child, key, val));
    }
    // Prevent filling in transparent bounding boxes inside SVGs
    if (key === "fill" && (target.fill === "none" || target.fill === "transparent")) return;
    target.set({ [key]: val });
  }

  function handleColorChange(key, val) {
    applyColor(obj, key, val);
    fc.requestRenderAll();
    onUpdate();
  }

  const PI = ({ label, ...p }) => (
    <label>
      <span className="text-[10px] text-gray-500 font-medium">{label}</span>
      <input
        className="block w-full mt-0.5 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        {...p}
      />
    </label>
  );

  function layerFn(type) {
    const f = fc;
    const o = obj;
    try {
      if (type === "front") {
        try { f.bringToFront(o); } catch (_) { f.bringObjectToFront?.(o); }
      } else if (type === "fwd") {
        try { o.bringForward(true); } catch (_) { f.bringObjectForward?.(o); }
      } else if (type === "bwd") {
        try { o.sendBackwards(true); } catch (_) { f.sendObjectBackwards?.(o); }
      } else if (type === "back") {
        try { f.sendToBack(o); } catch (_) { f.sendObjectToBack?.(o); }
      }
    } catch {}
    f.requestRenderAll();
    onUpdate();
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          {isMulti ? `${obj._objects?.length ?? "?"} selected` : isGroup && obj._isImagePlaceholder ? "Placeholder" : obj.type}
        </span>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
          <Ico d={I.x} size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm" style={{ scrollbarWidth: "thin" }}>
        {/* Transform */}
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Transform</p>
          <div className="grid grid-cols-2 gap-1.5">
            <PI label="X" type="number" step="1" value={Math.round(obj.left || 0)} onChange={(e) => set({ left: +e.target.value })} />
            <PI label="Y" type="number" step="1" value={Math.round(obj.top || 0)} onChange={(e) => set({ top: +e.target.value })} />
            <PI label="W" type="number" step="1" value={Math.round((obj.width || 0) * (obj.scaleX || 1))} onChange={(e) => set({ scaleX: +e.target.value / (obj.width || 1) })} />
            <PI label="H" type="number" step="1" value={Math.round((obj.height || 0) * (obj.scaleY || 1))} onChange={(e) => set({ scaleY: +e.target.value / (obj.height || 1) })} />
            <label className="col-span-2">
              <span className="text-[10px] text-gray-500 font-medium">Rotation</span>
              <div className="flex items-center gap-2 mt-0.5">
                <input type="range" min={-180} max={180} className="flex-1 accent-indigo-600 h-1.5" value={Math.round(obj.angle || 0)} onChange={(e) => set({ angle: +e.target.value })} />
                <span className="text-xs w-9 text-right text-gray-600 tabular-nums">{Math.round(obj.angle || 0)}°</span>
              </div>
            </label>
          </div>
        </section>

        <HSep />

        {/* Opacity */}
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Opacity</p>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={1} step={0.01} className="flex-1 accent-indigo-600 h-1.5" value={obj.opacity ?? 1} onChange={(e) => set({ opacity: +e.target.value })} />
            <span className="text-xs w-9 text-right font-medium text-gray-700">{Math.round((obj.opacity ?? 1) * 100)}%</span>
          </div>
        </section>

        <HSep />

        {/* Text */}
        {isText && (
          <section className="space-y-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Text</p>
            <textarea rows={3} className="block w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 leading-relaxed" value={obj.text || ""} onChange={(e) => set({ text: e.target.value })} />
            <p className="text-[10px] text-gray-400">Use <code className="bg-indigo-50 text-indigo-600 px-1 rounded">{"{key}"}</code> for variable data</p>
            <div className="grid grid-cols-2 gap-1.5">
              <PI label="Font size" type="number" value={obj.fontSize || 16} onChange={(e) => set({ fontSize: +e.target.value })} />
              <label>
                <span className="text-[10px] text-gray-500 font-medium">Color</span>
                <input type="color" className="block w-full h-8 rounded-lg border border-gray-200 mt-0.5 cursor-pointer p-0.5 bg-white" value={String(obj.fill || "#000000").startsWith("#") ? obj.fill : "#000000"} onChange={(e) => handleColorChange("fill", e.target.value)} />
              </label>
            </div>
            <label>
              <span className="text-[10px] text-gray-500 font-medium block mb-0.5">Font family</span>
              <select className="block w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-indigo-400" value={obj.fontFamily || "Arial"} onChange={(e) => set({ fontFamily: e.target.value })}>
                {FONTS.map((f) => (<option key={f} value={f}>{f}</option>))}
              </select>
            </label>
            <div className="flex gap-1">
              {[
                ["B", "font-bold", { fontWeight: obj.fontWeight === "bold" ? "normal" : "bold" }, obj.fontWeight === "bold"],
                ["I", "italic", { fontStyle: obj.fontStyle === "italic" ? "normal" : "italic" }, obj.fontStyle === "italic"],
                ["U", "underline", { underline: !obj.underline }, obj.underline],
              ].map(([l, cls, p, on]) => (
                <button key={l} onClick={() => set(p)} className={`flex-1 h-8 rounded-lg border text-xs ${cls} ${on ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{l}</button>
              ))}
            </div>
            <div className="flex gap-1">
              {["left", "center", "right", "justify"].map((a) => (
                <button key={a} onClick={() => set({ textAlign: a })} className={`flex-1 h-8 rounded-lg border text-[10px] uppercase font-semibold ${obj.textAlign === a ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{a[0]}</button>
              ))}
            </div>
            <label>
              <span className="text-[10px] text-gray-500 font-medium">Letter spacing</span>
              <div className="flex items-center gap-2 mt-0.5">
                <input type="range" min={-200} max={800} step={10} className="flex-1 accent-indigo-600 h-1.5" value={obj.charSpacing || 0} onChange={(e) => set({ charSpacing: +e.target.value })} />
                <span className="text-xs w-8 text-right text-gray-600">{obj.charSpacing || 0}</span>
              </div>
            </label>
            <label>
              <span className="text-[10px] text-gray-500 font-medium">Line height</span>
              <div className="flex items-center gap-2 mt-0.5">
                <input type="range" min={0.8} max={3} step={0.05} className="flex-1 accent-indigo-600 h-1.5" value={obj.lineHeight || 1.16} onChange={(e) => set({ lineHeight: +e.target.value })} />
                <span className="text-xs w-8 text-right text-gray-600">{(obj.lineHeight || 1.16).toFixed(1)}</span>
              </div>
            </label>
          </section>
        )}

        {/* Shape */}
        {(isShape || isLine) && (
          <section className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Appearance</p>
            {!isLine && (
              <label>
                <span className="text-[10px] text-gray-500 font-medium">Fill</span>
                <input type="color" className="block w-full h-8 rounded-lg border border-gray-200 mt-0.5 cursor-pointer p-0.5 bg-white" value={String(obj.fill || "#e8e8e8").startsWith("#") ? obj.fill : "#e8e8e8"} onChange={(e) => handleColorChange("fill", e.target.value)} />
              </label>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              <label>
                <span className="text-[10px] text-gray-500 font-medium">Stroke</span>
                <input type="color" className="block w-full h-8 rounded-lg border border-gray-200 mt-0.5 cursor-pointer p-0.5 bg-white" value={String(obj.stroke || "#cccccc").startsWith("#") ? obj.stroke : "#cccccc"} onChange={(e) => handleColorChange("stroke", e.target.value)} />
              </label>
              <PI label="Stroke W" type="number" min={0} max={40} value={obj.strokeWidth || 0} onChange={(e) => set({ strokeWidth: +e.target.value })} />
            </div>
            {obj.type === "rect" && (
              <PI label="Corner radius" type="number" min={0} max={200} value={obj.rx || 0} onChange={(e) => set({ rx: +e.target.value, ry: +e.target.value }) } />
            )}
          </section>
        )}

        {(isShape || isLine || isText) && <HSep />}

        {/* Shadow */}
        <ShadowPanel obj={obj} fc={fc} onUpdate={onUpdate} />

        <HSep />

        {/* Layer order */}
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Layer order</p>
          <div className="grid grid-cols-4 gap-1">
            {[ ["To front", "front", I.up], ["Forward", "fwd", I.up], ["Backward", "bwd", I.down], ["To back", "back", I.down] ].map(([lbl, t, ic]) => (
              <Tip key={t} label={lbl} side="top">
                <button onClick={() => layerFn(t)} className="h-9 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 flex items-center justify-center text-gray-500 transition-all w-full">
                  <Ico d={ic} size={14} />
                </button>
              </Tip>
            ))}
          </div>
        </section>

        {/* Delete */}
        <button onClick={() => { fc.remove(obj); fc.discardActiveObject(); fc.requestRenderAll(); onUpdate(); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-xs font-medium mt-2">
          <Ico d={I.trash} size={13} /> Delete element
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FLOATING CONTEXT TOOLBAR  (appears above selection, Canva-style)
───────────────────────────────────────────────────────────────────────────── */
function ContextBar({ obj, fc, onUpdate, onOpenProps, onDuplicate, onDelete, onGroup, onUngroup }) {
  if (!obj) return null;
  const isText = ["textbox", "text", "i-text"].includes(obj.type);
  const isGroup = obj.type === "group";
  const isMulti = obj.type === "activeSelection";
  const isLine = obj.type === "line";
  
  // FIX 1: Treat SVGs and Paths as Shapes
  const isShape = ["rect", "circle", "triangle", "polygon", "path"].includes(obj.type) || (obj.type === "group" && !obj._isImagePlaceholder);

  // FIX 2: Recursive SVG Color logic
  function applyColor(target, key, val) {
    if (target.type === "group" || target.type === "activeSelection") {
      target.getObjects().forEach((child) => applyColor(child, key, val));
    }
    if (key === "fill" && (target.fill === "none" || target.fill === "transparent")) return;
    target.set({ [key]: val });
  }

  function handleColorChange(key, val) {
    applyColor(obj, key, val);
    fc.requestRenderAll();
    onUpdate();
  }

  function layerFn(type) {
    try {
      if (type === "front") { try { fc.bringToFront(obj); } catch (_) { fc.bringObjectToFront?.(obj); } } 
      else if (type === "fwd") { try { obj.bringForward(true); } catch (_) { fc.bringObjectForward?.(obj); } } 
      else if (type === "bwd") { try { obj.sendBackwards(true); } catch (_) { fc.sendObjectBackwards?.(obj); } } 
      else if (type === "back") { try { fc.sendToBack(obj); } catch (_) { fc.sendObjectToBack?.(obj); } }
    } catch {}
    fc.requestRenderAll();
    onUpdate();
  }

  return (
    <div className="flex items-center gap-0.5 px-2 overflow-x-auto bg-white border-b border-gray-100 shadow-sm z-30 shrink-0" style={{ minHeight: 40, scrollbarWidth: "none" }}>
      {/* Text quick props */}
      {isText && (
        <>
          <select value={obj.fontFamily || "Arial"} onChange={(e) => { obj.set({ fontFamily: e.target.value }); fc.requestRenderAll(); onUpdate(); }} className="text-xs border border-gray-200 rounded-lg px-2 py-1 mr-1 focus:outline-none focus:border-indigo-400 bg-white h-8 shrink-0 max-w-[120px]">
            {FONTS.map((f) => (<option key={f} value={f}>{f}</option>))}
          </select>
          <div className="flex items-center border border-gray-200 rounded-lg h-8 overflow-hidden shrink-0">
            <button onClick={() => { obj.set({ fontSize: Math.max(6, (obj.fontSize || 16) - 1) }); fc.requestRenderAll(); onUpdate(); }} className="w-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-bold h-full">−</button>
            <input type="number" className="w-10 text-center text-xs border-0 outline-none" value={obj.fontSize || 16} onChange={(e) => { obj.set({ fontSize: +e.target.value }); fc.requestRenderAll(); onUpdate(); }} />
            <button onClick={() => { obj.set({ fontSize: (obj.fontSize || 16) + 1 }); fc.requestRenderAll(); onUpdate(); }} className="w-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-bold h-full">+</button>
          </div>
          <label className="ml-1 shrink-0">
            <Tip label="Text color" side="bottom">
              <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5 bg-white" value={String(obj.fill || "#000000").startsWith("#") ? obj.fill : "#000000"} onChange={(e) => handleColorChange("fill", e.target.value)} />
            </Tip>
          </label>
          <Sep />
          {[
            ["B", "fontWeight", "bold", "normal", "font-bold"],
            ["I", "fontStyle", "italic", "normal", "italic"],
            ["U", "underline", true, false, "underline"],
          ].map(([l, k, on, off, cls]) => (
            <Tip key={l} label={l === "B" ? "Bold" : l === "I" ? "Italic" : "Underline"} side="bottom">
              <button onClick={() => { obj.set({ [k]: obj[k] === on ? off : on }); fc.requestRenderAll(); onUpdate(); }} className={`w-8 h-8 rounded-lg text-xs ${cls} ${(l === "B" && obj.fontWeight === "bold") || (l === "I" && obj.fontStyle === "italic") || (l === "U" && obj.underline) ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100"}`}>{l}</button>
            </Tip>
          ))}
          <Sep />
          {["left", "center", "right"].map((a) => (
            <Tip key={a} label={`Align ${a}`} side="bottom">
              <button onClick={() => { obj.set({ textAlign: a }); fc.requestRenderAll(); onUpdate(); }} className={`w-8 h-8 rounded-lg text-[10px] font-bold ${obj.textAlign === a ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}>{a[0].toUpperCase()}</button>
            </Tip>
          ))}
          <Sep />
        </>
      )}

      {/* SHAPE/SVG PROPERTIES */}
      {(isShape || isLine) && (
        <>
          {!isLine && (
            <label className="ml-1 shrink-0">
              <Tip label="Fill Color" side="bottom">
                <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5 bg-white" value={String(obj.fill || "#e8e8e8").startsWith("#") ? obj.fill : "#e8e8e8"} onChange={(e) => handleColorChange("fill", e.target.value)} />
              </Tip>
            </label>
          )}
          <label className="ml-1 shrink-0">
            <Tip label="Border Color" side="bottom">
              <input type="color" className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5 bg-white" value={String(obj.stroke || "#cccccc").startsWith("#") ? obj.stroke : "#cccccc"} onChange={(e) => handleColorChange("stroke", e.target.value)} />
            </Tip>
          </label>
          <Sep />
        </>
      )}

      {/* Common actions */}
      <Tip label="Duplicate" kbd="⌘D" side="bottom">
        <button onClick={onDuplicate} className="flex items-center gap-1 px-2 h-8 rounded-lg hover:bg-gray-100 text-xs text-gray-600 shrink-0">
          <Ico d={I.copy} size={13} />
          <span className="hidden sm:inline">Dup</span>
        </button>
      </Tip>

      {isMulti && (
        <Tip label="Group" kbd="⌘G" side="bottom">
          <button onClick={onGroup} className="flex items-center gap-1 px-2 h-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-xs text-gray-600 shrink-0">
            <Ico d={I.group} size={13} />
            <span className="hidden sm:inline">Group</span>
          </button>
        </Tip>
      )}

      {isGroup && !obj._isImagePlaceholder && (
        <Tip label="Ungroup" kbd="⌘⇧G" side="bottom">
          <button onClick={onUngroup} className="flex items-center gap-1 px-2 h-8 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-xs text-gray-600 shrink-0">
            <Ico d={I.ungroup} size={13} />
            <span className="hidden sm:inline">Ungroup</span>
          </button>
        </Tip>
      )}

      <Sep />

      {/* Layer */}
      <Tip label="Bring to front" kbd="⌘⇧]" side="bottom">
        <button onClick={() => layerFn("front")} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
          <Ico d={I.up} size={13} />
        </button>
      </Tip>
      <Tip label="Forward" kbd="⌘]" side="bottom">
        <button onClick={() => layerFn("fwd")} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 15V5M7 10l5-5 5 5" /><path d="M5 19h14" strokeOpacity="0.3" /></svg>
        </button>
      </Tip>
      <Tip label="Backward" kbd="⌘[" side="bottom">
        <button onClick={() => layerFn("bwd")} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 9v10M7 14l5 5 5-5" /><path d="M5 5h14" strokeOpacity="0.3" /></svg>
        </button>
      </Tip>
      <Tip label="Send to back" kbd="⌘⇧[" side="bottom">
        <button onClick={() => layerFn("back")} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500">
          <Ico d={I.down} size={13} />
        </button>
      </Tip>

      <Sep />

      {/* Opacity inline */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-gray-400 hidden sm:block">Opacity</span>
        <input type="number" min={0} max={100} className="w-11 px-1 py-1 text-xs border border-gray-200 rounded-lg text-center outline-none focus:border-indigo-400 tabular-nums" value={Math.round((obj.opacity ?? 1) * 100)} onChange={(e) => { obj.set({ opacity: +e.target.value / 100 }); fc.requestRenderAll(); }} onBlur={() => onUpdate()} />
        <span className="text-[10px] text-gray-400">%</span>
      </div>

      <div className="flex-1" />

      {/* Properties button */}
      <Tip label="Properties" side="bottom">
        <button onClick={onOpenProps} className="flex items-center gap-1 px-2 h-8 rounded-lg hover:bg-gray-100 text-xs text-gray-600 shrink-0">
          <Ico d={I.settings} size={13} />
          <span className="hidden md:inline">Properties</span>
        </button>
      </Tip>
      <Tip label="Delete" kbd="Del" side="bottom">
        <button onClick={onDelete} className="w-8 h-8 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 shrink-0">
          <Ico d={I.trash} size={13} />
        </button>
      </Tip>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EDITOR
───────────────────────────────────────────────────────────────────────────── */
export default function TemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const fcRef = useRef(null);
  const fileRef = useRef(null);
  const panRef = useRef({ active: false, x: 0, y: 0, sl: 0, st: 0 });
  const isEdit = !!id;

  const logW = useRef(1050);
  const logH = useRef(675);
  const zoomR = useRef(1);

  // UI state
  const [name, setName] = useState("Untitled template");
  const [category, setCategory] = useState("other");
  const [panel, setPanel] = useState("elements"); // active left panel id or null
  const [panelOpen, setPanelOpen] = useState(true); // whether left drawer is visible
  const [propOpen, setPropOpen] = useState(false); // right properties drawer
  const [selected, setSelected] = useState(null);
  const [multiCount, setMultiCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [dispW, setDispW] = useState(1050);
  const [dispH, setDispH] = useState(675);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [editName, setEditName] = useState(false);
  const [layers, setLayers] = useState([]);
  const [includeBleed, setIncludeBleed] = useState(false);
  // Mobile panel sheet
  const [mobilePanel, setMobilePanel] = useState(null);
  const [mobilePropOpen, setMobilePropOpen] = useState(false);
  const [sizeMode, setSizeMode] = useState(false);

  // History
  const histRef = useRef([]);
  const histIdx = useRef(-1);
  const skipHist = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  function refreshUR() {
    setCanUndo(histIdx.current > 0);
    setCanRedo(histIdx.current < histRef.current.length - 1);
  }

  function pushHistory(fc) {
    if (skipHist.current) return;
    const json = JSON.stringify(
      fc.toJSON(["_placeholderKey", "_isImagePlaceholder", "_placeholderSrc"]),
    );
    histRef.current = histRef.current.slice(0, histIdx.current + 1);
    histRef.current.push(json);
    histIdx.current = histRef.current.length - 1;
    refreshUR();
    refreshLayers(fc);
  }

  function refreshLayers(fc) {
    if (!fc) return;
    setLayers(
      fc
        .getObjects()
        .slice()
        .reverse()
        .map((o) => ({
          id: o.__uid || (o.__uid = Math.random().toString(36).slice(2)),
          label: o._isImagePlaceholder
            ? `📷 {${o._placeholderKey}}`
            : o.type === "textbox" || o.type === "text"
              ? `T  ${(o.text || "").slice(0, 18)}`
              : o.type,
          obj: o,
        })),
    );
  }

  /* ── Zoom ──────────────────────────────────────────────────────────────── */
  function applyZoom(z, fc) {
    const canvas = fc || fcRef.current;
    if (!canvas) return;
    const c = Math.max(0.05, Math.min(4, z));
    canvas.setZoom(c);
    canvas.setWidth(logW.current * c);
    canvas.setHeight(logH.current * c);
    canvas.requestRenderAll();
    zoomR.current = c;
    setZoom(Math.round(c * 100));
  }

  function zoomToFit() {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const z = Math.min(
      (wrap.clientWidth - 80) / logW.current,
      (wrap.clientHeight - 80) / logH.current,
      1,
    );
    applyZoom(z);
  }

  /* ── Ctrl+wheel zoom ──────────────────────────────────────────────────── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const h = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      applyZoom(zoomR.current - e.deltaY * 0.001);
    };
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, []);

  /* ── Space/middle-click pan ───────────────────────────────────────────── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let space = false;
    const kd = (e) => {
      if (
        e.code === "Space" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName,
        )
      ) {
        e.preventDefault();
        space = true;
        el.style.cursor = "grab";
      }
    };
    const ku = (e) => {
      if (e.code === "Space") {
        space = false;
        el.style.cursor = "";
      }
    };
    const md = (e) => {
      if (e.button === 1 || space) {
        e.preventDefault();
        panRef.current = {
          active: true,
          x: e.clientX,
          y: e.clientY,
          sl: el.scrollLeft,
          st: el.scrollTop,
        };
        el.style.cursor = "grabbing";
      }
    };
    const mm = (e) => {
      if (!panRef.current.active) return;
      const p = panRef.current;
      el.scrollLeft = p.sl - (e.clientX - p.x);
      el.scrollTop = p.st - (e.clientY - p.y);
    };
    const mu = () => {
      panRef.current.active = false;
      el.style.cursor = space ? "grab" : "";
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    el.addEventListener("mousedown", md);
    el.addEventListener("mousemove", mm);
    el.addEventListener("mouseup", mu);
    el.addEventListener("mouseleave", mu);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      el.removeEventListener("mousedown", md);
      el.removeEventListener("mousemove", mm);
      el.removeEventListener("mouseup", mu);
      el.removeEventListener("mouseleave", mu);
    };
  }, []);

  /* ── Init canvas ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const fc = new fabric.Canvas(canvasRef.current, {
      width: logW.current,
      height: logH.current,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
    });
    fcRef.current = fc;

    // 🔥 Initialize Canva-style Smart Guides here!
    initAligningGuidelines(fc);

    fc.on("selection:created", (e) => {
      const sel = e.selected || [];
      if (sel.length > 1) {
        setMultiCount(sel.length);
        setSelected(fc.getActiveObject());
      } else {
        setMultiCount(0);
        setSelected(sel[0] ?? null);
      }
    });
    fc.on("selection:updated", (e) => {
      const sel = e.selected || [];
      if (sel.length > 1) {
        setMultiCount(sel.length);
        setSelected(fc.getActiveObject());
      } else {
        setMultiCount(0);
        setSelected(sel[0] ?? null);
      }
    });
    fc.on("selection:cleared", () => {
      setSelected(null);
      setMultiCount(0);
      setPropOpen(false);
    });
    fc.on("object:modified", () => pushHistory(fc));
    fc.on("object:added", () => pushHistory(fc));
    fc.on("object:removed", () => pushHistory(fc));

    const snap = JSON.stringify(fc.toJSON());
    histRef.current = [snap];
    histIdx.current = 0;
    refreshUR();

    if (isEdit) {
      api
        .get(`/templates/${id}`)
        .then(({ data }) => {
          const t = data.data;
          setName(t.name);
          setCategory(t.category);
          logW.current = t.width_px;
          logH.current = t.height_px;
          setDispW(t.width_px);
          setDispH(t.height_px);
          let cj = t.canvas_json;
          if (typeof cj === "string") {
            cj = cj.replace(
              /"src"\s*:\s*"(\{[^}]+\})"/g,
              (_, ph) => `"src":"${BLANK_PNG}","_placeholderSrc":"${ph}"`,
            );
            cj = JSON.parse(cj);
          }
          skipHist.current = true;
          fc.loadFromJSON(cj, () => {
            if (fc.backgroundColor) setBgColor(fc.backgroundColor);
            skipHist.current = false;
            const s2 = JSON.stringify(
              fc.toJSON([
                "_placeholderKey",
                "_isImagePlaceholder",
                "_placeholderSrc",
              ]),
            );
            histRef.current = [s2];
            histIdx.current = 0;
            refreshUR();
            refreshLayers(fc);
            setLoading(false);
            setTimeout(zoomToFit, 150);
          });
        })
        .catch(() => {
          setError("Failed to load template");
          setLoading(false);
        });
    } else {
      setTimeout(zoomToFit, 150);
    }
    return () => {
      fc.off();
      fc.dispose();
    };
  }, []);

  /* ── Undo / Redo ──────────────────────────────────────────────────────── */
  function undo() {
    if (histIdx.current <= 0) return;
    histIdx.current--;
    skipHist.current = true;
    fcRef.current.loadFromJSON(
      JSON.parse(histRef.current[histIdx.current]),
      () => {
        applyZoom(zoomR.current);
        skipHist.current = false;
        refreshUR();
        refreshLayers(fcRef.current);
      },
    );
  }
  function redo() {
    if (histIdx.current >= histRef.current.length - 1) return;
    histIdx.current++;
    skipHist.current = true;
    fcRef.current.loadFromJSON(
      JSON.parse(histRef.current[histIdx.current]),
      () => {
        applyZoom(zoomR.current);
        skipHist.current = false;
        refreshUR();
        refreshLayers(fcRef.current);
      },
    );
  }

  /* ── Add helpers ──────────────────────────────────────────────────────── */
  function add(obj) {
    obj.set({ left: obj.left ?? 60, top: obj.top ?? 60 });
    fcRef.current.add(obj);
    fcRef.current.setActiveObject(obj);
    fcRef.current.requestRenderAll();
  }
  function addText(c = "Add text here") {
    add(
      new fabric.Textbox(c, {
        left: 80,
        top: 80,
        width: 280,
        fontSize: 28,
        fill: "#1a1a2e",
        fontFamily: "Arial",
      }),
    );
  }
  function addPlaceholderText(key) {
    add(
      new fabric.Textbox(`{${key}}`, {
        left: 80,
        top: 80,
        width: 280,
        fontSize: 26,
        fill: "#4f46e5",
        fontFamily: "Arial",
      }),
    );
  }
  function addShape(p) {
    const o = p.make();
    o.set({ left: 80, top: 80 });
    add(o);
  }

  // ── Add SVG Elements (Iconify) ─────────────────────────────────────────────
  // ── Add SVG Elements (Iconify) ─────────────────────────────────────────────
  function addSvgElement(url) {
    fabric.loadSVGFromURL(url, (objects, options) => {
      // Safety check to prevent crashes if SVG is empty
      if (!objects || objects.length === 0) return;

      // Group the SVG paths into a single selectable object
      const svgGroup = fabric.util.groupSVGElements(objects, options);

      // Scale it down nicely to fit the canvas
      svgGroup.scaleToWidth(100);
      svgGroup.set({ left: 100, top: 100 });

      add(svgGroup);
      pushHistory(fcRef.current);
    }); // <-- Notice we removed the crossOrigin object here!
  }

  function addImagePlaceholder(defaultKey) {
    const raw = prompt(
      "Enter image placeholder name (e.g. photo, logo, signature):",
      defaultKey || "photo",
    );
    if (!raw?.trim()) return;
    const k = raw.trim().replace(/\s+/g, "_").toLowerCase();
    const W = 180,
      H = 220;
    const rect = new fabric.Rect({
      left: -W / 2,
      top: -H / 2,
      width: W,
      height: H,
      fill: "#eef2ff",
      stroke: "#6366f1",
      strokeWidth: 2,
      strokeDashArray: [6, 4],
      rx: 8,
      ry: 8,
    });
    const label = new fabric.Text(`{${k}}`, {
      fontSize: 13,
      fill: "#6366f1",
      fontFamily: "Arial",
      originX: "center",
      originY: "center",
      left: 0,
      top: -20,
      selectable: false,
      evented: false,
    });
    const emoji = new fabric.Text("📷", {
      fontSize: 26,
      fontFamily: "Arial",
      originX: "center",
      originY: "center",
      left: 0,
      top: 16,
      selectable: false,
      evented: false,
    });
    const group = new fabric.Group([rect, emoji, label], {
      left: 200,
      top: 80,
      _placeholderKey: k,
      _isImagePlaceholder: true,
    });
    group.toObject = (function (orig) {
      return function (e) {
        return {
          ...orig.call(this, e),
          _placeholderKey: this._placeholderKey,
          _isImagePlaceholder: this._isImagePlaceholder,
        };
      };
    })(group.toObject);
    add(group);
  }

  function addPixabayImage(url) {
    fabric.Image.fromURL(
      url,
      (img) => {
        const maxW = Math.min(logW.current * 0.5, 400);
        if (img.width > maxW) img.scaleToWidth(maxW);
        img.set({ left: 60, top: 60 });
        add(img);
      },
      { crossOrigin: "anonymous" },
    );
  }

  function uploadLocalImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      fabric.Image.fromURL(ev.target.result, (img) => {
        const maxW = Math.min(logW.current * 0.6, 500);
        if (img.width > maxW) img.scaleToWidth(maxW);
        img.set({ left: 60, top: 60 });
        add(img);
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function setBackground(color) {
    setBgColor(color);
    fcRef.current.setBackgroundColor(color, () =>
      fcRef.current.requestRenderAll(),
    );
    pushHistory(fcRef.current);
  }

  function deleteSelected() {
    const o = fcRef.current?.getActiveObject();
    if (!o) return;
    if (o.type === "activeSelection") {
      o.forEachObject((x) => fcRef.current.remove(x));
      fcRef.current.discardActiveObject();
    } else fcRef.current.remove(o);
    fcRef.current.requestRenderAll();
    setPropOpen(false);
  }

  function duplicateSelected() {
    const o = fcRef.current?.getActiveObject();
    if (!o) return;
    o.clone((cl) => {
      cl.set({ left: o.left + 20, top: o.top + 20 });
      if (cl._placeholderKey)
        cl.toObject = (function (orig) {
          return function (e) {
            return {
              ...orig.call(this, e),
              _placeholderKey: this._placeholderKey,
              _isImagePlaceholder: this._isImagePlaceholder,
            };
          };
        })(cl.toObject);
      fcRef.current.add(cl);
      fcRef.current.setActiveObject(cl);
      fcRef.current.requestRenderAll();
    });
  }

  function groupSelected() {
    const fc = fcRef.current,
      a = fc.getActiveObject();
    if (!a || a.type !== "activeSelection") return;
    a.toGroup();
    fc.requestRenderAll();
    pushHistory(fc);
  }

  function ungroupSelected() {
    const fc = fcRef.current,
      a = fc.getActiveObject();
    if (!a || a.type !== "group") return;
    a.toActiveSelection();
    fc.requestRenderAll();
    pushHistory(fc);
  }

  function applyLogicalSize(w, h) {
    logW.current = w;
    logH.current = h;
    setDispW(w);
    setDispH(h);
    applyZoom(zoomR.current);
    pushHistory(fcRef.current);
    setSizeMode(false);
  }

  /* ── Save ─────────────────────────────────────────────────────────────── */
  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const fc = fcRef.current;
      const curZ = fc.getZoom();
      fc.setZoom(1);
      fc.setWidth(logW.current);
      fc.setHeight(logH.current);
      const canvasJson = JSON.stringify(
        fc.toJSON(["_placeholderKey", "_isImagePlaceholder"]),
      );
      const thumbnailBase64 = fc.toDataURL({
        format: "jpeg",
        quality: 0.8,
        multiplier: 1 / curZ,
      });
      applyZoom(curZ, fc);
      const payload = {
        name,
        category,
        canvas_json: canvasJson,
        width_px: logW.current,
        height_px: logH.current,
        thumbnail_base64: thumbnailBase64,
      };
      if (isEdit) {
        await api.put(`/templates/${id}`, payload);
      } else {
        const { data } = await api.post("/templates", payload);
        navigate(`/templates/${data.data.id}/edit`, { replace: true });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
        console.log(err);
        
      setError(err.response?.data?.error?.description || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  /* ── Keyboard shortcuts ───────────────────────────────────────────────── */
  useEffect(() => {
    function onKey(e) {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName,
      );
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (ctrl && e.key === "s") {
        e.preventDefault();
        handleSave();
        return;
      }
      if (ctrl && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if (ctrl && e.key === "g") {
        e.preventDefault();
        groupSelected();
        return;
      }
      if (ctrl && e.key === "G") {
        e.preventDefault();
        ungroupSelected();
        return;
      }
      if (ctrl && e.key === "a") {
        e.preventDefault();
        const fc = fcRef.current;
        fc.discardActiveObject();
        fc.setActiveObject(
          new fabric.ActiveSelection(fc.getObjects(), { canvas: fc }),
        );
        fc.requestRenderAll();
        return;
      }
      const tryLayer = (fn) => {
        try {
          fn();
        } catch (_) {}
        fcRef.current.requestRenderAll();
      };
      if (ctrl && e.key === "]") {
        const o = fcRef.current?.getActiveObject();
        if (o)
          tryLayer(() => {
            try {
              o.bringForward(true);
            } catch (_) {
              fcRef.current.bringObjectForward?.(o);
            }
          });
      }
      if (ctrl && e.key === "[") {
        const o = fcRef.current?.getActiveObject();
        if (o)
          tryLayer(() => {
            try {
              o.sendBackwards(true);
            } catch (_) {
              fcRef.current.sendObjectBackwards?.(o);
            }
          });
      }
      if (ctrl && e.key === "=") {
        e.preventDefault();
        applyZoom(zoomR.current + 0.1);
      }
      if (ctrl && e.key === "-") {
        e.preventDefault();
        applyZoom(zoomR.current - 0.1);
      }
      if (ctrl && e.key === "0") {
        e.preventDefault();
        zoomToFit();
      }
      if (!isInput) {
        if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
        if (e.key === "Escape") {
          fcRef.current?.discardActiveObject();
          fcRef.current?.requestRenderAll();
          setPropOpen(false);
        }
        if (e.key === "t") addText();
        if (e.key === "r") addShape(SHAPES[0]);
        const o = fcRef.current?.getActiveObject();
        if (
          o &&
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
        ) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx =
            e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy =
            e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          if (o.type === "activeSelection") {
            o.forEachObject((x) =>
              x.set({ left: x.left + dx, top: x.top + dy }),
            );
          } else {
            o.set({ left: o.left + dx, top: o.top + dy });
          }
          fcRef.current.requestRenderAll();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canUndo, canRedo]);

  /* ── Left panel content ───────────────────────────────────────────────── */
  const panelContent = {
    elements: (
      <div className="p-3 space-y-5">
        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Background
          </p>
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setBackground(c)}
                className={`w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110 ${bgColor === c ? "border-indigo-500 shadow-sm" : "border-transparent"}`}
                style={{
                  background: c,
                  boxShadow:
                    c === "#ffffff" ? "inset 0 0 0 1px #e5e7eb" : undefined,
                }}
              />
            ))}
          </div>
          <input
            type="color"
            className="w-full h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
            value={bgColor}
            onChange={(e) => setBackground(e.target.value)}
          />
        </section>

        <section>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Text
          </p>
          <div className="space-y-1.5">
            {[
              {
                label: "Heading",
                cls: "text-xl font-black",
                fn: () => addText("Heading"),
              },
              {
                label: "Body text",
                cls: "text-sm",
                fn: () => addText("Body text"),
              },
            ].map(({ label, cls, fn }) => (
              <button
                key={label}
                onClick={fn}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all group"
              >
                <span
                  className={`${cls} text-gray-700 w-12 text-center group-hover:text-indigo-700 shrink-0 leading-none`}
                >
                  Aa
                </span>
                <span className="text-xs text-gray-600 group-hover:text-indigo-700">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Canvas size
            </p>
            <button
              onClick={() => setSizeMode((m) => !m)}
              className="text-[10px] text-indigo-600 font-bold"
            >
              {sizeMode ? "Cancel" : "Edit"}
            </button>
          </div>
          {!sizeMode ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-medium">
              <Ico d={I.crop} size={12} className="text-gray-400" />
              {logW.current}×{logH.current}px
              <button
                onClick={zoomToFit}
                className="ml-auto text-[10px] text-indigo-600"
              >
                Fit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded"
                  checked={includeBleed}
                  onChange={(e) => setIncludeBleed(e.target.checked)}
                />
                <div>
                  <p className="text-[11px] font-bold text-gray-800">
                    Include Bleed
                  </p>
                  <p className="text-[9px] text-gray-500">
                    +75px each side for print
                  </p>
                </div>
              </label>
              <div className="grid grid-cols-2 gap-1">
                {SIZE_PRESETS.map((p) => {
                  const fw = includeBleed ? p.w + 75 : p.w,
                    fh = includeBleed ? p.h + 75 : p.h;
                  return (
                    <button
                      key={p.label}
                      onClick={() => applyLogicalSize(fw, fh)}
                      className={`px-2 py-2 rounded-xl border text-[10px] text-left ${logW.current === fw && logH.current === fh ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 hover:border-indigo-300 text-gray-600"}`}
                    >
                      <span className="font-semibold block truncate">
                        {p.label}
                      </span>
                      <span className="text-gray-400">
                        {fw}×{fh}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-1.5 items-center">
                <input
                  type="number"
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
                  value={dispW}
                  onChange={(e) => setDispW(+e.target.value)}
                />
                <span className="text-gray-400 text-xs">×</span>
                <input
                  type="number"
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400"
                  value={dispH}
                  onChange={(e) => setDispH(+e.target.value)}
                />
                <button
                  onClick={() => applyLogicalSize(dispW, dispH)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0"
                >
                  ✓
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    ),

    shapes: (
      <div className="p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Shapes
        </p>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                addShape(s);
                setMobilePanel(null);
              }}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-transparent hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center">
                <Ico
                  d={s.icon}
                  size={22}
                  className="text-gray-400 group-hover:text-indigo-600"
                />
              </div>
              <span className="text-[10px] text-gray-500 group-hover:text-indigo-700">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    ),

    icons: (
      <ElementSearch
        onSelect={(url) => {
          addSvgElement(url);
          setMobilePanel(null);
        }}
      />
    ),

    photos: (
      <ImageSearch
        onSelect={(url) => {
          addPixabayImage(url);
          setMobilePanel(null);
        }}
      />
    ),

    placeholders: (
      <div className="p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Bulk fields
        </p>
        <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
          Replaced with CSV data during bulk generation.
        </p>
        <div className="space-y-0.5">
          {PLACEHOLDERS.map(({ key, label, emoji, isImage }) => (
            <button
              key={key}
              onClick={() => {
                isImage ? addImagePlaceholder(key) : addPlaceholderText(key);
                setMobilePanel(null);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors group text-left"
            >
              <span className="text-base w-6 text-center leading-none">
                {emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 group-hover:text-indigo-700">
                  {label}
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  {isImage ? "image placeholder" : `{${key}}`}
                </p>
              </div>
              <span className="text-[10px] text-gray-300 group-hover:text-indigo-400">
                {isImage ? "📷" : "+ Text"}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 mb-2 font-semibold">
            Custom placeholder
          </p>
          <div className="flex gap-1.5">
            <input
              id="cph"
              placeholder="custom_key"
              className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg font-mono outline-none focus:border-indigo-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = e.target.value.trim().replace(/\s/g, "_");
                  if (v) {
                    addPlaceholderText(v);
                    e.target.value = "";
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const el = document.getElementById("cph");
                const v = el.value.trim().replace(/\s/g, "_");
                if (v) {
                  addPlaceholderText(v);
                  el.value = "";
                }
              }}
              className="px-3 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
            >
              +
            </button>
          </div>
        </div>
      </div>
    ),

    uploads: (
      <div className="p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Upload image
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full flex flex-col items-center gap-3 py-8 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center">
            <Ico
              d={I.upload}
              size={22}
              className="text-gray-400 group-hover:text-indigo-500"
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-600 group-hover:text-indigo-700">
              Click to upload
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              PNG, JPG, SVG, WEBP
            </p>
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={uploadLocalImage}
        />
      </div>
    ),

    layers: (
      <div className="p-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
          Layers ({layers.length})
        </p>
        {layers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            No objects yet
          </p>
        ) : (
          <div className="space-y-0.5">
            {layers.map(({ id, label, obj }) => (
              <div
                key={id}
                onClick={() => {
                  fcRef.current.setActiveObject(obj);
                  fcRef.current.requestRenderAll();
                  setSelected(obj);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${selected === obj ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-50 border border-transparent"}`}
              >
                <Ico
                  d={I.layers}
                  size={11}
                  className="text-gray-400 shrink-0"
                />
                <span className="text-xs text-gray-700 truncate flex-1 font-mono">
                  {label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    obj.set({ visible: !obj.visible });
                    fcRef.current.requestRenderAll();
                    refreshLayers(fcRef.current);
                  }}
                  className="text-gray-300 hover:text-gray-600 shrink-0"
                >
                  <Ico d={obj.visible !== false ? I.eye : I.eyeOff} size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
  };

  const leftPanels = [
    { id: "elements", label: "Design", icon: I.grid },
    { id: "shapes", label: "Shapes", icon: I.rect },
    { id: "icons", label: "Elements", icon: I.star },
    { id: "photos", label: "Photos", icon: I.img },
    { id: "placeholders", label: "Fields", icon: I.ph },
    { id: "uploads", label: "Upload", icon: I.upload },
    { id: "layers", label: "Layers", icon: I.layers },
  ];

  const mobileTools = [
    { id: "elements", label: "Design", icon: I.grid },
    { id: "shapes", label: "Shapes", icon: I.rect },
    { id: "icons", label: "Elements", icon: I.star },
    { id: "photos", label: "Photos", icon: I.img },
    { id: "placeholders", label: "Fields", icon: I.ph },
    { id: "uploads", label: "Upload", icon: I.upload },
    { id: "layers", label: "Layers", icon: I.layers },
  ];

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        .cw::-webkit-scrollbar{width:8px;height:8px}
        .cw::-webkit-scrollbar-track{background:transparent}
        .cw::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:4px}
        .cw::-webkit-scrollbar-thumb:hover{background:#9ca3af}
        .ps::-webkit-scrollbar{width:3px;height:3px}
        .ps::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:3px}
        @keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .su{animation:su .15s ease}
        @keyframes sr{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        .sr{animation:sr .15s ease}
        @keyframes ci{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
        .ci{animation:ci .1s ease}
      `}</style>

      <div
        className="flex flex-col bg-[#f0f0f3]"
        style={{ height: "100dvh", overflow: "hidden" }}
      >
        {/* ═══════════════════════════════════════════════════════════════
            TOP BAR  (Canva-inspired: minimal, centered undo/redo)
        ═══════════════════════════════════════════════════════════════ */}
        <header
          className="flex items-center gap-1.5 px-2 bg-white border-b border-gray-200 shrink-0 z-40 shadow-sm"
          style={{ height: 52 }}
        >
          {/* Back */}
          <Tip label="Back" side="bottom">
            <button
              onClick={() => navigate("/templates")}
              className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"
            >
              <Ico d={I.back} size={16} />
            </button>
          </Tip>

          {/* Logo */}
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">B</span>
          </div>

          {/* Name */}
          {editName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditName(false)}
              className="px-2 py-1 text-sm font-semibold border border-indigo-400 rounded-xl outline-none w-36 sm:w-48 shrink-0"
            />
          ) : (
            <button
              onClick={() => setEditName(true)}
              className="text-sm font-semibold text-gray-800 hover:text-indigo-700 px-2 py-1.5 rounded-xl hover:bg-gray-50 max-w-[110px] sm:max-w-[180px] truncate shrink-0"
            >
              {name}
            </button>
          )}

          {/* Category – hidden mobile */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="hidden md:block border border-gray-200 rounded-xl px-2 py-1.5 text-xs text-gray-600 bg-white focus:outline-none shrink-0"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {/* ─ Centered undo/redo ─ */}
          <div className="flex-1 flex items-center justify-end gap-0.5">
            <Tip label="Undo" kbd="⌘Z" side="bottom">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${canUndo ? "hover:bg-gray-100 text-gray-600" : "text-gray-300 cursor-not-allowed"}`}
              >
                <Ico d={I.undo} size={15} />
              </button>
            </Tip>
            <Tip label="Redo" kbd="⌘⇧Z" side="bottom">
              <button
                onClick={redo}
                disabled={!canRedo}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${canRedo ? "hover:bg-gray-100 text-gray-600" : "text-gray-300 cursor-not-allowed"}`}
              >
                <Ico d={I.redo} size={15} />
              </button>
            </Tip>
          </div>

          {error && (
            <span className="hidden sm:block text-xs text-red-500 max-w-[120px] truncate shrink-0">
              {error}
            </span>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${saved ? "bg-emerald-500 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"} ${saving ? "opacity-70" : ""}`}
          >
            {saving ? (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            ) : saved ? (
              <Ico d={I.check} size={14} />
            ) : (
              <Ico d={I.save} size={14} />
            )}
            <span className="hidden sm:inline">
              {saving ? "Saving…" : saved ? "Saved!" : "Save"}
            </span>
          </button>
        </header>

        {/* ═══════════════════════════════════════════════════════════════
            CONTEXT / FORMATTING BAR  (Canva-style, appears when selected)
        ═══════════════════════════════════════════════════════════════ */}
        {selected && (
          <ContextBar
            obj={selected}
            fc={fcRef.current}
            onUpdate={() => pushHistory(fcRef.current)}
            onOpenProps={() => {
              setPropOpen(true);
              setMobilePropOpen(true);
            }}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
            onGroup={groupSelected}
            onUngroup={ungroupSelected}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            BODY
        ═══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* ── LEFT ICON RAIL (desktop) ── */}
          <div className="hidden sm:flex w-[52px] bg-white border-r border-gray-200 flex-col items-center py-2 gap-0.5 shrink-0 z-20 shadow-sm">
            {leftPanels.map((p) => (
              <Tip key={p.id} label={p.label} side="right">
                <button
                  onClick={() => {
                    if (panel === p.id) {
                      setPanelOpen((o) => !o);
                    } else {
                      setPanel(p.id);
                      setPanelOpen(true);
                    }
                  }}
                  className={`flex flex-col items-center gap-0.5 w-full px-1 py-2.5 rounded-xl transition-all ${panel === p.id && panelOpen ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                >
                  <Ico d={p.icon} size={18} />
                  <span className="text-[8px] font-bold leading-none mt-0.5">
                    {p.label}
                  </span>
                </button>
              </Tip>
            ))}
          </div>

          {/* ── LEFT PANEL DRAWER (desktop, collapsible) ── */}
          <div
            className={`hidden sm:flex flex-col bg-white border-r border-gray-200 overflow-hidden shrink-0 z-10 shadow-md transition-all duration-200 ${panelOpen ? "w-[248px]" : "w-0"}`}
          >
            {/* Panel header with collapse button */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {panel === "icons" ? "Elements" : panel}
              </span>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <Ico d={I.chevL} size={13} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto ps min-h-0">
              {panelContent[panel]}
            </div>
          </div>

          {/* ── CANVAS AREA ── */}
          <div
            ref={wrapRef}
            className="cw flex-1 overflow-auto relative"
            style={{
              background:
                "radial-gradient(circle at 1px 1px,#cdd0d8 1px,transparent 0) 0 0/24px 24px",
              backgroundColor: "#e8e9ed",
            }}
          >
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <svg
                    className="w-10 h-10 animate-spin text-indigo-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <p className="text-sm text-gray-500 font-medium">
                    Loading template…
                  </p>
                </div>
              </div>
            )}

            {/* Canvas centered with lots of breathing room */}
            <div
              className="flex items-center justify-center"
              style={{
                minWidth: "100%",
                minHeight: "100%",
                padding: "80px 100px",
              }}
            >
              <div className="shadow-2xl ring-1 ring-black/10 rounded-sm overflow-hidden">
                <canvas ref={canvasRef} />
              </div>
            </div>

            {/* Floating zoom bar */}
            <div className="fixed md:bottom-8 bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
              <div className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-2xl px-1.5 py-1.5 shadow-lg">
                <Tip label="Zoom out" kbd="⌘-" side="top">
                  <button
                    onClick={() => applyZoom(zoomR.current - 0.1)}
                    className="w-7 h-7 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500"
                  >
                    <Ico d={I.zoomOut} size={13} />
                  </button>
                </Tip>
                <button
                  onClick={zoomToFit}
                  className="text-xs font-bold text-gray-700 px-2 tabular-nums hover:text-indigo-600 min-w-[46px] text-center"
                >
                  {zoom}%
                </button>
                <Tip label="Zoom in" kbd="⌘+" side="top">
                  <button
                    onClick={() => applyZoom(zoomR.current + 0.1)}
                    className="w-7 h-7 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500"
                  >
                    <Ico d={I.zoomIn} size={13} />
                  </button>
                </Tip>
                <div className="w-px h-4 bg-gray-200 mx-0.5" />
                <Tip label="Fit to screen" kbd="⌘0" side="top">
                  <button
                    onClick={zoomToFit}
                    className="w-7 h-7 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400"
                  >
                    <Ico d={I.fit} size={13} />
                  </button>
                </Tip>
                {/* Mobile undo/redo in zoom bar */}
                <div className="sm:hidden w-px h-4 bg-gray-200 mx-0.5" />
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`sm:hidden w-7 h-7 rounded-xl flex items-center justify-center ${canUndo ? "hover:bg-gray-100 text-gray-600" : "text-gray-300"}`}
                >
                  <Ico d={I.undo} size={13} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`sm:hidden w-7 h-7 rounded-xl flex items-center justify-center ${canRedo ? "hover:bg-gray-100 text-gray-600" : "text-gray-300"}`}
                >
                  <Ico d={I.redo} size={13} />
                </button>
              </div>
            </div>

            {/* Expand panel button when collapsed */}
            {!panelOpen && (
              <button
                onClick={() => setPanelOpen(true)}
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 w-5 h-12 bg-white border border-gray-200 border-l-0 rounded-r-xl items-center justify-center text-gray-400 hover:text-gray-700 z-10 shadow-sm"
              >
                <Ico d={I.chevR} size={12} />
              </button>
            )}
          </div>

          {/* ── RIGHT PROPERTIES DRAWER (desktop, slides in) ── */}
          {propOpen && selected && (
            <div className="hidden sm:flex w-[260px] flex-col shrink-0 overflow-hidden border-l border-gray-200 shadow-xl sr">
              <PropDrawer
                obj={selected}
                fc={fcRef.current}
                onUpdate={() => pushHistory(fcRef.current)}
                onClose={() => setPropOpen(false)}
              />
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MOBILE BOTTOM TOOLBAR (Canva-style icon tabs)
        ═══════════════════════════════════════════════════════════════ */}
        <div
          className="sm:hidden bg-white border-t border-gray-200 shrink-0 z-40 overflow-x-auto"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center px-1 py-1 min-w-max">
            {mobileTools.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  setMobilePanel((p) => (p === t.id ? null : t.id))
                }
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${mobilePanel === t.id ? "text-indigo-700 bg-indigo-50" : "text-gray-500"}`}
              >
                <Ico d={t.icon} size={19} />
                <span className="text-[8px] font-bold leading-none mt-1">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MOBILE SLIDE-UP PANEL SHEET
        ═══════════════════════════════════════════════════════════════ */}
        {mobilePanel && (
          <div className="sm:hidden fixed inset-0 z-[60] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobilePanel(null)}
            />
            <div
              className="relative bg-white rounded-t-3xl z-10 flex flex-col su"
              style={{ maxHeight: "78vh" }}
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 shrink-0">
                <span className="font-bold text-sm text-gray-800 capitalize">
                  {mobilePanel === "icons" ? "Elements" : mobilePanel}
                </span>
                <button
                  onClick={() => setMobilePanel(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <Ico d={I.x} size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto ps min-h-0">
                {panelContent[mobilePanel]}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MOBILE PROPERTIES SHEET
        ═══════════════════════════════════════════════════════════════ */}
        {mobilePropOpen && selected && (
          <div className="sm:hidden fixed inset-0 z-[70] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobilePropOpen(false)}
            />
            <div
              className="relative bg-white rounded-t-3xl z-10 flex flex-col su"
              style={{ maxHeight: "85vh" }}
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <PropDrawer
                  obj={selected}
                  fc={fcRef.current}
                  onUpdate={() => {
                    pushHistory(fcRef.current);
                    fcRef.current.requestRenderAll();
                  }}
                  onClose={() => setMobilePropOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            DESKTOP BOTTOM STATUS BAR  (Canva-style)
        ═══════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1 bg-white border-t border-gray-100 shrink-0">
          <span className="text-[10px] text-gray-400">
            {logW.current}×{logH.current}px
          </span>
          <div className="flex-1" />
          {[
            ["T", "Text"],
            ["R", "Rect"],
            ["⌘G", "Group"],
            ["⌘D", "Dup"],
            ["⌘Z", "Undo"],
            ["Del", "Delete"],
            ["Arrows", "Nudge"],
            ["Ctrl+Scroll", "Zoom"],
            ["Space+Drag", "Pan"],
            ["⌘0", "Fit"],
            ["⌘S", "Save"],
          ].map(([k, l]) => (
            <span
              key={k}
              className="flex items-center gap-1 text-[10px] text-gray-400"
            >
              <kbd className="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-[9px] font-mono text-gray-500">
                {k}
              </kbd>
              {l}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
