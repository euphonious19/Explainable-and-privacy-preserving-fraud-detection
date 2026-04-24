import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Analyze from './pages/Analyze'
import Results from './pages/Results'
import AlertQueue from './pages/AlertQueue'
import Metrics from './pages/Metrics'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        {/* Ambient Background Layer */}
        <div className="ambient-background">
          <div className="ambient-grid"></div>
        </div>

        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results" element={<Results />} />
            <Route path="/alerts" element={<AlertQueue />} />
            <Route path="/metrics" element={<Metrics />} />
          </Routes>
        </main>
        <footer style={{ 
          textAlign: 'center', 
          padding: '24px', 
          fontSize: '0.85rem', 
          color: '#64748b',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          marginTop: 'auto'
        }}>
          Proudly designed & developed by <strong>Lovely, Shruti, and Mahak</strong>
        </footer>
      </div>
    </BrowserRouter>
  )
}
