import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Spinner, ErrorMessage } from '@/components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error?.description || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-brand-600">BDP</span>
          <p className="text-gray-500 text-sm mt-1">Bulk Design Platform</p>
        </div>
        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email"
                className="input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password"
                className="input" placeholder="••••••••"
                value={form.password} onChange={handleChange} />
            </div>
            <ErrorMessage message={error} />
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading && <Spinner className="w-4 h-4" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}