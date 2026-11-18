import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader, HEADER_ACTION_SIZE } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { DataGrid } from '../../components/common/DataGrid'
import { useGetTankers } from '../../apiclient/master/use-get-tankers'
import { SubmitStatus } from '../../core/formik-drawer-component'
import { DeleteModelDialog, DeleteStatus, type DeletePostDataInfo } from '../../core/delete-model-dialog-component'
import Tanker from '../../models/masters/Tanker'
import TankerEntry from './TankerEntry'
import headerStyles from '../../components/common/PageHeader.module.scss'

export function TankerListPage() {
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: rows, refetch } = useGetTankers({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const [editingTanker, setEditingTanker] = useState<Tanker | null>(null)
  const [selectedTanker, setSelectedTanker] = useState<Tanker | null>(null)
  const [deleteTankerData, setDeleteTankerData] = useState<DeletePostDataInfo|null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filteredTankers, setFilteredTankers] = useState<Tanker[]>([])
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

      setFilteredTankers(filteredList || [])
    },
    [rows]
  )

  useEffect(() => {
    if (searchQueryRef.current) {
      handleSearch(searchQueryRef.current)
    } else {
      setFilteredTankers(rows || [])
    }
  }, [rows, handleSearch])

  const clearSearch = () => {
    searchQueryRef.current = ''
    setSearchValue('')
    setFilteredTankers(rows || [])
  }

  const onHandleAdd = () => setEditingTanker(new Tanker())
  const handleActionClick = (action: 'edit' | 'delete', row: Tanker) => {
    if (action === 'delete') {
      setSelectedTanker(row)
      setDeleteTankerData({ data: row, route: `/Tanker/DeleteTanker/${row.tankerId}` })
    } else {
      setEditingTanker(row)
    }
  }

  const handleDeleteClose = (status: DeleteStatus) => {
    setSelectedTanker(null)
    setDeleteTankerData(null)

    if (status === DeleteStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  const onSaveComplete = (status: SubmitStatus) => {
    setEditingTanker(null)

    if (status === SubmitStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  if (editingTanker) {
    return <TankerEntry tanker={editingTanker} fetchedTanker={rows || []} onClose={onSaveComplete} />
  }

  return (
    <div>
      <PageHeader
        title="Tanker List"
        action={
          <div className={headerStyles.actionGroup}>
            <input
              className={headerStyles.search}
              style={HEADER_ACTION_SIZE}
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Button large style={HEADER_ACTION_SIZE} onClick={onHandleAdd}>
              + New Tanker
            </Button>
          </div>
        }
      />
      <DataGrid
        columns={[
          { field: 'tankerNumber', title: 'Tanker Number' },
          { field: 'transportName', title: 'Transport Name' },
          { field: 'frontCapacity', title: 'Front Capacity' },
          { field: 'middleCapacity', title: 'Middle Capacity' },
          { field: 'rearCapacity', title: 'Rear Capacity' },
          { field: 'mobileNumber', title: 'Mobile' },
        ]}
        rows={filteredTankers}
        onEdit={(row) => handleActionClick('edit', row)}
        onDelete={(row) => handleActionClick('delete', row)}
        exportFileName="TankerList"
      />

      {deleteTankerData && selectedTanker && (
        <DeleteModelDialog title="Delete Tanker" deleteData={deleteTankerData} onClose={handleDeleteClose}>
          <div>
            Are you sure you want to delete tanker: <strong>{selectedTanker.tankerNumber}</strong>?
          </div>
        </DeleteModelDialog>
      )}
    </div>
  )
}
