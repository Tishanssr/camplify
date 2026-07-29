import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import MobileNav from './MobileNav'

export default function ScreenLayout({ title, children }) {
  return <main className="app-shell"><AppSidebar /><section className="app-content"><AppHeader title={title} />{children}</section><MobileNav /></main>
}
