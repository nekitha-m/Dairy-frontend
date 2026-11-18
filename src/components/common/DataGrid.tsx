import { useEffect, useState, type HTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { Grid, GridCellProps, GridColumn, GridDataStateChangeEvent, GridRowProps } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import '@progress/kendo-theme-default/dist/all.css'
import styles from './DataGrid.module.scss'


const EditIcon = FiEdit2 as unknown as (props: { size?: number }) => ReactElement
const DeleteIcon = FiTrash2 as unknown as (props: { size?: number }) => ReactElement


interface CustomRowProps extends GridRowProps {
  trProps?: HTMLAttributes<HTMLTableRowElement> | null
  children?: ReactNode
}


export interface DataGridColumn<T> {
   field: keyof T & string
  title: string
  width?: number
  hidden?: boolean
  total?: boolean
  format?: (value: T[keyof T], row: T) => string
}

interface DataGridProps<T> {
  columns: DataGridColumn<T>[]
  rows: T[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  rowClassName?: (row: T) => string
  exportFileName?: string
}


export function DataGrid<T extends object>({
   columns,
  rows,
  onEdit,
  onDelete,
  rowClassName,
  exportFileName,
}: DataGridProps<T>) {
  const [dataState, setDataState] = useState<State>({ skip: 0, take: 10 })

  useEffect(() => {
    setDataState((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }))
  }, [rows.length])

  const result = process(rows, dataState)
  const hasTotals = columns.some((col) => col.total)

  function ActionsCell(props: GridCellProps) {
    const row = props.dataItem as T
    return (
      <td className={styles.actionsCell}>
        {onEdit && (
          <button type="button" className={styles.iconButton} title="Edit" aria-label="Edit" onClick={() => onEdit(row)}>
            <EditIcon size={16} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className={`${styles.iconButton} ${styles.iconButtonDanger}`}
            title="Delete"
            aria-label="Delete"
            onClick={() => onDelete(row)}
          >
            <DeleteIcon size={16} />
          </button>
        )}
      </td>
    )
  }

  return (
    <div className={styles.wrapper}>
      {exportFileName && (
        <div className={styles.toolbar}>
          <div className={styles.exportButtons}>
            <button
              type="button"
              className={styles.actionLink}
              onClick={() => exportRowsToExcel(rows, columns, `${exportFileName}.xlsx`)}
            >
              Export Excel
            </button>
            <button
              type="button"
              className={styles.actionLink}
              onClick={() => exportRowsToPdf(rows, columns, `${exportFileName}.pdf`)}
            >
              Export PDF
            </button>
          </div>
        </div>
      )}

     <Grid
  data={result}
  {...dataState}
  onDataStateChange={(e: GridDataStateChangeEvent) =>
    setDataState(e.dataState)
  }
  sortable
  pageable={{
    buttonCount: 5,
    pageSizes: [10, 20, 50],
    info: true,
  }}
  resizable
  className={styles.grid}
>
        {columns.map((col, index) => {
          const showTotalLabel = hasTotals && index === 0 && !col.total
          return (
            <GridColumn
              key={col.field}
              field={col.field}
              title={col.title}
              width={col.width}
              cells={
                col.total
                  ? {
                      footerCell: () => {
                        const total = rows.reduce((sum, row) => sum + (Number(row[col.field]) || 0), 0)
                        return (
                          <td style={{ fontWeight: 600, textAlign: 'right' }}>
                            {total.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                          </td>
                        )
                      },
                    }
                  : showTotalLabel
                  ? { footerCell: () => <td style={{ fontWeight: 600 }}>Total</td> }
                  : col.format
                  ? {
                      data: (props: GridCellProps) => {
                        const row = props.dataItem as T
                        return <td>{col.format!(row[col.field], row)}</td>
                      },
                    }
                  : {}
              }
            />
          )
        })}
        {(onEdit || onDelete) && (
          <GridColumn title="Actions" width={100} sortable={false} filterable={false} cells={{ data: ActionsCell }} />
        )}
      </Grid>
    </div>
  )
}

export function exportRowsToExcel<T>(rows: T[], columns: DataGridColumn<T>[], filename: string) {
  if (rows.length === 0) return
  const data = rows.map((row) => {
    const record: Record<string, unknown> = {}
    columns.forEach((col) => {
      record[col.title] = col.format ? col.format(row[col.field], row) : row[col.field] ?? ''
    })
    return record
  })
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  XLSX.writeFile(workbook, filename)
}

export function exportRowsToPdf<T>(rows: T[], columns: DataGridColumn<T>[], filename: string) {
  if (rows.length === 0) return
  const doc = new jsPDF()
  autoTable(doc, {
    head: [columns.map((col) => col.title)],
    body: rows.map((row) => columns.map((col) => String(col.format ? col.format(row[col.field], row) : row[col.field] ?? ''))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [47, 133, 196] },
  })
  const blob = doc.output('blob')
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
