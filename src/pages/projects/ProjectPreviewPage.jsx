import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fabric } from 'fabric'
import api from '@/lib/api'
import { Spinner, ErrorMessage } from '@/components/ui'

const BLANK_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

function patchJson(json) {
  return json.replace(
    /"src"\s*:\s*"(\{[^}]+\})"/g,
    (_, ph) => `"src":"${BLANK_PNG}","_placeholderSrc":"${ph}"`
  )
}

function loadFabricImage(url) {
  return new Promise(resolve => {
    fabric.Image.fromURL(url, img => resolve(img || null), { crossOrigin: 'anonymous' })
  })
}

// Draw watermark overlay on the canvas
function addWatermark(fc, width, height) {
  // Semi-transparent diagonal band
  const lines = []
  const step  = 120
  for (let i = -height; i < width + height; i += step) {
    const line = new fabric.Text('PREVIEW — NOT FINAL OUTPUT', {
      left:        i,
      top:         height / 2,
      fontSize:    22,
      fontFamily:  'Arial',
      fontWeight:  'bold',
      fill:        'rgba(0, 0, 0, 0.18)',
      angle:       -30,
      selectable:  false,
      evented:     false,
      hasControls: false,
      hasBorders:  false,
    })
    lines.push(line)
  }

  // One large centered overlay text
  const center = new fabric.Text('PREVIEW', {
    left:        width / 2,
    top:         height / 2,
    fontSize:    72,
    fontFamily:  'Arial',
    fontWeight:  'bold',
    fill:        'rgba(0, 0, 0, 0.08)',
    angle:       -30,
    originX:     'center',
    originY:     'center',
    selectable:  false,
    evented:     false,
    hasControls: false,
    hasBorders:  false,
  })

  // Banner at top
  const banner = new fabric.Rect({
    left:        0,
    top:         0,
    width:       width,
    height:      32,
    fill:        'rgba(99, 102, 241, 0.85)',
    selectable:  false,
    evented:     false,
  })
  const bannerText = new fabric.Text('PREVIEW — Complete payment to generate final designs', {
    left:        width / 2,
    top:         16,
    fontSize:    12,
    fontFamily:  'Arial',
    fontWeight:  'bold',
    fill:        '#ffffff',
    originX:     'center',
    originY:     'center',
    selectable:  false,
    evented:     false,
  })

  lines.forEach(l => fc.add(l))
  fc.add(center)
  fc.add(banner)
  fc.add(bannerText)
  fc.renderAll()
}

// Render one row's data onto the canvas
async function renderPreview(fc, canvasJson, resolvedData, imageMap, width, height) {
  fc.clear()
  fc.setBackgroundColor('#ffffff', () => {})
  fc.setWidth(width)
  fc.setHeight(height)

  const patched = patchJson(typeof canvasJson === 'string' ? canvasJson : JSON.stringify(canvasJson))

  await new Promise((resolve) => {
    fc.loadFromJSON(patched, resolve)
  })

  const textRe  = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g
  const objects = fc.getObjects()
  const swaps   = []

  for (const obj of objects) {
    // Text substitution
    if (['textbox', 'text', 'i-text'].includes(obj.type)) {
      const original = obj.text || ''
      const replaced = original.replace(textRe, (_, key) =>
        key in resolvedData ? String(resolvedData[key] ?? '') : `{${key}}`
      )
      if (replaced !== original) obj.set('text', replaced)
    }

    // Image: plain {"type":"image","_placeholderSrc":"{photo}"}
    if (obj.type === 'image') {
      const ph       = obj._placeholderSrc || ''
      const keyMatch = ph.match(/^\{([a-zA-Z_][a-zA-Z0-9_]*)\}$/)
      if (!keyMatch) continue

      const key = keyMatch[1]
      const val = String(resolvedData[key] || '')
      let imageUrl = val.startsWith('http') ? val : (imageMap[val] || null)
      if (!imageUrl) continue

      const targetObj = obj
      swaps.push((async () => {
        const img = await loadFabricImage(imageUrl)
        if (!img) return

        const bounds = {
          left:   targetObj.left,
          top:    targetObj.top,
          width:  (targetObj.width  || 180) * (targetObj.scaleX || 1),
          height: (targetObj.height || 220) * (targetObj.scaleY || 1),
        }

        const scale = Math.max(bounds.width / img.width, bounds.height / img.height)
        img.set({
          left:    bounds.left - (img.width  * scale - bounds.width)  / 2,
          top:     bounds.top  - (img.height * scale - bounds.height) / 2,
          scaleX:  scale,
          scaleY:  scale,
          angle:   0,
          originX: 'left',
          originY: 'top',
        })
        img.clipPath = new fabric.Rect({
          left:               bounds.left,
          top:                bounds.top,
          width:              bounds.width,
          height:             bounds.height,
          absolutePositioned: true,
        })

        const idx = fc.getObjects().indexOf(targetObj)
        fc.remove(targetObj)
        fc.insertAt(img, idx >= 0 ? idx : fc.getObjects().length)
      })())
    }

    // Group image placeholder
    if (obj.type === 'group' && (obj._isImagePlaceholder || obj._placeholderKey)) {
      const key      = obj._placeholderKey || obj.get('_placeholderKey')
      if (!key) continue
      const val      = String(resolvedData[key] || '')
      const imageUrl = val.startsWith('http') ? val : (imageMap[val] || null)
      if (!imageUrl) continue

      const targetObj = obj
      swaps.push((async () => {
        const img = await loadFabricImage(imageUrl)
        if (!img) return
        const br     = targetObj.getBoundingRect(true, true)
        const scale  = Math.max(br.width / img.width, br.height / img.height)
        img.set({
          left:    br.left  - (img.width  * scale - br.width)  / 2,
          top:     br.top   - (img.height * scale - br.height) / 2,
          scaleX:  scale,
          scaleY:  scale,
          angle:   0,
          originX: 'left',
          originY: 'top',
        })
        img.clipPath = new fabric.Rect({
          left: br.left, top: br.top,
          width: br.width, height: br.height,
          absolutePositioned: true,
        })
        const idx = fc.getObjects().indexOf(targetObj)
        fc.remove(targetObj)
        fc.insertAt(img, idx >= 0 ? idx : fc.getObjects().length)
      })())
    }
  }

  await Promise.all(swaps)
  fc.renderAll()

  // Add watermark last so it always sits on top
  addWatermark(fc, width, height)
}

