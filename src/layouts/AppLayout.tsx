import { useState, type ReactNode } from 'react'
import type { AppNavigationState } from '../types/navigation'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppLayoutProps {
  navigation: AppNavigationState
  onLogout: () => void
  children: ReactNode
}

export function AppLayout({ navigation, onLogout, children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        navigation={navigation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="app-main">
        <TopBar
          onMenuOpen={() => setIsSidebarOpen(true)}
          onLogout={onLogout}
        />
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}
