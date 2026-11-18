import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../../components/common/PageHeader'
import { Button } from '../../../components/common/Button'
import { DataGrid } from '../../../components/common/DataGrid'
import { useGetAcknowledgements } from '../../../apiclient/transaction/use-get-acknowledgements'
import { SubmitStatus } from '../../../core/formik-drawer-component'
import Acknowledgement from '../../../models/Transaction/Acknowledgement'
import AcknowledgementEntry from './AcknowledgementEntry'
import headerStyles from '../../../components/common/PageHeader.module.scss'
import { toDateInputValue, toDdMmYyyy } from '../../../core/date-utils'

export function AcknowledgementListPage() {
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: rows = [], refetch } = useGetAcknowledgements({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const [editingAcknowledgement, setEditingAcknowledgement] = useState<Acknowledgement | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filteredAcknowledgements, setFilteredAcknowledgements] = useState<Acknowledgement[]>([])
  const searchQueryRef = useRef('')

  
  useEffect(() => {
    setShouldFetch(true)
  }, [])

  const handleSearch = useCallback(
    (searchTerm: string) => {
      searchQueryRef.current = searchTerm
      setSearchValue(searchTerm)

      const search = searchTerm.toLowerCase()
      const filteredList = rows.filter((item) =>
        Object.values(item).some(
          (value) => value !== null && value !== null && value.toString().toLowerCase().includes(search)
        )
      )

      setFilteredAcknowledgements(filteredList)
    },
    [rows]
  )

  useEffect(() => {
    if (searchQueryRef.current) {
      handleSearch(searchQueryRef.current)
    } else {
      setFilteredAcknowledgements(rows)
    }
  }, [rows, handleSearch])

  const handleEdit = (row: Acknowledgement) => {
    if (row.acknowledgementMainId !== null) {
      setEditingAcknowledgement(row)
    }
  }

  const onSaveComplete = (status: SubmitStatus) => {
    setEditingAcknowledgement(null)

    if (status === SubmitStatus.Completed) {
      refetch()
      searchQueryRef.current = ''
      setSearchValue('')
    }
  }

  if (editingAcknowledgement) {
    return (
      <AcknowledgementEntry
        acknowledgement={editingAcknowledgement}
        fetchedAcknowledgement={rows}
        onClose={onSaveComplete}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Acknowledgement List"
        action={
          <div className={headerStyles.actionGroup}>
            <input
              className={headerStyles.search}
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <Button large onClick={() => setEditingAcknowledgement(new Acknowledgement())}>
              + New Acknowledgement
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
        rows={filteredAcknowledgements}
        onEdit={handleEdit}
        exportFileName="AcknowledgementList"
        rowClassName={(row) => (row.isAck === true ? 'acknowledgement-ack-row' : '')}
      />
    </div>
  )
}
