export function Spinner({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={`animate-spin text-brand-600 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function ErrorMessage({ message }) {
  if (!message) return null
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  )
}

export function SuccessMessage({ message }) {
  if (!message) return null
  return (
    <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
      {message}
    </div>
  )
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray:   'bg-gray-100 text-gray-700',
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red:    'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
  )
}

// Map project/job status to badge color
export function StatusBadge({ status }) {
  const map = {
    draft:           { color: 'gray',   label: 'Draft' },
    pending_payment: { color: 'yellow', label: 'Awaiting payment' },
    queued:          { color: 'blue',   label: 'Queued' },
    processing:      { color: 'purple', label: 'Processing' },
    done:            { color: 'green',  label: 'Done' },
    failed:          { color: 'red',    label: 'Failed' },
  }
  const { color, label } = map[status] ?? { color: 'gray', label: status }
  return <Badge color={color}>{label}</Badge>
}
