import { AppLayout } from './layouts/AppLayout'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { CommissionCenterPage } from './pages/CommissionCenterPage'
import { CustomersPage } from './pages/CustomersPage'
import { DashboardPage } from './pages/DashboardPage'
import { MembershipsPage } from './pages/MembershipsPage'
import { InventoryCenterPage } from './pages/InventoryCenterPage'
import { NotificationCenterPage } from './pages/NotificationCenterPage'
import { PackagesPage } from './pages/PackagesPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TherapistsPage } from './pages/TherapistsPage'
import { WellnessProfilesPage } from './pages/WellnessProfilesPage'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useDemoAuth } from './hooks/useDemoAuth'
import { LoginPage } from './pages/LoginPage'
import './App.css'

const pages = {
  dashboard: DashboardPage,
  appointments: AppointmentsPage,
  customers: CustomersPage,
  'wellness-profiles': WellnessProfilesPage,
  packages: PackagesPage,
  therapists: TherapistsPage,
  'commission-center': CommissionCenterPage,
  memberships: MembershipsPage,
  'inventory-center': InventoryCenterPage,
  'notification-center': NotificationCenterPage,
  reports: ReportsPage,
  settings: SettingsPage,
}

function App() {
  const navigation = useAppNavigation()
  const auth = useDemoAuth()
  const CurrentPage = pages[navigation.currentPage]

  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={auth.login} />
  }

  if (auth.pathname === '/login') {
    return null
  }

  return (
    <AppLayout navigation={navigation} onLogout={auth.logout}>
      <CurrentPage />
    </AppLayout>
  )
}

export default App
