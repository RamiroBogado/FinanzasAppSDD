import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import '@fontsource-variable/inter'
import AppLayout from './components/AppLayout.jsx'
import { ToastProvider } from './components/ui/ToastProvider.jsx'
import AlertsPage from './pages/AlertsPage.jsx'
import AppPage from './pages/AppPage.jsx'
import BudgetPage from './pages/BudgetPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import GoalPage from './pages/GoalPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { PeriodProvider } from './context/PeriodContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <PeriodProvider>
            <ToastProvider>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />
                <Route path="/app" element={<Navigate to="/transacciones" replace />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/transacciones" element={<AppPage />} />
                  <Route path="/presupuestos" element={<BudgetPage />} />
                  <Route path="/metas" element={<GoalPage />} />
                  <Route path="/alertas" element={<AlertsPage />} />
                </Route>
              </Routes>
            </ToastProvider>
          </PeriodProvider>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
)
