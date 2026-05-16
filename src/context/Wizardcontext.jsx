import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api from "@/lib/api";

// ─── Context ──────────────────────────────────────────────────────────────────
const WizardContext = createContext(null);

// ─── Step derivation from server project state ────────────────────────────────
// This is the single source of truth for "how far has this project gotten".
// Never trust frontend-only state after a refresh — always derive from server.
export function deriveStep(project) {
  if (!project?.id) return 0;
  if (project.column_map && project.total_rows > 0) return 4; // ready to submit
  if (project.column_map) return 3;                            // mapped, needs images
  if (project.total_rows > 0 || project.csv_headers?.length) return 2; // csv done
  return 1;                                                     // project exists, needs csv
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
// Scoped to project ID so multiple wizard sessions never collide.
const SESSION_KEY = (id) => `bdp_wizard_${id ?? "new"}`;

function sessionSave(id, slice) {
  try { sessionStorage.setItem(SESSION_KEY(id), JSON.stringify(slice)); } catch (_) {}
}

function sessionLoad(id) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY(id));
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function sessionClear(id) {
  try { sessionStorage.removeItem(SESSION_KEY(id)); } catch (_) {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function WizardProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Core state
  const [project,    setProject]    = useState(null);
  const [step,       setStepRaw]    = useState(0);
  const [csvData,    setCsvData]    = useState(null);   // { headers, total_rows, preview }
  const [columnMap,  setColumnMap]  = useState(null);   // { placeholder: csvHeader }
  const [zipJobId,   setZipJobId]   = useState(null);   // background job id for image zip
  const [csvJobId,   setCsvJobId]   = useState(null);   // background job id for csv
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const projectId = project?.id ?? null;

  // ── Step setter — always syncs to URL ────────────────────────────────────────
  const setStep = useCallback((n) => {
    setStepRaw(n);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("step", String(n));
      if (projectId) next.set("project", String(projectId));
      return next;
    }, { replace: true });
  }, [projectId, setSearchParams]);

  // ── Persist to sessionStorage whenever key state changes ─────────────────────
  useEffect(() => {
    if (!projectId) return;
    sessionSave(projectId, { csvData, columnMap, zipJobId, csvJobId });
  }, [projectId, csvData, columnMap, zipJobId, csvJobId]);

  // ── On mount: restore from URL + server ──────────────────────────────────────
  useEffect(() => {
    const urlProjectId = searchParams.get("project");
    const urlStep      = parseInt(searchParams.get("step") ?? "0", 10);

    if (!urlProjectId) {
      // Fresh wizard — no project yet
      setStepRaw(0);
      return;
    }

    // Project ID is in URL — re-fetch from server to get authoritative state
    setLoading(true);
    setError("");

    api.get(`/projects/${urlProjectId}`)
      .then(({ data }) => {
        const proj = data.data.project;
        setProject(proj);

        // Derive the max step this project has reached server-side
        const serverStep = deriveStep(proj);

        // Also restore any client-only state from sessionStorage
        const saved = sessionLoad(urlProjectId);
        if (saved) {
          if (saved.csvData)   setCsvData(saved.csvData);
          if (saved.columnMap) setColumnMap(saved.columnMap);
          if (saved.zipJobId)  setZipJobId(saved.zipJobId);
          if (saved.csvJobId)  setCsvJobId(saved.csvJobId);
        }

        // Clamp the URL step: can't be beyond what the server knows is complete
        // but we trust the URL step if it's ≤ serverStep (e.g. user went back)
        const safeStep = Math.min(Math.max(urlStep, 0), serverStep);
        setStepRaw(safeStep);

        // Keep URL in sync
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set("step",    String(safeStep));
          next.set("project", String(proj.id));
          return next;
        }, { replace: true });
      })
      .catch(() => {
        setError("Failed to reload project. Please refresh.");
      })
      .finally(() => setLoading(false));
  }, []); // run once on mount only

  // ── Actions exposed to steps ──────────────────────────────────────────────────

  /** Called when step 0 completes — creates the project */
  const createProject = useCallback(async ({ templateId, name, outputFormat }) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/projects", {
        template_id:   templateId,
        name,
        output_format: outputFormat,
      });
      const proj = data.data;
      setProject(proj);
      setStep(1);
      return proj;
    } catch (err) {
      const msg = err.response?.data?.error?.description || "Failed to create project";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setStep]);

  /** Called when CSV job completes — updates csvData and advances step */
  const onCsvDone = useCallback((result, jobResult) => {
    // jobResult comes from the background job payload, but we also re-fetch
    // the project to get csv_headers and total_rows from the server
    api.get(`/projects/${result.id ?? projectId}`)
      .then(({ data }) => {
        const proj = data.data.project;
        setProject(proj);
        const headers = proj.csv_headers ?? [];
        const rows    = proj.total_rows ?? 0;
        setCsvData({ headers, total_rows: rows, preview: [] });
        setStep(2);
      })
      .catch(() => {
        // Fallback: use what the job returned
        if (jobResult) {
          const headers = JSON.parse(jobResult.result_headers ?? "[]");
          setCsvData({ headers, total_rows: jobResult.result_rows ?? 0, preview: [] });
          setStep(2);
        }
      });
  }, [projectId, setStep]);

  /** Called when column map is saved */
  const onMapSaved = useCallback((map) => {
    setColumnMap(map);
    // Re-fetch project so column_map is authoritative from server
    api.get(`/projects/${projectId}`)
      .then(({ data }) => setProject(data.data.project))
      .catch(() => {});
    setStep(3);
  }, [projectId, setStep]);

  /** Navigate to a previous completed step */
  const goToStep = useCallback((n) => {
    setStep(n);
  }, [setStep]);

  /** Clear everything — called after project is submitted/completed */
  const reset = useCallback(() => {
    sessionClear(projectId);
    setProject(null);
    setCsvData(null);
    setColumnMap(null);
    setZipJobId(null);
    setCsvJobId(null);
    setStepRaw(0);
    setSearchParams({}, { replace: true });
  }, [projectId, setSearchParams]);

  const value = {
    // State
    project,
    step,
    csvData,
    columnMap,
    zipJobId,
    csvJobId,
    loading,
    error,

    // Setters
    setProject,
    setCsvData,
    setColumnMap,
    setZipJobId,
    setCsvJobId,
    setError,

    // Actions
    createProject,
    onCsvDone,
    onMapSaved,
    goToStep,
    setStep,
    reset,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}