export default function ProjectPreviewPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const canvasRef = useRef(null)
  const fcRef     = useRef(null)

  const [rowIndex,    setRowIndex]    = useState(0)
  const [totalRows,   setTotalRows]   = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [rendering,   setRendering]   = useState(false)
  const [error,       setError]       = useState('')
  const [projectName, setProjectName] = useState('')
  const [canvasSize,  setCanvasSize]  = useState({ w: 800, h: 500 })

  // Init canvas once
  useEffect(() => {
    const fc = new fabric.Canvas(canvasRef.current, {
      width:                   800,
      height:                  500,
      backgroundColor:         '#ffffff',
      preserveObjectStacking:  true,
      selection:               false,
    })
    fcRef.current = fc
    return () => fc.dispose()
  }, [])

  // Fetch and render a row
  const loadRow = useCallback(async (index) => {
    setRendering(true)
    setError('')
    try {
      const { data } = await api.get(`/projects/${id}/preview?row=${index}`)
      const d = data.data

      if (index === 0) {
        setTotalRows(d.total_rows)
        setProjectName(d.project_name || `Project #${id}`)
        // Resize canvas if needed
        const w = d.width_px  || 800
        const h = d.height_px || 500
        setCanvasSize({ w, h })
        fcRef.current.setWidth(w)
        fcRef.current.setHeight(h)
      }

      await renderPreview(
        fcRef.current,
        d.canvas_snapshot_json,
        d.resolved_data,
        d.image_map || {},
        d.width_px  || 800,
        d.height_px || 500,
      )
    } catch (err) {
      setError(err.response?.data?.error?.description || 'Failed to load preview')
    } finally {
      setLoading(false)
      setRendering(false)
    }
  }, [id])

  useEffect(() => {
    // Wait for canvas to be ready
    const timer = setTimeout(() => loadRow(0), 100)
    return () => clearTimeout(timer)
  }, [loadRow])

  function goTo(index) {
    if (index < 0 || index >= totalRows) return
    setRowIndex(index)
    loadRow(index)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          <div>
            <h1 className="page-header">Design preview</h1>
            {projectName && <p className="text-sm text-gray-500 mt-0.5">{projectName}</p>}
          </div>
        </div>
        <button
          onClick={() => navigate('/pricing', { state: { projectId: id, rows: totalRows } })}
          className="btn-primary self-start sm:self-auto"
        >
          Buy credits & generate →
        </button>
      </div>

      <ErrorMessage message={error} />

      {/* Info banner */}
      <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-3 text-sm text-brand-700">
        <strong>This is a watermarked preview.</strong> Review how your data looks in the design.
        Once you're happy, complete payment to generate the final clean outputs.
      </div>

      {/* Canvas */}
      <div className="card overflow-hidden">
        <div className="relative bg-gray-100 flex items-center justify-center p-4 sm:p-8 min-h-[300px]">
          {(loading || rendering) && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="w-8 h-8" />
                <p className="text-sm text-gray-500">{loading ? 'Loading…' : 'Rendering row…'}</p>
              </div>
            </div>
          )}
          <div className="shadow-xl overflow-hidden" style={{ maxWidth: '100%' }}>
            <canvas
              ref={canvasRef}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {/* Row navigation */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => goTo(rowIndex - 1)}
            disabled={rowIndex === 0 || rendering}
            className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40"
          >
            ← Previous
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              Row {rowIndex + 1} of {totalRows}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalRows > 1 ? `Navigate to preview other rows` : 'Single row project'}
            </p>
          </div>

          <button
            onClick={() => goTo(rowIndex + 1)}
            disabled={rowIndex >= totalRows - 1 || rendering}
            className="btn-secondary text-sm py-1.5 px-4 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Jump to row */}
      {totalRows > 5 && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500 shrink-0">Jump to row:</p>
          <input
            type="number"
            min={1}
            max={totalRows}
            className="input text-sm py-1.5 w-24"
            placeholder="1"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = parseInt(e.target.value, 10)
                if (val >= 1 && val <= totalRows) goTo(val - 1)
              }
            }}
          />
          <p className="text-xs text-gray-400">Press Enter to jump</p>
        </div>
      )}

      {/* CTA */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">Ready to generate?</p>
          <p className="text-sm text-gray-500 mt-1">
            {totalRows} designs will be rendered and bundled in a ZIP file.
          </p>
        </div>
        <button
          onClick={() => navigate('/pricing', { state: { projectId: id, rows: totalRows } })}
          className="btn-primary whitespace-nowrap"
        >
          Get {totalRows} credits & generate →
        </button>
      </div>
    </div>
  )
}