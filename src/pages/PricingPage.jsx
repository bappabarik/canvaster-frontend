import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Spinner, ErrorMessage } from '@/components/ui'

function PricingCard({ tier, recommended, onBuy, buying }) {
  return (
    <div className={`card p-6 flex flex-col relative transition-shadow hover:shadow-lg ${
      recommended ? 'ring-2 ring-brand-500 shadow-md' : ''
    }`}>
      {recommended && (
        <div className="absolute -top-3 md:left-[47%] left-1/2 -translate-x-1/2">
          <span className="bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most popular</span>
        </div>
      )}
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 text-lg">{tier.label}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-gray-900">₹{tier.price_inr}</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {tier.designs_count} designs · ₹{(tier.per_design_paise / 100).toFixed(2)} each
        </p>
      </div>
      <ul className="space-y-2 text-sm text-gray-600 mb-6 flex-1">
        {[`${tier.designs_count} design credits`,'PNG + PDF output','Credits never expire','ZIP download'].map(f => (
          <li key={f} className="flex items-center gap-2"><span className="text-green-500">✓</span>{f}</li>
        ))}
      </ul>
      <button onClick={() => onBuy(tier)} disabled={buying === tier.id}
        className={`w-full py-2.5 font-medium rounded-lg transition-colors disabled:opacity-50 ${
          recommended ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}>
        {buying === tier.id
          ? <span className="flex items-center justify-center gap-2"><Spinner className="w-4 h-4 text-white" />Processing…</span>
          : 'Buy now'
        }
      </button>
    </div>
  )
}

export default function PricingPage() {
  const { user, refreshUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const projectId  = location.state?.projectId || null
  const rowsNeeded = location.state?.rows       || null

  const [tiers,          setTiers]         = useState([])
  const [loading,        setLoading]       = useState(true)
  const [buying,         setBuying]        = useState(null)
  const [usingCredits,   setUsingCredits]  = useState(false)
  const [error,          setError]         = useState('')

  const hasEnoughCredits = projectId && rowsNeeded && (user?.credits ?? 0) >= rowsNeeded

  useEffect(() => {
    api.get('/pricing')
      .then(r => setTiers(r.data.data.tiers || []))
      .catch(() => setError('Failed to load pricing'))
      .finally(() => setLoading(false))

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  // Use existing credits — no payment needed
  async function handleUseCredits() {
    setUsingCredits(true)
    setError('')
    try {
      await api.post('/payments/use-credits', { project_id: projectId })
      await refreshUser()
      navigate(`/projects/${projectId}/status`)
    } catch (err) {
      setError(err.response?.data?.error?.description || 'Failed to use credits')
    } finally {
      setUsingCredits(false)
    }
  }

  // Buy new credits via Razorpay
  async function handleBuy(tier) {
    setBuying(tier.id)
    setError('')
    try {
      const { data } = await api.post('/payments/create-order', {
        tier_id:    tier.id,
        project_id: projectId || undefined,
      })
      const order = data.data

      const options = {
        key:         order.key_id,
        amount:      order.amount_paise,
        currency:    'INR',
        name:        'BDP — Bulk Design Platform',
        description: tier.label,
        order_id:    order.razorpay_order_id,
        prefill:     order.prefill,
        theme:       { color: '#4f46e5' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            })
            await refreshUser()
            navigate(projectId ? `/projects/${projectId}/status` : '/dashboard')
          } catch {
            setError('Payment verification failed. Contact support.')
          }
        },
        modal: { ondismiss: () => setBuying(null) },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => { setError('Payment failed. Please try again.'); setBuying(null) })
      rzp.open()
    } catch (err) {
      setError(err.response?.data?.error?.description || 'Failed to create order')
      setBuying(null)
    }
  }

  const recommendedId = tiers.find(t => rowsNeeded && t.designs_count >= rowsNeeded)?.id || tiers[2]?.id

  if (loading) return <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>

  return (
    <div className="space-y-8 max-w-5xl md:p-0 p-4">
      <div>
        <h1 className="page-header">Design credits</h1>
        <p className="text-gray-500 mt-1">
          You have <strong>{user?.credits ?? 0} credits</strong>.
          {rowsNeeded ? ` This project needs ${rowsNeeded} credits.` : ''}
        </p>
      </div>

      <ErrorMessage message={error} />

      {/* Use existing credits banner */}
      {hasEnoughCredits && (
        <div className="card p-5 border-green-200 bg-green-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-green-900">You already have enough credits!</h3>
              <p className="text-sm text-green-700 mt-1">
                You have <strong>{user.credits} credits</strong> — this project needs <strong>{rowsNeeded}</strong>.
                No payment required.
              </p>
            </div>
            <button
              onClick={handleUseCredits}
              disabled={usingCredits}
              className="btn-primary bg-green-600 hover:bg-green-700 whitespace-nowrap self-start sm:self-auto"
            >
              {usingCredits && <Spinner className="w-4 h-4" />}
              {usingCredits ? 'Queuing…' : 'Use my credits →'}
            </button>
          </div>
        </div>
      )}

      {/* Buy more credits */}
      <div>
        {hasEnoughCredits && (
          <p className="text-sm text-gray-500 mb-4">Or buy more credits to top up your wallet:</p>
        )}
        {projectId && !hasEnoughCredits && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 mb-6">
            After payment, your project will be queued for generation automatically.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
          {tiers.map(tier => (
            <PricingCard
              key={tier.id}
              tier={tier}
              recommended={!hasEnoughCredits && tier.id === recommendedId}
              onBuy={handleBuy}
              buying={buying}
            />
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-gray-400">
        Credits are added instantly after payment and never expire.
      </p>
    </div>
  )
}