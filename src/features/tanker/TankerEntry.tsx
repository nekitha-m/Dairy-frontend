import * as Yup from 'yup'
import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { InputField } from '../../components/form/input-field.component'
import { SelectField } from '../../core/select-field-component'
import {FormikModel,SubmitStatus} from '../../core/formik-drawer-component'
import { TANKER_TYPES } from '../../models/masters/Tanker'
import type Tanker from '../../models/masters/Tanker'
import { useGetTankers } from '../../apiclient/master/use-get-tankers'

interface TankerEditProps {
  tanker: Tanker
  fetchedTanker: Tanker[]
  onClose?: (status: SubmitStatus, data?: any) => any
}

const TankerEntry: React.FC<TankerEditProps> = ({tanker,fetchedTanker,onClose,}) => {
  const title =(tanker?.tankerId || 0) > 0
      ? 'Edit Tanker'
      : 'Add Tanker'

  const [initialData, setInitialData] = useState<any>()
  const { data: tankerData } = useGetTankers()


  const existingTankers: Tanker[] =
    fetchedTanker?.length > 0
      ? fetchedTanker
      : tankerData || []

  useEffect(() => {
    if (tanker) {
      setInitialData({
        tankerId: tanker?.tankerId || 0,
        tankerNumber: tanker?.tankerNumber || '',
        transportName: tanker?.transportName || '',
        frontCapacity: tanker?.frontCapacity || '',
        middleCapacity: tanker?.middleCapacity || '',
        rearCapacity: tanker?.rearCapacity || '',
        mobileNumber: tanker?.mobileNumber || '',
        tankerTypeId: tanker?.tankerTypeId || 0,
      })
    }
  }, [tanker])

  /*
   * Store existing tanker numbers
   */
  /* useEffect(() => {
    if (
      existingTankers &&
      Array.isArray(existingTankers)
    ) {
      setExistingTankerNumber(
        existingTankers.map(
          (row) => row.tankerNumber
        )
      )
    }
  }, [existingTankers])
 */
  
  const validationSchema = Yup.object().shape({
    tankerNumber: Yup.string()
      .required('Tanker Number is required')
      .trim()
      .test(
        'check-duplicate-tankernumber',
        'Tanker Number already exists',
        function (value) {
          if (!value || !existingTankers) {
            return true
          }

          const currentTankerId =
            tanker?.tankerId || 0

          const isDuplicate = existingTankers
            .filter(
              (row) =>
                row.tankerId !== currentTankerId
            )
            .some(
              (row) =>
                row.tankerNumber
                  ?.trim()
                  .toLowerCase() ===
                value
                  .trim()
                  .toLowerCase()
            )

          return !isDuplicate
        }
      ),
  })

  const firstInputRef =
    useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [initialData])

  if (!initialData) {
    return null
  }

  return (
    <>
      <PageHeader title={title} />

      <FormikModel<Tanker>
        initialData={initialData}
        validationSchema={validationSchema}
        isUpDateEntityDetails={
          (tanker?.tankerId || 0) > 0
        }
        wide
        insertRoute="/Tanker/InsertTanker"
        updateRoute="/Tanker/UpdateTanker"
        onClose={(status) =>
          onClose?.(status)
        }
      >
        <div className="row g-3">

          {/* Tanker Number */}
          <div className="col-6 col-md-4">
            <InputField
              label="Tanker Number"
              name="tankerNumber"
              maxLength={10}
              required
              inputRef={firstInputRef}
            />
          </div>

          
          <div className="col-6 col-md-4">
            <InputField
              label="Transport Name"
              name="transportName"
              maxLength={30}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="Front Capacity"
              name="frontCapacity"
              maxLength={5}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="Middle Capacity"
              name="middleCapacity"
              maxLength={5}
            />
          </div>

        
          <div className="col-6 col-md-4">
            <InputField
              label="Rear Capacity"
              name="rearCapacity"
              maxLength={5}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="Mobile Number"
              name="mobileNumber"
              maxLength={10}
              sanitize={(v) =>
                v.replace(/\D/g, '')
              }
            />
          </div>

      
          <div className="col-6 col-md-4">
            <SelectField
              label="Tanker Type"
              name="tankerTypeId"
              options={TANKER_TYPES}
            />
          </div>

        </div>
      </FormikModel>
    </>
  )
}

export default TankerEntry