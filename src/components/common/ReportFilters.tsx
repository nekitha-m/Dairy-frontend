import { useState } from 'react'
import { Button } from './Button'
import type Bmc from '../../models/masters/Bmc'
import type Destination from '../../models/masters/Destination'
import entryStyles from './EntryCard.module.scss'
import styles from './ReportFilters.module.scss'
import { formatLocalDate } from '../../core/date-utils'

export interface ReportFiltersResult {
  fromDate: string
  toDate: string
  bmcId?: number
  bmcName?: string
  destinationId?: number
}

interface ReportFiltersProps {
  dateMode: 'range' | 'single'
  filterType: 'bmc' | 'destination' | 'bmcByName' | 'none'
  bmcs?: Bmc[]
  destinations?: Destination[]
  onGenerate: (result: ReportFiltersResult) => void
}

const today = () => formatLocalDate(new Date())


export function ReportFilters({ dateMode, filterType, bmcs = [], destinations = [], onGenerate }: ReportFiltersProps) {
  const [fromDate, setFromDate] = useState(today())
  const [toDate, setToDate] = useState(today())
  const [bmcId, setBmcId] = useState(0)
  const [bmcName, setBmcName] = useState('0')
  const [destinationId, setDestinationId] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = () => {
    if (!fromDate || (dateMode === 'range' && !toDate)) {
      setError('Please select date')
      return
    }
    if (dateMode === 'range' && fromDate > toDate) {
      setError('From date cannot be greater than To date')
      return
    }

    setError(null)
    onGenerate({
      fromDate,
      toDate: dateMode === 'single' ? fromDate : toDate,
      bmcId: filterType === 'bmc' ? bmcId : 0,
      bmcName: filterType === 'bmcByName' ? bmcName : '',
      destinationId: filterType === 'destination' ? destinationId : 0,
    })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={entryStyles.field}>
          <label htmlFor="fromDate">{dateMode === 'range' ? 'From Date' : 'Date'}</label>
          <input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>

        {dateMode === 'range' && (
          <div className={entryStyles.field}>
            <label htmlFor="toDate">To Date</label>
            <input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        )}

        {filterType === 'bmc' && (
          <div className={entryStyles.field}>
            <label htmlFor="bmcId">BMC</label>
            <select id="bmcId" value={bmcId} onChange={(e) => setBmcId(Number(e.target.value))}>
              <option value={0}>-All-</option>
              {bmcs.map((b) => (
                <option key={b.bmcId} value={b.bmcId}>
                  {b.code}-{b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === 'bmcByName' && (
          <div className={entryStyles.field}>
            <label htmlFor="bmcName">BMC</label>
            <select id="bmcName" value={bmcName} onChange={(e) => setBmcName(e.target.value)}>
              <option value="0">-All-</option>
              {bmcs.map((b) => (
                <option key={b.bmcId} value={b.name}>
                  {b.code}-{b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === 'destination' && (
          <div className={entryStyles.field}>
            <label htmlFor="destinationId">Destination</label>
            <select id="destinationId" value={destinationId} onChange={(e) => setDestinationId(Number(e.target.value))}>
              <option value={0}>-All-</option>
              {destinations.map((d) => (
                <option key={d.destinationId} value={d.destinationId}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button large onClick={handleGenerate}>
          Generate
        </Button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
}
