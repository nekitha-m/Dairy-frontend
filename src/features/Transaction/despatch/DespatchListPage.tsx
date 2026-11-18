import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../../../components/common/PageHeader'
import { Button } from '../../../components/common/Button'
import { DataGrid } from '../../../components/common/DataGrid'
import { useGetDespatches } from '../../../apiclient/transaction/use-get-despatches'
import { useGetAcknowledgements } from '../../../apiclient/transaction/use-get-acknowledgements'
import { transactionApiClient } from '../../../api/httpClient'
import { SubmitStatus } from '../../../core/formik-drawer-component'
import { DeleteModelDialog, DeleteStatus, type DeletePostDataInfo } from '../../../core/delete-model-dialog-component'
import Despatch from '../../../models/Transaction/Despatch'
import DespatchEntry from './DespatchEntry'
import headerStyles from '../../../components/common/PageHeader.module.scss'
import { toDateInputValue, toDdMmYyyy } from '../../../core/date-utils'

export function DespatchListPage() {
  const queryClient = useQueryClient()
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: rows, refetch } = useGetDespatches({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
  const { data: desArr, refetch: refetchAcknowledgements } = useGetAcknowledgements({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
  const [editingDespatch, setEditingDespatch] = useState<Despatch | null>(null)
  const [selectedDespatch, setSelectedDespatch] = useState<Despatch | null>(null)
  const [deleteDespatchData, setDeleteDespatchData] = useState<DeletePostDataInfo | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filteredDespatches, setFilteredDespatches] = useState<Despatch[]>([])
  const searchQueryRef = useRef('')

  useEffect(() => {
    setShouldFetch(true)
  }, [])

  const ackedDespatchMainIds = useMemo(
    () => new Set((desArr || []).filter((ack) => ack.isAck === true).map((ack) => ack.despatchMainId)),
    [desArr]
  )

  const despatchRows = useMemo(
    () => (rows || []).map((row) => ({ ...row, isAck: ackedDespatchMainIds.has(row.despatchMainId) })),
    [rows, ackedDespatchMainIds]
  )

  const handleSearch = useCallback(
    (searchTerm: string) => {
      searchQueryRef.current = searchTerm
      setSearchValue(searchTerm)

      const filteredList = despatchRows.filter((item) =>
        Object.values(item).some(
          (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )

      setFilteredDespatches(filteredList)
    },
    [despatchRows]
  )

  useEffect(() => {
    if (searchQueryRef.current) {
      handleSearch(searchQueryRef.current)
    } else {
      setFilteredDespatches(despatchRows)
    }
  }, [despatchRows, handleSearch])

  const clearSearch = () => {
    searchQueryRef.current = ''
    setSearchValue('')
    setFilteredDespatches(despatchRows)
  }
                                        
  const onHandleAdd = () => setEditingDespatch(new Despatch())

  const handleActionClick = (action: 'edit' | 'delete', row: Despatch) => {
    if (action === 'delete') {
      setSelectedDespatch(row)
      setDeleteDespatchData({
        data: row,
        route: `/DespatchMain/DeleteDespatch/${row.despatchMainId}`,
        client: transactionApiClient,
      })
    } else {
      setEditingDespatch(row)
    }
  }
  
  const handleDeleteClose = (status: DeleteStatus) => {
    setSelectedDespatch(null)
    setDeleteDespatchData(null)

    if (status === DeleteStatus.Completed) {
      queryClient.invalidateQueries({ queryKey: ['despatches'] })
      refetch()
      refetchAcknowledgements()
      clearSearch()
    }
  }

  const onSaveComplete = (status: SubmitStatus) => {
    setEditingDespatch(null)

    if (status === SubmitStatus.Completed) {
      queryClient.invalidateQueries({ queryKey: ['despatches'] })
      refetch()
      refetchAcknowledgements()
      clearSearch()
    }
  }

  if (editingDespatch) {
    return <DespatchEntry despatch={editingDespatch} fetchedDespatch={despatchRows} onClose={onSaveComplete} />
  }

  return (
    <div>
      <PageHeader
        title="Despatch List"
        action={
          <div className={headerStyles.actionGroup}>
            <input
              className={headerStyles.search}
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Button large onClick={onHandleAdd}>
              + New Despatch
            </Button>
          </div>
        }
      />
      <DataGrid
        columns={[
          { field: 'despatchDate', title: 'Date', format: (value) => toDdMmYyyy(toDateInputValue(value as string)) },
          { field: 'invoiceNumber', title: 'Invoice Number' },
          { field: 'driverName', title: 'Driver Name' },
        ]}
        rows={filteredDespatches}
        onEdit={(row) => handleActionClick('edit', row)}
        onDelete={(row) => handleActionClick('delete', row)}
        exportFileName="DespatchList"
        rowClassName={(row) => (row.isAck === true ? 'acknowledgement-ack-row' : '')}
      />

      {deleteDespatchData && selectedDespatch && (
        <DeleteModelDialog title="Delete Despatch" deleteData={deleteDespatchData} onClose={handleDeleteClose}>
          <div>
            Are you sure you want to delete despatch: <strong>{selectedDespatch.invoiceNumber}</strong>?
          </div>
        </DeleteModelDialog>
      )}
    </div>
  )
}
