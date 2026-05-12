import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Spinner, ErrorMessage, StatusBadge } from '@/components/ui'

function ProjectCard({ project }) {
  const navigate = useNavigate()
  const isActive = ['queued', 'processing'].includes(project.status)
  const isDone   = project.status === 'done'
  const isFailed = project.status === 'failed'

  return (
    <div className="card p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {project.total_rows} rows · {project.output_format?.replace('_', ' ')}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Progress bar for active jobs */}
      {isActive && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full animate-pulse w-2/3" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Generating designs…</p>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {project.status === 'draft' && (
          <button
            onClick={() => navigate('/projects/new', { state: { continueId: project.id } })}
            className="btn-secondary text-xs py-1.5 flex-1"
          >
            Continue setup
          </button>
        )}
        {(isActive || isDone || isFailed) && (
          <button
            onClick={() => navigate(`/projects/${project.id}/status`)}
            className="btn-secondary text-xs py-1.5 flex-1"
          >
            {isDone ? 'Download' : 'View status'}
          </button>
        )}
        {project.status === 'pending_payment' && (
          <Link to="/pricing" className="btn-primary text-xs py-1.5 flex-1 text-center">
            Complete payment
          </Link>
        )}
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState('all')

  const filters = [
    { key: 'all',             label: 'All' },
    { key: 'draft',           label: 'Draft' },
    { key: 'pending_payment', label: 'Pending payment' },
    { key: 'active',          label: 'Active' },
    { key: 'done',            label: 'Done' },
    { key: 'failed',          label: 'Failed' },
  ]

  useEffect(() => {
    api.get('/projects')
      .then(r => setProjects(r.data.data.projects || []))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'    ? projects
    : filter === 'active' ? projects.filter(p => ['queued','processing'].includes(p.status))
    : projects.filter(p => p.status === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="page-header">Projects</h1>
        <button onClick={() => navigate('/projects/new')} className="btn-primary self-start sm:self-auto">
          + New project
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
            }`}
          >
            {f.label}
            {f.key === 'all' && ` (${projects.length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-gray-500 text-sm">
            {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          </p>
          {filter === 'all' && (
            <button onClick={() => navigate('/projects/new')} className="btn-primary mt-4">
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}