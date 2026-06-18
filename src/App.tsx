import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Pipeline from './pages/Pipeline'
import Contacts from './pages/Contacts'
import ProspectDetail from './pages/ProspectDetail'
import Templates from './pages/Templates'
import Stats from './pages/Stats'
import Login from './pages/Login'
import Sidebar from './components/layout/Sidebar'
import { useAuth } from './lib/auth'

function App() {
  const { session, loading } = useAuth()

  // Wait for the initial session check before deciding what to render, so we
  // never briefly flash the app (or the login screen) on a hard refresh.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-muted">
        Loading…
      </div>
    )
  }

  // No session → the entire app (and all data-fetching pages) stays unmounted.
  if (!session) {
    return <Login />
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/prospects/:id" element={<ProspectDetail />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/contacts" element={<Contacts />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
