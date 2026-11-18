import * as Yup from 'yup'
import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { InputField } from '../../components/form/input-field.component'
import {SelectField,type SelectFieldOption} from '../../core/select-field-component'
import {FormikModel,SubmitStatus} from '../../core/formik-drawer-component'
import { useGetRoutes } from '../../apiclient/master/use-get-routes'
import { useGetSocieties } from '../../apiclient/master/use-get-societies'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type Bmc from '../../models/masters/Bmc'

interface BmcEditProps {
  bmc: Bmc
  fetchedBmc: Bmc[]
  onClose?: (status: SubmitStatus, data?: any) => any
}

const BmcEntry: React.FC<BmcEditProps> = ({ bmc, fetchedBmc, onClose }) => {
  const title = (bmc?.bmcId || 0) > 0 ? 'Edit Bmc' : 'Add Bmc'
  const [initialData, setInitialData] = useState<any>()
  const { data: bmcData } = useGetBmcs()
  const existingBmcs: Bmc[] =
    fetchedBmc?.length > 0
      ? fetchedBmc
      : bmcData || []

  const [routeData, setRouteData] = useState<SelectFieldOption[]>([])
  const { data: fetchedRoutes } = useGetRoutes()
  const [societyData, setSocietyData] = useState<SelectFieldOption[]>([])
  const { data: fetchedSocieties } = useGetSocieties()

  useEffect(() => {
    if (bmc) {
      setInitialData({
        bmcId: bmc?.bmcId || 0,
        code: bmc?.code || '',
        name: bmc?.name || '',
        mobileNumber1: bmc?.mobileNumber1 || '',
        mobileNumber2: bmc?.mobileNumber2 || '',
        routeId: bmc?.routeId || 0,
        societyId: bmc?.societyId || 0,
      })
    }
  }, [bmc])


  const validationSchema = Yup.object().shape({
    code: Yup.string().required('Code is required'),
    name: Yup.string().required('Name is required')
      .trim()
      .test(
        'check-duplicate-name',
        'Name already exists',
        function (value) {
          if (!value || !Array.isArray(existingBmcs)) {
            return true
          }

          const currentBmcId = bmc?.bmcId || 0
          const enteredName = value.trim().toLowerCase()
          const isDuplicate = existingBmcs
            .filter(
              (row: Bmc) => row.bmcId !== currentBmcId
            )
            .some(
              (row: Bmc) =>
                row.name?.trim().toLowerCase() === enteredName
            )

          return !isDuplicate
        }
      ),
  })

  useEffect(() => {
    if (fetchedRoutes) {
      const mappedRoutes = fetchedRoutes.map((route: any) => ({
        value: route.routeId,
        label: route.name,
      }))

      setRouteData(mappedRoutes)
    }

    if (fetchedSocieties) {
      const mappedSocieties = fetchedSocieties.map((society: any) => ({
        value: society.societyId,
        label: society.name,
      }))

      setSocietyData(mappedSocieties)
    }
  }, [fetchedRoutes, fetchedSocieties])

  const firstInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [initialData])

  if (!initialData) return null

  return (
    <>
      <PageHeader title={title} />

      <FormikModel<Bmc>
        initialData={initialData}
        validationSchema={validationSchema}
        isUpDateEntityDetails={(bmc?.bmcId || 0) > 0}
        wide
        insertRoute="/Bmc/InsertBmc"
        updateRoute="/Bmc/UpdateBmc"
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
            <SelectField
              label="Route"
              name="routeId"
              options={routeData}
            />
          </div>

          <div className="col-6 col-md-4">
            <SelectField
              label="Society"
              name="societyId"
              options={societyData}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="MobileNumber1"
              name="mobileNumber1"
              maxLength={10}
              sanitize={(v) => v.replace(/\D/g, '')}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="MobileNumber2"
              name="mobileNumber2"
              maxLength={10}
              sanitize={(v) => v.replace(/\D/g, '')}
            />
          </div>
        </div>
      </FormikModel>
    </>
  )
}
export default BmcEntry

