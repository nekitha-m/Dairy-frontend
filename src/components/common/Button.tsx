import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.scss'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  small?: boolean
  large?: boolean
}

export function Button({ variant = 'primary', small, large, className, ...rest }: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    small ? styles.small : '',
    large ? styles.large : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} {...rest} />
}
