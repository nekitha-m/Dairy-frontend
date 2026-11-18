import type { ReactNode } from 'react'
import styles from './PageHeader.module.scss'

interface PageHeaderProps {
  title: string
  action?: ReactNode
}
export const HEADER_ACTION_SIZE = { height: 40, width: 200 }
export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
