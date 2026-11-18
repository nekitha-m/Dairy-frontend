import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader, HEADER_ACTION_SIZE } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { DataGrid } from '../../components/common/DataGrid'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import { SubmitStatus } from '../../core/formik-drawer-component'
import { DeleteModelDialog, DeleteStatus, type DeletePostDataInfo } from '../../core/delete-model-dialog-component'
import Destination from '../../models/masters/Destination'
import DestinationEntry from './DestinationEntry'
import headerStyles from '../../components/common/PageHeader.module.scss'

export function DestinationListPage() {
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: rows, refetch } = useGetDestinations({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null)
  const [deleteDestinationData, setDeleteDestinationData] = useState<DeletePostDataInfo|null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([])
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

      setFilteredDestinations(filteredList || [])
    },
    [rows]
  )

  useEffect(() => {
    if (searchQueryRef.current) {
      handleSearch(searchQueryRef.current)
    } else {
      setFilteredDestinations(rows || [])
    }
  }, [rows, handleSearch])

  const clearSearch = () => {
    searchQueryRef.current = ''
    setSearchValue('')
    setFilteredDestinations(rows || [])
  }

  const onHandleAdd = () => setEditingDestination(new Destination())

  const handleActionClick = (action: 'edit' | 'delete', row: Destination) => {
    if (action === 'delete') {
      setSelectedDestination(row)
      setDeleteDestinationData({ data: row, route: `/Destination/DeleteDestination/${row.destinationId}` })
    } else {
      setEditingDestination(row)
    }
  }

  const handleDeleteClose = (status: DeleteStatus) => {
    setSelectedDestination(null)
    setDeleteDestinationData(null)

    if (status === DeleteStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  const onSaveComplete = (status: SubmitStatus) => {
    setEditingDestination(null)

    if (status === SubmitStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  if (editingDestination) {
    return (
      <DestinationEntry destination={editingDestination} fetchedDestination={rows || []} onClose={onSaveComplete} />
    )
  }

  return (
    <div>
      <PageHeader
        title="Destination List"
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
              + New Destination
            </Button>
          </div>
        }
      />
      <DataGrid
        columns={[
          { field: 'name', title: 'Name' },
          { field: 'shortName', title: 'Short Name' },
          { field: 'city', title: 'City' },
          { field: 'mobileNumber', title: 'Mobile' },
        ]}
        rows={filteredDestinations}
        onEdit={(row) => handleActionClick('edit', row)}
        onDelete={(row) => handleActionClick('delete', row)}
        exportFileName="DestinationList"
      />

      {deleteDestinationData && selectedDestination && (
        <DeleteModelDialog title="Delete Destination" deleteData={deleteDestinationData} onClose={handleDeleteClose}>
          <div>
            Are you sure you want to delete destination: <strong>{selectedDestination.name}</strong>?
          </div>
        </DeleteModelDialog>
      )}
    </div>
  )
}
