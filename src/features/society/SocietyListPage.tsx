import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader, HEADER_ACTION_SIZE } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { DataGrid } from '../../components/common/DataGrid'
import { useGetSocieties } from '../../apiclient/master/use-get-societies'
import { SubmitStatus } from '../../core/formik-drawer-component'
import { DeleteModelDialog, DeleteStatus, type DeletePostDataInfo } from '../../core/delete-model-dialog-component'
import Society from '../../models/masters/Society'
import SocietyEntry from './SocietyEntry'
import headerStyles from '../../components/common/PageHeader.module.scss'

export function SocietyListPage() {
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: rows, refetch } = useGetSocieties({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const [editingSociety, setEditingSociety] = useState<Society | null>(null)
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null)
  const [deleteSocietyData, setDeleteSocietyData] = useState<DeletePostDataInfo|null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filteredSocieties, setFilteredSocieties] = useState<Society[]>([])
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

      setFilteredSocieties(filteredList || [])
    },
    [rows]
  )

  useEffect(() => {
    if (searchQueryRef.current) {
      handleSearch(searchQueryRef.current)
    } else {
      setFilteredSocieties(rows || [])
    }
  }, [rows, handleSearch])

  const clearSearch = () => {
    searchQueryRef.current = ''
    setSearchValue('')
    setFilteredSocieties(rows || [])
  }

  const onHandleAdd = () => setEditingSociety(new Society())
  const handleActionClick = (action: 'edit' | 'delete', row: Society) => {
    if (action === 'delete') {
      setSelectedSociety(row)
      setDeleteSocietyData({ data: row, route: `/Society/DeleteSociety/${row.societyId}` })
    } else {
      setEditingSociety(row)
    }
  }

  const handleDeleteClose = (status: DeleteStatus) => {
    setSelectedSociety(null)
    setDeleteSocietyData(null)

    if (status === DeleteStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  const onSaveComplete = (status: SubmitStatus) => {
    setEditingSociety(null)

    if (status === SubmitStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  if (editingSociety) {
    return <SocietyEntry society={editingSociety} fetchedSociety={rows || []} onClose={onSaveComplete} />
  }

  return (
    <div>
      <PageHeader
        title="Society List"
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
              + New Society
            </Button>
          </div>
        }
      />
      <DataGrid
        columns={[
          { field: 'code', title: 'SocietyCode' },
          { field: 'name', title: 'SocietyName' },
          { field: 'secretaryName', title: 'Secretary' },
          { field: 'mobileNumber', title: 'Mobile' },
        ]}
        
        rows={filteredSocieties}
        onEdit={(row) => handleActionClick('edit', row)}
        onDelete={(row) => handleActionClick('delete', row)}
        exportFileName="SocietyList"
      />

      {deleteSocietyData && selectedSociety && (
        <DeleteModelDialog title="Delete Society" deleteData={deleteSocietyData} onClose={handleDeleteClose}>
          <div>
            Are you sure you want to delete society: <strong>{selectedSociety.name}</strong>?
          </div>
        </DeleteModelDialog>
      )}
    </div>
  )
}
