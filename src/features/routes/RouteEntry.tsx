
import * as Yup from 'yup'
import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { InputField } from '../../components/form/input-field.component'
import { useGetRoutes } from '../../apiclient/master/use-get-routes'
import { FormikModel, SubmitStatus } from '../../core/formik-drawer-component'
import type Route from '../../models/masters/Route'

interface RouteEditProps {
  route: Route
  fetchedRoute: Route[]
  onClose?: (status: SubmitStatus, data?: any) => any
}

const RouteEntry: React.FC<RouteEditProps> = ({
  route,
  fetchedRoute,
  onClose,
}) => {
  const title =
    (route?.routeId || 0) > 0 ? 'Edit Route' : 'Add Route'

  const [initialData, setInitialData] = useState<any>()

  const { data: routeData } = useGetRoutes()

  const existingRoutes: Route[] =
    fetchedRoute?.length > 0
      ? fetchedRoute
      : routeData || []

  useEffect(() => {
    if (route) {
      setInitialData({
        routeId: route?.routeId || 0,
        code: route?.code || '',
        name: route?.name || '',
        // Blank for a new route; only an existing route shows its saved count
        noofBMC: route?.noofBMC ?? '',
      })
    }
  }, [route])

  const validationSchema = Yup.object().shape({
    code: Yup.string()
      .required('Code is required'),

    name: Yup.string()
      .required('Name is required')
      .trim()
      .test(
        'check-duplicate-name',
        'Name already exists',
        function (value) {
          if (!value || !Array.isArray(existingRoutes)) {
            return true
          }

          const currentRouteId = route?.routeId || 0

          const enteredName = value.trim().toLowerCase()

          const isDuplicate = existingRoutes
            .filter(
              (row: Route) =>
                row.routeId !== currentRouteId
            )
            .some(
              (row: Route) =>
                row.name?.trim().toLowerCase() === enteredName
            )

          return !isDuplicate
        }
      ),

    noofBMC: Yup.number()
      .transform((value, original) => (original === '' ? undefined : value))
      .typeError('No Of BMC must be a number')
      .required('No Of BMC is required')
      .integer('No Of BMC must be a whole number')
      .min(0)
      .max(9999, 'No Of BMC cannot be more than 4 digits'),
  })

  const firstInputRef =
    useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [initialData])

  if (!initialData) return null

  return (
    <>
      <PageHeader title={title} />

      <FormikModel<Route>
        initialData={initialData}
        validationSchema={validationSchema}
        isUpDateEntityDetails={
          (route?.routeId || 0) > 0
        }
        wide
        insertRoute="/Route/InsertRoute"
        updateRoute="/Route/UpdateRoute"
        onClose={(status) => onClose?.(status)}
      >
        <div className="row g-3">
          <div className="col-6 col-md-4">
            <InputField
              label="Code"
              name="code"
              maxLength={3}
              required
              inputRef={firstInputRef}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="Name"
              name="name"
              maxLength={30}
              required
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="No Of BMC"
              name="noofBMC"
              maxLength={4}
              asNumber
              required
            />
          </div>

        </div>
      </FormikModel>
    </>
  )
}

export default RouteEntry

