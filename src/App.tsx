import { AppLayout } from './layouts/AppLayout'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { ActionCenterPage } from './pages/ActionCenterPage'
import { CommissionCenterPage } from './pages/CommissionCenterPage'
import { CustomersPage } from './pages/CustomersPage'
import { DashboardPage } from './pages/DashboardPage'
import { MembershipsPage } from './pages/MembershipsPage'
import { InventoryCenterPage } from './pages/InventoryCenterPage'
import { CommunicationCenterPage } from './pages/CommunicationCenterPage'
import { PackagesPage } from './pages/PackagesPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { TherapistsPage } from './pages/TherapistsPage'
import { WellnessProfilesPage } from './pages/WellnessProfilesPage'
import { SystemHealthPage } from './pages/SystemHealthPage'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useDemoAuth } from './hooks/useDemoAuth'
import { LoginPage } from './pages/LoginPage'
import './App.css'

const pages = {
  dashboard: DashboardPage,
  'action-center': ActionCenterPage,
  appointments: AppointmentsPage,
  customers: CustomersPage,
  'wellness-profiles': WellnessProfilesPage,
  packages: PackagesPage,
  therapists: TherapistsPage,
  'commission-center': CommissionCenterPage,
  memberships: MembershipsPage,
  'inventory-center': InventoryCenterPage,
  communication: CommunicationCenterPage,
  reports: ReportsPage,
  settings: SettingsPage,
  'admin-system-health': SystemHealthPage,
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
