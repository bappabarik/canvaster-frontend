import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Spinner, ErrorMessage } from "@/components/ui";

function Steps({ current, steps }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center shrink-0">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              i === current
                ? "bg-brand-600 text-white"
                : i < current
                  ? "bg-brand-100 text-brand-700"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i < current ? "bg-brand-600 text-white" : ""
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-6 h-px bg-gray-300 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function StepTemplate({ onNext }) {
  const [templates, setTemplates] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState("zip_png");
  const [tab, setTab] = useState("mine");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/templates"), api.get("/templates/gallery")])
      .then(([m, g]) => {
        setTemplates(m.data.data.templates || []);
        setGallery(g.data.data.templates || []);
      })
      .catch(() => setError("Failed to load templates"))
      .finally(() => setLoading(false));
  }, []);

  const list = tab === "mine" ? templates : gallery;

  function handleNext() {
    if (!selected) {
      setError("Select a template");
      return;
    }
    if (!name.trim()) {
      setError("Enter a project name");
      return;
    }
    onNext({
      templateId: selected.id,
      name: name.trim(),
      outputFormat: format,
    });
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <label className="label">Project name</label>
        <input
          className="input max-w-md"
          placeholder="e.g. Class 10A ID Cards"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Output format</label>
        <div className="flex gap-3 flex-wrap">
          {[
            ["zip_png", "PNG (recommended)"],
            ["zip_pdf", "PDF"],
            ["png", "Single PNG"],
            ["pdf", "Single PDF"],
          ].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFormat(val)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                format === val
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex gap-1 mb-4">
          {[
            ["mine", "My templates"],
            ["gallery", "Gallery"],
          ].map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {tab === "mine"
              ? "No templates yet. Create one first."
              : "No gallery templates available."}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {list.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`card overflow-hidden text-left transition-all hover:shadow-md ${
                  selected?.id === t.id
                    ? "ring-2 ring-brand-500 border-brand-200"
                    : ""
                }`}
              >
                <div className="h-28 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
                  {t.thumbnail_url ? (
                    <img
                      src={t.thumbnail_url}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🖼</span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {t.category?.replace("_", " ")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <ErrorMessage message={error} />
      <div className="flex justify-end">
        <button onClick={handleNext} className="btn-primary">
          Next: Upload CSV →
        </button>
      </div>
    </div>
  );
}

function StepCsv({ project, onNext, onBack }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload() {
    if (!file) {
      setError("Select a CSV file");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("csv", file);
      const { data } = await api.post(`/projects/${project.id}/csv`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPreview(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.description || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <label className="label">Upload CSV file</label>
        <p className="text-sm text-gray-500 mb-3">
          First row must be headers. Each row becomes one design.
        </p>
        <input
          type="file"
          accept=".csv"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setPreview(null);
            setError("");
          }}
        />
      </div>
      {file && !preview && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="btn-primary"
        >
          {loading && <Spinner className="w-4 h-4" />}
          {loading ? "Uploading…" : "Upload & parse CSV"}
        </button>
      )}
      <ErrorMessage message={error} />
      {preview && (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ✓ {preview.total_rows} rows loaded · Headers:{" "}
            {preview.headers?.join(", ")}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>
                  {preview.headers?.map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview?.slice(0, 3).map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {preview.headers?.map((h) => (
                      <td
                        key={h}
                        className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[140px] truncate"
                      >
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between">
            <button onClick={onBack} className="btn-secondary">
              ← Back
            </button>
            <button onClick={() => onNext(preview)} className="btn-primary">
              Next: Map columns →
            </button>
          </div>
        </div>
      )}
      {!preview && (
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
      )}
    </div>
  );
}

function StepMap({ project, csvData, onNext, onBack }) {
  const placeholders = project.placeholders_snapshot || [];
  const headers = csvData?.headers || [];
  const [map, setMap] = useState(() =>
    Object.fromEntries(placeholders.map((p) => [p, ""])),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function autoMap() {
    const next = { ...map };
    placeholders.forEach((p) => {
      const match = headers.find(
        (h) =>
          h.toLowerCase().replace(/[^a-z0-9]/g, "") ===
          p.toLowerCase().replace(/[^a-z0-9]/g, ""),
      );
      if (match) next[p] = match;
    });
    setMap(next);
  }

  async function handleNext() {
    const missing = placeholders.filter((p) => !map[p]);
    if (missing.length) {
      setError(`Map all placeholders: ${missing.join(", ")}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post(`/projects/${project.id}/map`, { column_map: map });
      onNext(map);
    } catch (err) {
      setError(err.response?.data?.error?.description || "Mapping failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Map each design placeholder to a CSV column.
        </p>
        <button onClick={autoMap} className="btn-secondary text-xs py-1.5">
          Auto-map
        </button>
      </div>
      <div className="space-y-3">
        {placeholders.map((p) => (
          <div key={p} className="flex items-center gap-3">
            <code className="text-sm bg-brand-50 text-brand-700 px-2.5 py-1.5 rounded font-mono w-32 shrink-0 truncate">
              {"{" + p + "}"}
            </code>
            <span className="text-gray-400 text-sm shrink-0">→</span>
            <select
              className="input text-sm py-1.5 flex-1"
              value={map[p] || ""}
              onChange={(e) => setMap((m) => ({ ...m, [p]: e.target.value }))}
            >
              <option value="">Select column…</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <ErrorMessage message={error} />
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button onClick={handleNext} disabled={loading} className="btn-primary">
          {loading && <Spinner className="w-4 h-4" />}
          {loading ? "Saving…" : "Next: Upload images →"}
        </button>
      </div>
    </div>
  );
}

function StepImages({ project, onNext, onBack }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("images", file);
      const { data } = await api.post(`/projects/${project.id}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.description || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const report = result?.match_report;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
        <strong>Optional step.</strong> Only needed if your CSV has image
        filenames (e.g. <code>john.jpg</code>). If your CSV has direct image
        URLs, skip this step.
      </div>
      <div>
        <label className="label">Upload image ZIP</label>
        <p className="text-sm text-gray-500 mb-3">
          ZIP must contain images named exactly as in your CSV.
        </p>
        <input
          type="file"
          accept=".zip"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setResult(null);
            setError("");
          }}
        />
      </div>
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="btn-primary"
        >
          {loading && <Spinner className="w-4 h-4" />}
          {loading ? "Uploading…" : "Upload ZIP"}
        </button>
      )}
      <ErrorMessage message={error} />
      {result && (
        <div className="space-y-3">
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              report?.fully_matched
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-yellow-50 border-yellow-200 text-yellow-700"
            }`}
          >
            ✓ {result.uploaded_count} images uploaded.{" "}
            {report?.fully_matched
              ? "All CSV rows matched!"
              : `${report?.unmatched_count} rows have no matching image.`}
          </div>
          {report?.unmatched_files?.length > 0 && (
            <div className="text-xs text-gray-500">
              <p className="font-medium mb-1">Unmatched filenames:</p>
              <div className="flex flex-wrap gap-1">
                {report.unmatched_files.map((f) => (
                  <span
                    key={f}
                    className="bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded font-mono"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/projects/${project.id}/preview`)}
            className="btn-secondary"
          >
            👁 Preview designs
          </button>
          <button onClick={onNext} className="btn-primary">
            Next: Review & submit →
          </button>
        </div>
      </div>
    </div>
  );
}

function StepSubmit({ project, columnMap, onSubmitted, onBack }) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate()

  const rowsNeeded = project.total_rows || 0;
  const currentCredits = user?.credits ?? 0;
  const hasEnough = currentCredits >= rowsNeeded;

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post(`/projects/${project.id}/submit`);
      await refreshUser(); // refresh credits in context
      onSubmitted(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.description || "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-gray-900">Project summary</h3>
        {[
          ["Project name", project.name],
          ["Output format", project.output_format?.replace("_", " ")],
          ["Total rows", rowsNeeded],
          ["Credits needed", rowsNeeded],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-900">{val}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">
            Column mapping
          </p>
          {Object.entries(columnMap || {}).map(([ph, col]) => (
            <div key={ph} className="flex items-center gap-2 text-xs mb-1">
              <code className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-mono">
                {"{" + ph + "}"}
              </code>
              <span className="text-gray-400">→</span>
              <span className="text-gray-700">{col}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Credits status */}
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          hasEnough
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}
      >
        {hasEnough ? (
          <>
            ✓ You have <strong>{currentCredits} credits</strong> — enough for
            this project ({rowsNeeded} needed). Submitting will deduct{" "}
            <strong>{rowsNeeded} credits</strong> and start generation
            immediately.
          </>
        ) : (
          <>
            You have <strong>{currentCredits} credits</strong> but need{" "}
            <strong>{rowsNeeded}</strong>. You'll be redirected to purchase{" "}
            <strong>{rowsNeeded - currentCredits} more credits</strong>.
          </>
        )}
      </div>

      <ErrorMessage message={error} />

      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600 flex items-center justify-between">
          <span>Want to check how designs look before generating?</span>
          <button
            onClick={() => navigate(`/projects/${project.id}/preview`)}
            className="text-brand-600 hover:text-brand-700 font-medium text-sm ml-3 shrink-0"
          >
            Preview →
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary"
        >
          {loading && <Spinner className="w-4 h-4" />}
          {loading
            ? "Submitting…"
            : hasEnough
              ? "Submit & generate →"
              : "Submit & pay →"}
        </button>
      </div>
    </div>
  );
}

const STEPS = ["Template", "CSV", "Map columns", "Images", "Submit"];

export default function ProjectWizardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initTplId = location.state?.templateId || null;

  const [step, setStep] = useState(0);
  const [project, setProject] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [columnMap, setColumnMap] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleTemplateNext({ templateId, name, outputFormat }) {
    setCreating(true);
    setError("");
    try {
      const { data } = await api.post("/projects", {
        template_id: templateId,
        name,
        output_format: outputFormat,
      });
      setProject(data.data);
      setStep(1);
    } catch (err) {
      setError(
        err.response?.data?.error?.description || "Failed to create project",
      );
    } finally {
      setCreating(false);
    }
  }

  function handleSubmitted(result) {
    if (result.queued_directly) {
      // Already queued — go straight to status page
      navigate(`/projects/${project.id}/status`);
    } else {
      // Needs payment
      navigate("/pricing", {
        state: {
          projectId: project.id,
          rows: result.credits_needed,
        },
      });
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/projects")}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ←
        </button>
        <h1 className="page-header">New project</h1>
      </div>

      <Steps current={step} steps={STEPS} />

      <ErrorMessage message={error} />

      {creating && (
        <div className="flex justify-center py-8">
          <Spinner className="w-8 h-8" />
        </div>
      )}

      {!creating && (
        <>
          {step === 0 && (
            <StepTemplate
              initTemplateId={initTplId}
              onNext={handleTemplateNext}
            />
          )}
          {step === 1 && project && (
            <StepCsv
              project={project}
              onNext={(data) => {
                setCsvData(data);
                setStep(2);
              }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && project && (
            <StepMap
              project={project}
              csvData={csvData}
              onNext={(map) => {
                setColumnMap(map);
                setStep(3);
              }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && project && (
            <StepImages
              project={project}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && project && (
            <StepSubmit
              project={project}
              columnMap={columnMap}
              onSubmitted={handleSubmitted}
              onBack={() => setStep(3)}
            />
          )}
        </>
      )}
    </div>
  );
}
