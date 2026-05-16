import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Spinner, ErrorMessage, Badge } from "@/components/ui";

function TemplateCard({ template, onDelete, isGallery }) {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm(`Delete "${template.name}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/templates/${template.id}`);
      onDelete(template.id);
    } catch {
      alert("Failed to delete template");
      setDeleting(false);
    }
  }

  const getOptimizedUrl = (url) => {
    if (!url || !url.includes("cloudinary.com")) return url;
    // We removed h_400 and c_fill so Cloudinary respects the original aspect ratio natively!
    return url.replace("/upload/", "/upload/w_600,q_auto,f_auto/");
  };

  // Calculate the aspect ratio dynamically based on the template's actual pixel dimensions
  const aspectRatio =
    template.width_px && template.height_px
      ? `${template.width_px} / ${template.height_px}`
      : "4 / 3";

  return (
    <div className="break-inside-avoid mb-6">
      <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col">
        
        {/* --- Image Section with Dynamic Aspect Ratio --- */}
        <div
          className="relative w-full bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer"
          style={{ aspectRatio }}
          onClick={() =>
            isGallery
              ? navigate("/projects/new", { state: { templateId: template.id } })
              : navigate(`/templates/${template.id}/edit`)
          }
        >
          {template.thumbnail_url ? (
            <img
              src={getOptimizedUrl(template.thumbnail_url)}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <span className="text-4xl text-gray-300">🖼</span>
            </div>
          )}

          {/* Hover Overlay (Canva Style) */}
          <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/projects/new", { state: { templateId: template.id } });
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-6 rounded-lg shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 w-[80%] max-w-[200px]"
            >
              Use Template
            </button>
            
            {!isGallery && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/templates/${template.id}/edit`);
                }}
                className="bg-white/90 hover:bg-white text-gray-900 font-medium py-2 px-6 rounded-lg shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 w-[80%] max-w-[200px]"
              >
                Edit Design
              </button>
            )}
          </div>

          {/* Delete Button (Top Right) */}
          {!isGallery && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="absolute top-3 right-3 bg-white/90 hover:bg-red-50 text-red-600 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
              title="Delete Template"
            >
              {deleting ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              )}
            </button>
          )}
        </div>

        {/* --- Info Section --- */}
        <div className="p-4 bg-white flex flex-col justify-between flex-grow">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight">
              {template.name}
            </h3>
            {/* Show badge only in 'Mine' tab if public */}
            {!isGallery && template.is_public && (
              <span className="shrink-0 bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
                Public
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs text-gray-500 capitalize">
              {template.category.replace("_", " ")}
            </p>
            <span className="text-gray-300 text-[10px]">•</span>
            <p className="text-[10px] text-gray-400 font-mono">
              {template.width_px}×{template.height_px}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [tab, setTab] = useState("mine");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");

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

  useEffect(() => {
    async function load() {
      try {
        const [myRes, galRes] = await Promise.all([
          api.get("/templates"),
          api.get("/templates/gallery"),
        ]);
        setTemplates(myRes.data.data.templates || []);
        setGallery(galRes.data.data.templates || []);
      } catch {
        setError("Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleDelete(id) {
    setTemplates((ts) => ts.filter((t) => t.id !== id));
  }

  const filteredGallery = category
    ? gallery.filter((t) => t.category === category)
    : gallery;

  if (loading)
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Spinner className="w-8 h-8 text-brand-600" />
      </div>
    );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Designs & Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your designs or discover new templates.</p>
        </div>
        <button
          onClick={() => navigate("/templates/new")}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-sm transition-colors shrink-0"
        >
          + Create Design
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Tabs */}
      <div className="flex space-x-2">
        {[
          ["mine", "My Designs", templates.length],
          ["gallery", "Template Gallery", gallery.length],
        ].map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
              tab === key
                ? "bg-gray-900 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {label} <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full ${tab === key ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div>
        {tab === "mine" && (
          templates.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No designs yet</h3>
              <p className="text-gray-500 mt-1 mb-6">Start from scratch or use a template from the gallery.</p>
              <button onClick={() => navigate("/templates/new")} className="btn-primary">
                Create your first design
              </button>
            </div>
          ) : (
            /* Masonry CSS Columns Layout */
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6">
              {templates.map((t) => (
                <TemplateCard key={t.id} template={t} onDelete={handleDelete} isGallery={false} />
              ))}
            </div>
          )
        )}

        {tab === "gallery" && (
          <div className="space-y-6">
            {/* Scrollable Category Pills */}
            <div className="flex overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide gap-2">
              <button
                onClick={() => setCategory("")}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !category
                    ? "bg-brand-50 text-brand-700 ring-1 ring-brand-600 ring-inset"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                All categories
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                    category === c
                      ? "bg-brand-50 text-brand-700 ring-1 ring-brand-600 ring-inset"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {c.replace("_", " ")}
                </button>
              ))}
            </div>

            {filteredGallery.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500">No templates found in this category.</p>
              </div>
            ) : (
              /* Masonry CSS Columns Layout */
              <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6">
                {filteredGallery.map((t) => (
                  <TemplateCard key={t.id} template={t} isGallery={true} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}