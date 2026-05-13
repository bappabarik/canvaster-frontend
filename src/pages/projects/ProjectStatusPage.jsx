import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";
import { Spinner, StatusBadge, ErrorMessage } from "@/components/ui";

function ProgressBar({ pct }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
      <div
        className="h-full bg-brand-500 rounded-full transition-all duration-500"
        style={{ width: `${Math.max(2, pct)}%` }}
      />
    </div>
  );
}

export default function ProjectStatusPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const fetchStatus = useCallback(
    () => api.get(`/projects/${id}/status`).then((r) => r.data.data),
    [id],
  );
  const onData = useCallback((data) => setStatus(data), []);
  const shouldStop = useCallback(
    (data) => ["done", "failed"].includes(data?.status),
    [],
  );

  usePolling(fetchStatus, onData, shouldStop, 3000, true);

  async function handleDownload() {
    setDownloading(true);
    setError("");

    try {
      const { data } = await api.get(`/projects/${id}/download`);
      const zipUrl = data.data.download_url;
      const filename = `project_${id}_designs.zip`;

      // FIX: Safely insert the attachment flag directly after /raw/upload/
      const downloadUrl = zipUrl.replace(
        "/raw/upload/",
        `/raw/upload/fl_attachment:${filename}/`,
      );

      const link = document.createElement("a");
      link.href = downloadUrl;
      // Setting target to _self prevents blank flashing tabs
      link.target = "_self";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      setError("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  const isDone = status?.status === "done";
  const isFailed = status?.status === "failed";
  const isProcessing = ["queued", "processing"].includes(status?.status);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/projects")}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ←
        </button>
        <h1 className="page-header">Project status</h1>
      </div>

      <ErrorMessage message={error} />

      {!status ? (
        <div className="flex justify-center py-16">
          <Spinner className="w-8 h-8" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="section-title">Project #{status.project_id}</h2>
              <StatusBadge status={status.status} />
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium text-gray-900">
                  {status.progress_pct}%
                </span>
              </div>
              <ProgressBar pct={status.progress_pct} />
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {status.rows_done} of {status.total_rows} designs done
                </span>
                {status.rows_failed > 0 && (
                  <span className="text-red-500">
                    {status.rows_failed} failed
                  </span>
                )}
              </div>
            </div>

            {/* Polling indicator */}
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Spinner className="w-4 h-4" />
                <span>Checking every 3 seconds…</span>
              </div>
            )}

            {/* Done */}
            {isDone && (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  🎉 All {status.rows_done} designs generated! Your ZIP is
                  ready.
                </div>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary w-full py-3 text-base"
                >
                  {downloading ? (
                    <>
                      <Spinner className="w-5 h-5 text-white" /> Preparing
                      download…
                    </>
                  ) : (
                    "⬇ Download ZIP"
                  )}
                </button>
                {downloading && (
                  <p className="text-xs text-center text-gray-400">
                    Fetching your ZIP file — this may take a moment for large
                    batches.
                  </p>
                )}
              </div>
            )}

            {/* Failed */}
            {isFailed && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                Generation failed. {status.rows_failed} rows could not be
                rendered.
                {status.rows_done > 0 &&
                  " Some designs may still be available."}
              </div>
            )}

            {/* Pending payment */}
            {status.status === "pending_payment" && (
              <div className="space-y-3">
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                  Waiting for payment to start generation.
                </div>
                {/* Add preview button */}
                <button
                  onClick={() => navigate(`/projects/${id}/preview`)}
                  className="btn-secondary w-full"
                >
                  👁 Preview designs before paying
                </button>
                <button
                  onClick={() =>
                    navigate("/pricing", {
                      state: { projectId: id, rows: status.total_rows },
                    })
                  }
                  className="btn-primary w-full"
                >
                  Complete payment →
                </button>
              </div>
            )}
          </div>

          {/* Job details */}
          {status.job && (
            <div className="card p-5">
              <h3 className="section-title mb-4">Job details</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["Job status", status.job.status],
                  ["Started", status.job.started_at || "—"],
                  ["Completed", status.job.completed_at || "—"],
                  ["Rows done", status.job.rows_done],
                  ["Rows failed", status.job.rows_failed],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">
                      {String(val)}
                    </span>
                  </div>
                ))}
                {status.job.error_log && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Error log
                    </p>
                    <p className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded break-all">
                      {status.job.error_log}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
