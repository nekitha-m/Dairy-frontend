import * as Yup from 'yup'
import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { InputField } from '../../components/form/input-field.component'
import {FormikModel,SubmitStatus,} from '../../core/formik-drawer-component'
import { SwitchField } from '../../components/common/switch-field-component'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type Destination from '../../models/masters/Destination'

interface DestinationEditProps {
  destination: Destination
  fetchedDestination: Destination[]
  onClose?: (status: SubmitStatus, data?: any) => any
}

const DestinationEntry: React.FC<DestinationEditProps> = ({destination,fetchedDestination,onClose,}) => {
  const isEdit = (destination?.destinationId || 0) > 0
  const title = isEdit ? 'Edit Destination' : 'Add Destination'
  const isViewMode = false
  const [initialData, setInitialData] = useState<any>()
  const { data: destinationData } = useGetDestinations()
  const existingDestinations: Destination[] =
    fetchedDestination?.length > 0
      ? fetchedDestination
      : destinationData || []

  useEffect(() => {
    if (destination) {
      setInitialData({
        destinationId: destination?.destinationId || 0,
        name: destination?.name || '',
        shortName: destination?.shortName || '',
        address1: destination?.address1 || '',
        address2: destination?.address2 || '',
        city: destination?.city || '',
        pincode: destination?.pincode || '',
        mobileNumber: destination?.mobileNumber || '',
        mailId: destination?.mailId || '',
        gstIn: destination?.gstIn || '',
        isOtherState: destination?.isOtherState ?? false,
        isFederation: destination?.isFederation ?? false,
      })
    }
  }, [destination])

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Name is required')
      .trim()
      .test(
        'check-duplicate-name',
        'Name already exists',
        function (value) {
          if (!value || !Array.isArray(existingDestinations)) {
            return true
          }

          const currentDestinationId =
            destination?.destinationId || 0

          const enteredName = value.trim().toLowerCase()
          const isDuplicate = existingDestinations
            .filter(
              (row: Destination) =>
                row.destinationId !== currentDestinationId
            )
            .some(
              (row: Destination) =>
                row.name?.trim().toLowerCase() === enteredName
            )

          return !isDuplicate
        }
      ),

    shortName: Yup.string().required('Short Name is required'),
    mailId: Yup.string().email('Enter a valid email'),
  })

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

      <FormikModel<Destination>
        initialData={initialData}
        validationSchema={validationSchema}
        isUpDateEntityDetails={isEdit}
        wide
        insertRoute="/Destination/InsertDestination"
        updateRoute="/Destination/UpdateDestination"
        onClose={(status) => onClose?.(status)}
      >
        <div className="row g-3">

          <div className="col-6 col-md-4">
            <InputField
              label="Name"
              name="name"
              maxLength={30}
              required
              disabled={isEdit}
              inputRef={firstInputRef}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="Address1"
              name="address1"
              maxLength={50}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="Address2"
              name="address2"
              maxLength={50}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="City"
              name="city"
              maxLength={25}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="Pincode"
              name="pincode"
              maxLength={6}
              sanitize={(v) => v.replace(/\D/g, '')}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="MobileNumber"
              name="mobileNumber"
              maxLength={10}
              sanitize={(v) => v.replace(/\D/g, '')}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="MailId"
              name="mailId"
              type="email"
              maxLength={30}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="GstIn"
              name="gstIn"
              maxLength={30}
            />
          </div>

          <div className="col-6 col-md-4">
            <InputField
              label="Short Name"
              name="shortName"
              maxLength={30}
              required
            />
          </div>

          <div className="col-6 col-md-4">
  <div className="d-flex align-items-center">
    <SwitchField
      prefix="No"
      sufix="Yes"
      label="OtherState"
      name="isOtherState"
      disabled={isViewMode}
    />
  </div>
</div>

<div className="col-6 col-md-4">
  <div className="d-flex align-items-center">
    <SwitchField
      prefix="No"
      sufix="Yes"
      label="Federation"
      name="isFederation"
      disabled={isViewMode}
    />
  </div>
</div>

        </div>
      </FormikModel>
    </>
  )
}
export default DestinationEntry

