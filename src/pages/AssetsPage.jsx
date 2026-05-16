import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { Spinner, ErrorMessage, Badge } from '@/components/ui'

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function AssetCard({ asset, onUseCSV }) {
  const isCSV   = asset.asset_type === 'csv_file'
  const isImage = ['row_image', 'zip_extract', 'template_bg'].includes(asset.asset_type)

  return (
    <div className="card p-4 flex gap-3 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {isImage ? (
          <img src={asset.cloudinary_url} alt={asset.original_filename}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
          />
        ) : null}
        <span className={`text-2xl ${isImage ? 'hidden' : ''}`}>
          {isCSV ? '📄' : '🖼'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{asset.original_filename}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge color={isCSV ? 'blue' : 'gray'}>
            {asset.asset_type.replace('_', ' ')}
          </Badge>
          <span className="text-xs text-gray-400">{formatBytes(asset.file_size_bytes)}</span>
          <span className="text-xs text-gray-400">
            {new Date(asset.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 shrink-0">
        {isCSV && (
          <button onClick={() => onUseCSV(asset)}
            className="btn-primary text-xs py-1 px-2.5">
            Use CSV
          </button>
        )}
        <a href={asset.cloudinary_url} target="_blank" rel="noopener noreferrer"
          className="btn-secondary text-xs py-1 px-2.5 text-center">
          View
        </a>
      </div>
    </div>
  )
}

export default function AssetsPage() {
  const navigate = useNavigate()
  const [assets,  setAssets]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all')

  const filters = [
    { key: 'all',         label: 'All' },
    { key: 'csv_file',    label: 'CSVs' },
    { key: 'zip_extract', label: 'Images' },
    { key: 'template_bg', label: 'Backgrounds' },
  ]

  useEffect(() => {
    api.get('/me/assets')
      .then(r => {
        // Flatten grouped response
        const grouped = r.data.data.assets || {}
        const flat    = Object.values(grouped).flat()
        setAssets(flat)
      })
      .catch(() => setError('Failed to load assets'))
      .finally(() => setLoading(false))
  }, [])

  function handleUseCSV(asset) {
    // Navigate to new project wizard with the asset pre-selected
    navigate('/projects/new', { state: { csvAssetId: asset.id, csvFilename: asset.original_filename } })
  }

  const filtered = filter === 'all'
    ? assets
    : assets.filter(a => a.asset_type === filter)

  const csvCount   = assets.filter(a => a.asset_type === 'csv_file').length
  const imageCount = assets.filter(a => ['zip_extract','row_image'].includes(a.asset_type)).length

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-header">Asset library</h1>
          <p className="text-gray-500 text-sm mt-1">
            {csvCount} CSV{csvCount !== 1 ? 's' : ''} · {imageCount} image{imageCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <ErrorMessage message={error} />

      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🗂</p>
          <p className="text-gray-500 text-sm">
            {filter === 'all' ? 'No assets yet. Upload a CSV or images in a project.' : `No ${filter.replace('_',' ')} assets.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(asset => (
            <AssetCard key={asset.id} asset={asset} onUseCSV={handleUseCSV} />
          ))}
        </div>
      )}

      {csvCount > 0 && (
        <div className="card p-4 bg-brand-50 border-brand-200">
          <p className="text-sm text-brand-700">
            <strong>Tip:</strong> Click "Use CSV" on any previously uploaded CSV to reuse it in a new project without re-uploading.
          </p>
        </div>
      )}
    </div>
  )
}