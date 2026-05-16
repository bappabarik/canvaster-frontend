import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Spinner, ErrorMessage, StatusBadge } from '@/components/ui'

function RowStatusDot({ status }) {
  const colors = {
    pending:    'bg-gray-300',
    processing: 'bg-blue-400 animate-pulse',
    done:       'bg-green-400',
    failed:     'bg-red-400',
  }
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status] ?? 'bg-gray-300'}`} title={status} />
  )
}

function RowCard({ row, index }) {
  const data    = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {})
  const isDone  = row.status === 'done'
  const isFail  = row.status === 'failed'
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!row.output_path) return
    setDownloading(true)
    try {
      await downloadFile(row.output_path, `row_${index + 1}.png`)
    } catch {
      window.open(row.output_path, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 ${isFail ? 'bg-red-50 -mx-4 px-4 rounded' : ''}`}>
      <span className="text-xs text-gray-400 w-8 shrink-0 text-right">#{index + 1}</span>

      <RowStatusDot status={row.status} />

      {/* Row data preview */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {Object.entries(data).slice(0, 4).map(([k, v]) => (
            <span key={k} className="text-xs text-gray-600 truncate max-w-[120px]">
              <span className="text-gray-400">{k}:</span> {String(v)}
            </span>
          ))}
        </div>
        {isFail && row.error_msg && (
          <p className="text-xs text-red-500 mt-0.5 truncate">{row.error_msg}</p>
        )}
      </div>

      {/* Output thumbnail */}
      {isDone && row.output_path && (
        <div className="flex items-center gap-2 shrink-0">
          <img
            src={row.output_path}
            alt={`Row ${index + 1}`}
            className="w-12 h-10 object-cover rounded border border-gray-200 hidden sm:block"
            onError={e => e.target.style.display = 'none'}
          />
          <button onClick={handleDownload} disabled={downloading}
            className="btn-secondary text-xs py-1 px-2.5">
            {downloading ? '…' : '⬇'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [project,     setProject]     = useState(null)
  const [job,         setJob]         = useState(null)
  const [rows,        setRows]        = useState([])
  const [page,        setPage]        = useState(0)
  const [totalRows,   setTotalRows]   = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [error,       setError]       = useState('')
  const [downloading, setDownloading] = useState(false)

  const PAGE_SIZE = 20

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(r => {
        setProject(r.data.data.project)
        setJob(r.data.data.job)
        setTotalRows(r.data.data.project.total_rows || 0)
      })
      .catch(() => setError('Failed to load project'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoadingRows(true)
    api.get(`/projects/${id}/rows?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`)
      .then(r => setRows(r.data.data.rows || []))
      .catch(() => {})
      .finally(() => setLoadingRows(false))
  }, [id, page])

  async function handleDownloadZip() {
    if (!job?.output_zip_path) return
    setDownloading(true)
    try {
      await downloadFile(job.output_zip_path, `project_${id}_all_designs.zip`)
    } catch {
      window.open(job.output_zip_path, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  const totalPages = Math.ceil(totalRows / PAGE_SIZE)

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div>
            <h1 className="page-header">{project?.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {project?.output_format?.replace('_',' ')} · {totalRows} rows
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['pending_payment', 'draft'].includes(project?.status) && (
            <button
              onClick={() => navigate(`/projects/${id}/preview`)}
              className="btn-secondary text-sm"
            >
              Preview designs
            </button>
          )}
          {project?.status === 'done' && job?.output_zip_path && (
            <button onClick={handleDownloadZip} disabled={downloading} className="btn-primary">
              {downloading && <Spinner className="w-4 h-4" />}
              {downloading ? 'Downloading…' : '⬇ Download all'}
            </button>
          )}
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Project info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Status',       <StatusBadge status={project?.status} />],
          ['Total rows',   totalRows],
          ['Done',         job?.rows_done ?? '—'],
          ['Failed',       job?.rows_failed ?? '—'],
        ].map(([label, val]) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <div className="mt-1 font-semibold text-gray-900">{val}</div>
          </div>
        ))}
      </div>

      {/* Column map */}
      {project?.column_map && (
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Column mapping</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(project.column_map).map(([ph, col]) => (
              <div key={ph} className="flex items-center gap-1.5 text-xs">
                <code className="bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded font-mono">{'{' + ph + '}'}</code>
                <span className="text-gray-400">→</span>
                <span className="text-gray-700 font-medium">{col}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rows table */}
      <div className="card">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
          <h2 className="section-title">
            Rows
            {totalPages > 1 && (
              <span className="text-sm font-normal text-gray-400 ml-2">
                (page {page + 1} of {totalPages})
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            <span className="text-xs text-gray-500 mr-3">done</span>
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            <span className="text-xs text-gray-500">failed</span>
          </div>
        </div>

        <div className="px-4 sm:px-5 relative min-h-[100px]">
          {loadingRows && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <Spinner className="w-6 h-6" />
            </div>
          )}
          {rows.length === 0 && !loadingRows ? (
            <p className="text-center text-gray-400 text-sm py-8">No rows loaded yet</p>
          ) : (
            rows.map((row, i) => (
              <RowCard key={row.id} row={row} index={page * PAGE_SIZE + i} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loadingRows}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-xs text-gray-500">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loadingRows}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}