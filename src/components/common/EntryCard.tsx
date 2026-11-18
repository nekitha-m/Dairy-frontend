import type { ReactNode, FormEvent } from 'react'
import styles from './EntryCard.module.scss'

interface EntryCardProps {
  children: ReactNode
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  wide?: boolean
  message?: string | null
  grid?: boolean
  maxWidth?: number
}


export function EntryCard({ children, onSubmit, wide, message, grid, maxWidth }: EntryCardProps) {
  return (
    <div className={styles.wrap}>
      <form
        className={`${styles.card} ${wide ? styles.wide : ''}`}
        style={maxWidth ? { maxWidth } : {}}
        onSubmit={onSubmit}
      >
        {message && <div className={styles.message}>{message}</div>}
        <div className={grid ? styles.grid : ''}>{children}</div>
      </form>
    </div>
  )
}
