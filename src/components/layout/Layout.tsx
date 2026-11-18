import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import styles from './Layout.module.scss'

export function Layout() {
  return (
    <div>
      <Navbar />
      <main className={`container ${styles.body}`}>
        <Outlet />
      </main>
    </div>
  )
}
