import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ConfirmEmail from './pages/ConfirmEmail'
import PotsList from './pages/PotsList'
import CreatePot from './pages/CreatePot'
import PotDetail from './pages/PotDetail'
import MakePayment from './pages/MakePayment'
import RequestPayout from './pages/RequestPayout'
import Wallet from './pages/Wallet'
import AgentApply from './pages/AgentApply'
import AgentDashboard from './pages/AgentDashboard'
import AgentRecordPayment from './pages/AgentRecordPayment'
import AdminDashboard from './pages/AdminDashboard'
import AdminSaverDetail from './pages/AdminSaverDetail'
import AdminAddAdmin from './pages/AdminAddAdmin'
import AdminRegisterAgent from './pages/AdminRegisterAgent'
import RequireRole from './components/RequireRole'
import { useAuth } from './context/AuthContext'
import NotFound from './pages/NotFound'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      {/* Leave room for the phone tab bar (see Navbar) so it never covers content. */}
      <main className={isAuthenticated ? 'pb-24 md:pb-0' : undefined}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />

          <Route
            path="/pots"
            element={
              <ProtectedRoute>
                <PotsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pots/new"
            element={
              <ProtectedRoute>
                <CreatePot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pots/:potId"
            element={
              <ProtectedRoute>
                <PotDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pots/:potId/pay"
            element={
              <ProtectedRoute>
                <MakePayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pots/:potId/payout"
            element={
              <ProtectedRoute>
                <RequestPayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent/apply"
            element={
              <ProtectedRoute>
                <AgentApply />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent"
            element={
              <ProtectedRoute>
                <RequireRole role="agent">
                  <AgentDashboard />
                </RequireRole>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/record"
            element={
              <ProtectedRoute>
                <RequireRole role="agent">
                  <AgentRecordPayment />
                </RequireRole>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RequireRole role={['admin', 'super_admin']}>
                  <AdminDashboard />
                </RequireRole>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/savers/:saverId"
            element={
              <ProtectedRoute>
                <RequireRole role={['admin', 'super_admin']}>
                  <AdminSaverDetail />
                </RequireRole>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins/new"
            element={
              <ProtectedRoute>
                <RequireRole role="super_admin">
                  <AdminAddAdmin />
                </RequireRole>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agents/register"
            element={
              <ProtectedRoute>
                <RequireRole role={['admin', 'super_admin']}>
                  <AdminRegisterAgent />
                </RequireRole>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
