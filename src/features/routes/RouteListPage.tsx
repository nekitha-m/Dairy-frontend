import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHeader, HEADER_ACTION_SIZE } from '../../components/common/PageHeader'
import { Button } from '../../components/common/Button'
import { DataGrid } from '../../components/common/DataGrid'
import { useGetRoutes } from '../../apiclient/master/use-get-routes'
import { SubmitStatus } from '../../core/formik-drawer-component'
import { DeleteModelDialog, DeleteStatus, type DeletePostDataInfo } from '../../core/delete-model-dialog-component'
import Route from '../../models/masters/Route'
import RouteEntry from './RouteEntry'
import headerStyles from '../../components/common/PageHeader.module.scss'

export function RouteListPage() {
  const [shouldFetch, setShouldFetch] = useState(false)
  const { data: rows, refetch } = useGetRoutes({
    enabled: shouldFetch,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [deleteRouteData, setDeleteRouteData] = useState<DeletePostDataInfo|null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([])
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

      setFilteredRoutes(filteredList || [])
    },
    [rows]
  )

  useEffect(() => {
    if (searchQueryRef.current) {
      handleSearch(searchQueryRef.current)
    } else {
      setFilteredRoutes(rows || [])
    }
  }, [rows, handleSearch])

  const clearSearch = () => {
    searchQueryRef.current = ''
    setSearchValue('')
    setFilteredRoutes(rows || [])
  }

  const onHandleAdd = () => setEditingRoute(new Route())

  const handleActionClick = (action: 'edit' | 'delete', row: Route) => {
    if (action === 'delete') {
      setSelectedRoute(row)
      setDeleteRouteData({ data: row, route: `/Route/DeleteRoute/${row.routeId}` })
    } else {
      setEditingRoute(row)
    }
  }

  const handleDeleteClose = (status: DeleteStatus) => {
    setSelectedRoute(null)
    setDeleteRouteData(null)

    if (status === DeleteStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  const onSaveComplete = (status: SubmitStatus) => {
    setEditingRoute(null)

    if (status === SubmitStatus.Completed) {
      refetch()
      clearSearch()
    }
  }

  if (editingRoute) {
    return <RouteEntry route={editingRoute} fetchedRoute={rows || []} onClose={onSaveComplete} />
  }

  return (
    <div>
      <PageHeader
        title="Route List"
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
              + New Route
            </Button>
          </div>
        }
      />
      <DataGrid
        columns={[
          { field: 'code', title: 'Code' },
          { field: 'name', title: 'Name' },
          { field: 'noofBMC', title: 'No Of BMC' },
        ]}
        rows={filteredRoutes}
        onEdit={(row) => handleActionClick('edit', row)}
        onDelete={(row) => handleActionClick('delete', row)}
        exportFileName="RouteList"
      />

      {deleteRouteData && selectedRoute && (
        <DeleteModelDialog title="Delete Route" deleteData={deleteRouteData} onClose={handleDeleteClose}>
          <div>
            Are you sure you want to delete route: <strong>{selectedRoute.name}</strong>?
          </div>
        </DeleteModelDialog>
      )}
    </div>
  )
}
