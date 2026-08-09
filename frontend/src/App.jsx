import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import PotsList from './pages/PotsList'
import CreatePot from './pages/CreatePot'
import PotDetail from './pages/PotDetail'
import MakePayment from './pages/MakePayment'
import RequestPayout from './pages/RequestPayout'
import Wallet from './pages/Wallet'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
