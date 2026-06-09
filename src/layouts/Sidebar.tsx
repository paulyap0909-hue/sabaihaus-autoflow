import { ChevronLeft, Leaf } from 'lucide-react'
import { navigationSections } from './navigation'
import type { AppNavigationState } from '../types/navigation'
import './layout.css'

interface SidebarProps {
  navigation: AppNavigationState
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ navigation, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <Leaf size={20} strokeWidth={1.8} />
          </span>
          <div>
            <strong>Sabai Haus</strong>
            <span>AutoFlow Wellness OS</span>
          </div>
          <button
            className="sidebar-close"
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <ChevronLeft size={19} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigationSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <span className="nav-section-label">{section.label}</span>
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = navigation.currentPage === item.id

                return (
                  <button
                    className={`nav-item ${isActive ? 'is-active' : ''}`}
                    type="button"
                    key={item.id}
                    onClick={() => {
                      navigation.navigate(item.id)
                      onClose()
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="branch-card">
            <span className="branch-dot" />
            <div>
              <strong>Bangsar Wellness</strong>
              <span>Open · 9:00 AM–9:00 PM</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
