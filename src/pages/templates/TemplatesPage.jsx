import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Spinner, ErrorMessage, Badge } from '@/components/ui'

function TemplateCard({ template, onDelete }) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e) {
    e.preventDefault()
    if (!confirm(`Delete "${template.name}"?`)) return
    setDeleting(true)
    try {
      await api.delete(`/templates/${template.id}`)
      onDelete(template.id)
    } catch {
      alert('Failed to delete template')
      setDeleting(false)
    }
  }

  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group">
      {/* Thumbnail / preview */}
      <div
        className="h-36 sm:h-40 bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center relative cursor-pointer"
        onClick={() => navigate(`/templates/${template.id}/edit`)}
      >
        {template.thumbnail_url ? (
          <img src={template.thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-4">
            <span className="text-3xl">🖼</span>
            <p className="text-xs text-brand-400 mt-1">{template.width_px}×{template.height_px}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm">{template.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{template.category}</p>
          </div>
          <Badge color={template.is_public ? 'green' : 'gray'}>
            {template.is_public ? 'Public' : 'Private'}
          </Badge>
        </div>

        {template.placeholders?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.placeholders.slice(0, 3).map(p => (
              <span key={p} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                {'{' + p + '}'}
              </span>
            ))}
            {template.placeholders.length > 3 && (
              <span className="text-xs text-gray-400">+{template.placeholders.length - 3} more</span>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => navigate(`/templates/${template.id}/edit`)}
            className="btn-secondary flex-1 text-xs py-1.5"
          >
            Edit
          </button>
          <button
            onClick={() => navigate('/projects/new', { state: { templateId: template.id } })}
            className="btn-primary flex-1 text-xs py-1.5"
          >
            Use
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger text-xs py-1.5 px-2.5"
          >
            {deleting ? '…' : '🗑'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [gallery,   setGallery]   = useState([])
  const [tab,       setTab]       = useState('mine')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [category,  setCategory]  = useState('')

  const categories = ['id_card','certificate','invite','badge','business_card','ticket','label','other']

  useEffect(() => {
    async function load() {
      try {
        const [myRes, galRes] = await Promise.all([
          api.get('/templates'),
          api.get('/templates/gallery'),
        ])
        setTemplates(myRes.data.data.templates || [])
        setGallery(galRes.data.data.templates || [])
      } catch {
        setError('Failed to load templates')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleDelete(id) {
    setTemplates(ts => ts.filter(t => t.id !== id))
  }

  const filteredGallery = category
    ? gallery.filter(t => t.category === category)
    : gallery

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner className="w-8 h-8" /></div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="page-header">Templates</h1>
        <button onClick={() => navigate('/templates/new')} className="btn-primary self-start sm:self-auto">
          + New template
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {[['mine', 'My templates'], ['gallery', 'Gallery']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label} {key === 'mine' ? `(${templates.length})` : `(${gallery.length})`}
          </button>
        ))}
      </div>

      {tab === 'mine' && (
        templates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🖼</p>
            <p className="text-gray-500">No templates yet</p>
            <button onClick={() => navigate('/templates/new')} className="btn-primary mt-4">
              Create your first template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map(t => (
              <TemplateCard key={t.id} template={t} onDelete={handleDelete} />
            ))}
          </div>
        )
      )}

      {tab === 'gallery' && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                !category ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600 hover:border-brand-300'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                  category === c ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300 text-gray-600 hover:border-brand-300'
                }`}
              >
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>

          {filteredGallery.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No templates in this category</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGallery.map(t => (
                <div key={t.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-36 sm:h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    {t.thumbnail_url
                      ? <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover" />
                      : <span className="text-3xl">🖼</span>
                    }
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{t.name}</h3>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{t.category}</p>
                    <button
                      onClick={() => navigate('/projects/new', { state: { templateId: t.id } })}
                      className="btn-primary w-full text-xs py-1.5 mt-3"
                    >
                      Use this template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}