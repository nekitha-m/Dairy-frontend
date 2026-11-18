import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Navbar.module.scss'


const MASTER_LINKS = [
  { to: '/routes', label: 'Route' },
  { to: '/bmcs', label: 'Dairy/CC/BMC' },
  { to: '/societies', label: 'Society' },
  { to: '/destinations', label: 'Destination' },
  { to: '/tankers', label: 'Tanker' },
]


const TRANSACTION_LINKS = [{ to: '/desandacks', label: 'DesAck' }]


const REPORT_LINKS = [
  { to: '/reports/bmc-wise-ack-list', label: '1.DesWiseAckRegister' },
  { to: '/reports/bmc-ack-reg-list', label: '2.Ack.Register1(Dairy)' },
  { to: '/reports/bmc-wise-ack-abs-list', label: '3.Total Litres(DMR 2)' },
  { to: '/reports/check-ack-list', label: '4.Check.List' },
  { to: '/reports/daily-ack-list', label: '5.BMCWiseAckReg(Daily Abstract)' },
  { to: '/reports/invoice-and-ack-list', label: '6.Tanker & Despatch Details' },
  { to: '/reports/honorarium-list', label: '7.Honorarium New' },
  { to: '/reports/confiscated-milk-list', label: '8.ConfiscatedMilk Details' },
  { to: '/reports/bmc-wise-inv-ack-ltr-list', label: '9.BMC Invoice & AckLitres' },
  { to: '/reports/bmc-ack-reg-dairy-list', label: '10.BMCWiseInvoice & AckLitres' },
  { to: '/reports/bmc-wise-inv-ack-diff-list', label: '11.Invoice & Ack Difference' },
  { to: '/reports/des-wise-tanker-list', label: '12.DesWiseTanker' },
  { to: '/reports/bmc-wise-tanker-list', label: '13.BmcWiseTanker' },
  { to: '/reports/bmc-wise-tanker-arvals-list', label: '14.BmcWiseTanker 2' },
  { to: '/reports/daily-des-wise-tanker', label: '15.DesWiseTanker(Daily abs)' },
  { to: '/reports/des-ack-abnormal-list', label: '16.Tanker Des & Ack Abnormal' },
  { to: '/reports/des-wise-bmc-tanker-list', label: '17.BmcWiseTanker 3' },
  { to: '/reports/day-wise-honorarium-list', label: '18.DayWiseHonorarium' },
]

export function Navbar() {
  const { userName, logout } = useAuth()
  const navigate = useNavigate()
  // Hover-based menus stay open after a click; hide the clicked one until the pointer leaves.
  const [closedMenu, setClosedMenu] = useState<string | null>(null)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className={styles.navbar}>
      <span className={styles.brand}>Dairy</span>

      <ul className={styles.navList}>
        <li className={styles.navItem} onMouseLeave={() => setClosedMenu(null)}>
          <span className={styles.navLink}>Master</span>
          <ul
            className={`${styles.dropdownMenu} ${closedMenu === 'Master' ? styles.closed : ''}`}
            onClick={() => setClosedMenu('Master')}
          >
            {MASTER_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </li>

        <li className={styles.navItem} onMouseLeave={() => setClosedMenu(null)}>
          <span className={styles.navLink}>Transaction</span>
          <ul
            className={`${styles.dropdownMenu} ${closedMenu === 'Transaction' ? styles.closed : ''}`}
            onClick={() => setClosedMenu('Transaction')}
          >
            {TRANSACTION_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </li>

        <li className={styles.navItem} onMouseLeave={() => setClosedMenu(null)}>
          <span className={styles.navLink}>Report</span>
          <ul
            className={`${styles.dropdownMenu} ${closedMenu === 'Report' ? styles.closed : ''}`}
            onClick={() => setClosedMenu('Report')}
          >
            {REPORT_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to}>{link.label}</NavLink>
              </li>
            ))}
          </ul>
        </li>
      </ul>

      <span className={styles.spacer} />

      {userName && (
        <div className={styles.userArea}>
          <span className={styles.userName}>Hello, {userName}!</span>
          <button type="button" className={styles.logout} onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
