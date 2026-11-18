import type { ReactNode } from 'react'

interface PdfPageHeaderProps {
  title: string
  subtitle?: ReactNode
  organization?: string
  titleSize?: number
  subtitleSize?: number
  top?: number
}

export const PDF_ORGANIZATION_NAME = 'THE TIRUPUR DISTRICT CO-OP MILK PRODUCERS UNION LTD'
export const PDF_HEADER_MARGIN = { top: '1.9cm', left: '0.5cm', right: '0.5cm', bottom: '0.10cm' }

export function PdfPageHeader({
  title,
  subtitle,
  organization = PDF_ORGANIZATION_NAME,
  titleSize = 16,
  subtitleSize = 13,
  top = 45,
}: PdfPageHeaderProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontWeight: 'bold',
        lineHeight: 1.25,
      }}
    >
      <div style={{ fontSize: `${titleSize}px` }}>{title}</div>
      <div style={{ fontSize: `${titleSize}px` }}>{organization}</div>
      {subtitle && <div style={{ fontSize: `${subtitleSize}px` }}>{subtitle}</div>}
    </div>
  )
}
