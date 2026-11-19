import { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/common/PageHeader'
import { Button } from '../../../components/common/Button'
import { DataGrid } from '../../../components/common/DataGrid'
import { useGetAcknowledgements } from '../../../apiclient/transaction/use-get-acknowledgements'
import { transactionApiClient } from '../../../api/httpClient'
import { SubmitStatus } from '../../../core/formik-drawer-component'
import { DeleteModelDialog, DeleteStatus, type DeletePostDataInfo } from '../../../core/delete-model-dialog-component'
import Acknowledgement from '../../../models/Transaction/Acknowledgement'
import DesAndAck from '../../../models/Transaction/DesAndAck'
import DesAndAckEntry from './DesAndAckEntry'
import headerStyles from '../../../components/common/PageHeader.module.scss'
import { formatLocalDate, toDateInputValue, toDdMmYyyy } from '../../../core/date-utils'

const ACTION_SIZE = { height: 40, width: 320 }
const SEARCH_WIDTH = 200

export function DesAndAckListPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date())
  // The list loads for today first, then only for the date that was applied with the Get button.
  const [despatchDate, setDespatchDate] = useState(() => formatLocalDate(new Date()))
  const { data: rows, refetch, isFetching } = useGetAcknowledgements({
    variables: { despatchDate },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const [editingDesAndAck, setEditingDesAndAck] = useState<DesAndAck | null>(null)
  const [selectedRow, setSelectedRow] = useState<Acknowledgement | null>(null)
  const [deleteDesAndAckData, setDeleteDesAndAckData] = useState<DeletePostDataInfo | null>(null)
  const [searchValue, setSearchValue] = useState('')

  const filteredRows = useMemo(() => {
    const term = searchValue.toLowerCase()
    if (!term) return rows || []

    return (rows || []).filter((item) =>
      Object.values(item).some((value) => value && value.toString().toLowerCase().includes(term))
    )
  }, [rows, searchValue])

  const handleSearch = (searchTerm: string) => setSearchValue(searchTerm)

  const clearSearch = () => setSearchValue('')

  const handleGet = () => {
    const date = formatLocalDate(selectedDate ?? new Date())
    if (date === despatchDate) {
      refetch()
    } else {
      setDespatchDate(date)
    }
  }

  // Back to the opening state: today's records, no search text, freshly loaded
  const handleRefresh = () => {
    const today = formatLocalDate(new Date())
    setSearchValue('')
    setSelectedDate(new Date())
    if (today === despatchDate) {
      refetch()
    } else {
      setDespatchDate(today)
    }
  }

  const onHandleAdd = () => setEditingDesAndAck(new DesAndAck())

  const handleActionClick = (action: 'edit' | 'delete', row: Acknowledgement) => {
    if (action === 'delete') {
      setSelectedRow(row)
      setDeleteDesAndAckData({
        data: row,
        route: `/DesAck/DesAckDelete/${row.despatchMainId}`,
        client: transactionApiClient,
      })
    } else {
      setEditingDesAndAck({ despatchMainId: row.despatchMainId } as DesAndAck)
    }
  }

  const handleDeleteClose = (status: DeleteStatus) => {
    setSelectedRow(null)
    setDeleteDesAndAckData(null)

    if (status === DeleteStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  const onSaveComplete = (status: SubmitStatus) => {
    setEditingDesAndAck(null)

    if (status === SubmitStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  if (editingDesAndAck) {
    return <DesAndAckEntry desAndAck={editingDesAndAck} fetchedDesAndAck={[]} onClose={onSaveComplete} />
  }

  return (
    <div>
      <PageHeader
        title="Despatch And Acknowledgement List"
        action={
          <div className={headerStyles.actionGroup} style={{ alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
            <div className={headerStyles.actionGroup} style={{ alignItems: 'flex-end' }}>
              <div>
                <label htmlFor="despatchDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                  Date
                </label>
                <DatePicker
                  id="despatchDate"
                  className={headerStyles.search}
                  customInput={<input style={{ height: ACTION_SIZE.height, boxSizing: 'border-box' }} />}
                  selected={selectedDate}
                  placeholderText="Select Date"
                  dateFormat="dd-MM-yyyy"
                  popperPlacement="bottom-start"
                  portalId="root-portal"
                  onChange={(value: Date | null) => setSelectedDate(value)}
                />
              </div>
              <Button large style={{ height: ACTION_SIZE.height }} onClick={handleGet}>
                Get
              </Button>
            </div>
            <div className={headerStyles.actionGroup} style={{ alignItems: 'flex-end' }}>
              <input
                className={headerStyles.search}
                style={{ ...ACTION_SIZE, width: SEARCH_WIDTH }}
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Button large style={ACTION_SIZE} onClick={onHandleAdd}>
                + New Despatch &amp; Acknowledgement
              </Button>
              <Button
                large
                type="button"
                title="Refresh"
                aria-label="Refresh"
                style={{ height: ACTION_SIZE.height, width: ACTION_SIZE.height, padding: 0 }}
                onClick={handleRefresh}
              >
                <RefreshCw size={18} className={isFetching ? headerStyles.spin : undefined} />
              </Button>
            </div>
          </div>
        }
      />
      <DataGrid
        columns={[
          { field: 'despatchDate', title: 'Date', format: (value) => toDdMmYyyy(toDateInputValue(value as string)) },
          { field: 'invoiceNumber', title: 'Invoice Number' },
          { field: 'fMbrt', title: 'FMBRT' },
          { field: 'mMbrt', title: 'MMBRT' },
          { field: 'rMbrt', title: 'RMBRT' },
        ]}
        rows={filteredRows}
        onEdit={(row) => handleActionClick('edit', row)}
        onDelete={(row) => handleActionClick('delete', row)}
        exportFileName="DesAndAckList"
        rowClassName={(row) => (row.isAck === true ? 'acknowledgement-ack-row' : '')}
      />

      {deleteDesAndAckData && selectedRow && (
        <DeleteModelDialog title="Delete Despatch And Acknowledgement" deleteData={deleteDesAndAckData} onClose={handleDeleteClose}>
          <div>
            Are you sure you want to delete: <strong>{selectedRow.invoiceNumber}</strong>?
          </div>
        </DeleteModelDialog>
      )}
    </div>
  )
}
