import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import GuestRoute from '@/components/GuestRoute'
import Layout from '@/components/Layout'

import LoginPage    from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

import DashboardPage      from '@/pages/DashboardPage'
import TemplatesPage      from '@/pages/templates/TemplatesPage'
import TemplateEditorPage from '@/pages/templates/TemplateEditorPage'
import ProjectsPage       from '@/pages/projects/ProjectsPage'
import ProjectWizardPage  from '@/pages/projects/ProjectWizardPage'
import ProjectStatusPage  from '@/pages/projects/ProjectStatusPage'
import PricingPage        from '@/pages/PricingPage'

function AppShell({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition:   true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          <Route path="/dashboard"           element={<AppShell><DashboardPage /></AppShell>} />
          <Route path="/templates"           element={<AppShell><TemplatesPage /></AppShell>} />
          <Route path="/templates/new"       element={<AppShell><TemplateEditorPage /></AppShell>} />
          <Route path="/templates/:id/edit"  element={<AppShell><TemplateEditorPage /></AppShell>} />
          <Route path="/projects"            element={<AppShell><ProjectsPage /></AppShell>} />
          <Route path="/projects/new"        element={<AppShell><ProjectWizardPage /></AppShell>} />
          <Route path="/projects/:id/status" element={<AppShell><ProjectStatusPage /></AppShell>} />
          <Route path="/pricing"             element={<AppShell><PricingPage /></AppShell>} />

          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}