import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader, HEADER_ACTION_SIZE } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { DataGrid } from '../../components/common/DataGrid'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import { SubmitStatus } from '../../core/formik-drawer-component'
import { DeleteModelDialog, DeleteStatus, type DeletePostDataInfo } from '../../core/delete-model-dialog-component'
import Bmc from '../../models/masters/Bmc'
import BmcEntry from './BmcEntry'
import headerStyles from '../../components/common/PageHeader.module.scss'

export function BmcListPage() {
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: bmc, refetch } = useGetBmcs({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const [editingBmc, setEditingBmc] = useState<Bmc | null>(null)
  const [selectedBmc, setSelectedBmc] = useState<Bmc | null>(null)
const [deleteBmcData, setDeleteBmcData] =
  useState<DeletePostDataInfo | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filteredBmcs, setFilteredBmcs] = useState<Bmc[]>([])
  const searchQueryRef = useRef('')

  useEffect(() => {
    setShouldFetch(true)
  }, [])

  const handleSearch = useCallback(
    (searchTerm: string) => {
      searchQueryRef.current = searchTerm
      setSearchValue(searchTerm)

      const filteredList = bmc?.filter((item) =>
        Object.values(item).some(
          (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )

      setFilteredBmcs(filteredList || [])
    },
    [bmc]
  )

  useEffect(() => {
    if (searchQueryRef.current) {
      handleSearch(searchQueryRef.current)
    } else {
      setFilteredBmcs(bmc || [])
    }
  }, [bmc, handleSearch])

  const clearSearch = () => {
    searchQueryRef.current = ''
    setSearchValue('')
    setFilteredBmcs(bmc || [])
  }

  const onHandleAdd = () => setEditingBmc(new Bmc())

  const handleActionClick = (action: 'edit' | 'delete', row: Bmc) => {
    if (action === 'delete') {
      setSelectedBmc(row)
      setDeleteBmcData({ data: row, route: `/Bmc/DeleteBmc/${row.bmcId}` })
    } else {
      setEditingBmc(row)
    }
  }

  const handleDeleteClose = (status: DeleteStatus) => {
    setSelectedBmc(null)
    setDeleteBmcData(null)

    if (status === DeleteStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  const onSaveComplete = (status: SubmitStatus) => {
    setEditingBmc(null)

    if (status === SubmitStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

 if (editingBmc) {
  return (
    <BmcEntry
      bmc={editingBmc}
      fetchedBmc={bmc || []}
      onClose={onSaveComplete}
    />
  )
}
  return (
    <div>
      <PageHeader
        title="Dairy / CC / BMC List"
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
              + New BMC
            </Button>
          </div>
        }
      />
      <DataGrid
        columns={[
          { field: 'code', title: 'Code' },
          { field: 'name', title: 'Name' },
          { field: 'mobileNumber1', title: 'Mobile 1' },
          { field: 'mobileNumber2', title: 'Mobile 2' },
        ]}
        rows={filteredBmcs}
        onEdit={(row) => handleActionClick('edit', row)}
        onDelete={(row) => handleActionClick('delete', row)}
        exportFileName="BMCList"
      />

      {deleteBmcData && selectedBmc && (
        <DeleteModelDialog title="Delete BMC" deleteData={deleteBmcData} onClose={handleDeleteClose}>
          <div>
            Are you sure you want to delete BMC: <strong>{selectedBmc.name}</strong>?
          </div>
        </DeleteModelDialog>
      )}
    </div>
  )
}
