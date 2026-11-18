import { useCallback, useEffect, useRef, useState } from 'react'
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
import { toDateInputValue, toDdMmYyyy } from '../../../core/date-utils'

const ACTION_SIZE = { height: 40, width: 320 }

export function DesAndAckListPage() {
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: rows, refetch } = useGetAcknowledgements({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const [editingDesAndAck, setEditingDesAndAck] = useState<DesAndAck | null>(null)
  const [selectedRow, setSelectedRow] = useState<Acknowledgement | null>(null)
  const [deleteDesAndAckData, setDeleteDesAndAckData] = useState<DeletePostDataInfo | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filteredRows, setFilteredRows] = useState<Acknowledgement[]>([])
  const searchQueryRef = useRef('')

  useEffect(() => {
    setShouldFetch(true)
  }, [])

  const handleSearch = useCallback(
    (searchTerm: string) => {
      searchQueryRef.current = searchTerm
      setSearchValue(searchTerm)

      const filteredList = rows?.filter((item) =>
        Object.values(item).some(
          (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )

      setFilteredRows(filteredList || [])
    },
    [rows]
  )

  useEffect(() => {
    if (searchQueryRef.current) {
      handleSearch(searchQueryRef.current)
    } else {
      setFilteredRows(rows || [])
    }
  }, [rows, handleSearch])

  const clearSearch = () => {
    searchQueryRef.current = ''
    setSearchValue('')
    setFilteredRows(rows || [])
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
          <div className={headerStyles.actionGroup}>
            <input
              className={headerStyles.search}
              style={ACTION_SIZE}
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Button large style={ACTION_SIZE} onClick={onHandleAdd}>
              + New Despatch &amp; Acknowledgement
            </Button>
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
