import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Spinner, StatusBadge, ErrorMessage } from '@/components/ui'

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function ProjectRow({ project }) {
  const navigate = useNavigate()
  const isActive = ['queued', 'processing'].includes(project.status)
  const isDone   = project.status === 'done'

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{project.total_rows} rows · {project.output_format}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={project.status} />
        {(isActive || isDone) && (
          <button
            onClick={() => navigate(`/projects/${project.id}/status`)}
            className={`text-xs font-medium hover:underline hidden sm:block ${isDone ? 'text-green-600' : 'text-brand-600'}`}
          >
            {isDone ? 'Download' : 'Progress'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [projects,  setProjects]  = useState([])
  const [templates, setTemplates] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [pRes, tRes] = await Promise.all([
          api.get('/projects'),
          api.get('/templates'),
        ])
        setProjects(pRes.data.data.projects || [])
        setTemplates(tRes.data.data.templates || [])
        await refreshUser()
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const doneCount   = projects.filter(p => p.status === 'done').length
  const activeCount = projects.filter(p => ['queued','processing'].includes(p.status)).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6 lg:space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-header">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your designs</p>
        </div>
        <button onClick={() => navigate('/projects/new')} className="btn-primary self-start sm:self-auto">
          + New project
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Credits"        value={user?.credits ?? 0}  sub="1 credit = 1 design" />
        <StatCard label="Total projects" value={projects.length} />
        <StatCard label="Completed"      value={doneCount}            sub="ready to download" />
        <StatCard label="In progress"    value={activeCount}          sub={activeCount > 0 ? 'rendering now' : 'none active'} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { to: '/templates/new', icon: '🖼', bg: 'bg-brand-50 group-hover:bg-brand-100', title: 'New template', desc: 'Design a reusable template with placeholders' },
          { to: '/projects/new',  icon: '📁', bg: 'bg-green-50 group-hover:bg-green-100',  title: 'New project',  desc: 'Upload CSV and generate designs in bulk' },
          { to: '/pricing',       icon: '💳', bg: 'bg-amber-50 group-hover:bg-amber-100',  title: 'Buy credits',  desc: 'Top up your wallet to generate more designs' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="card p-4 sm:p-5 hover:border-brand-300 hover:shadow-md transition-all group">
            <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mb-3 transition-colors`}>
              <span className="text-xl">{item.icon}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent projects */}
      <div className="card">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
          <h2 className="section-title">Recent projects</h2>
          <Link to="/projects" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="px-4 sm:px-5">
          {projects.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-400 text-sm">No projects yet</p>
              <button onClick={() => navigate('/projects/new')} className="btn-primary mt-3 text-sm">
                Create your first project
              </button>
            </div>
          ) : (
            projects.slice(0, 5).map(p => <ProjectRow key={p.id} project={p} />)
          )}
        </div>
      </div>

      {/* Templates */}
      {templates.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
            <h2 className="section-title">Your templates</h2>
            <Link to="/templates" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="px-4 sm:px-5 py-3 flex flex-wrap gap-2">
            {templates.slice(0, 6).map(t => (
              <Link
                key={t.id}
                to={`/templates/${t.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg text-sm text-gray-700 transition-colors"
              >
                🖼 {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}