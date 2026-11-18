import * as Yup from 'yup'
import { useEffect, useRef, useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { InputField } from '../../components/form/input-field.component'
import { useGetSocieties } from '../../apiclient/master/use-get-societies'
import { FormikModel, SubmitStatus } from '../../core/formik-drawer-component'
import type Society from '../../models/masters/Society'

interface SocietyEditProps {
  society: Society
  fetchedSociety: Society[]
  onClose?: (status: SubmitStatus, data?: any) => any
}

const SocietyEntry: React.FC<SocietyEditProps> = ({ ...props }) => {
  const { society, fetchedSociety, onClose } = props
  const title = (society?.societyId || 0) > 0 ? 'Edit Society' : 'Add Society'
  const [initialData, setInitialData] = useState<any>()
  const { data: societyData } = useGetSocieties() 
  const existingSocieties: Society[] =
    fetchedSociety?.length > 0
      ? fetchedSociety
      : societyData || []

  useEffect(() => {
    if (society) {
      setInitialData({
        societyId: society?.societyId || 0,
        code: society?.code || '',
        name: society?.name || '',
        secretaryName: society?.secretaryName || '',
        mobileNumber: society?.mobileNumber || '',
      })
    }
  }, [society])

  const validationSchema = Yup.object().shape({
    code: Yup.string().required('Code is required'),
    name: Yup.string()
      .required('Name is required')
      .test('check-duplicate-name', 'Name already exists', function (value) {
        if (!value || !existingSocieties) return true

        const currentSocietyId = society?.societyId || 0
        const isDuplicate = existingSocieties
          .filter((row) => row.societyId !== currentSocietyId)
          .some((row) => row.name?.toLowerCase() === value.toLowerCase())

        return !isDuplicate
      }),
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
      <FormikModel<Society>
        initialData={initialData}
        validationSchema={validationSchema}
        isUpDateEntityDetails={(society?.societyId || 0) > 0}
        wide
        insertRoute="/Society/InsertSociety"
        updateRoute="/Society/UpdateSociety"
        onClose={(status) => onClose?.(status)}
      >
        <div className="row g-3">
          <div className="col-6 col-md-4">
            <InputField label="Code" name="code" maxLength={5} required inputRef={firstInputRef} />
          </div>
          <div className="col-6 col-md-4">
            <InputField label="Name" name="name" maxLength={30} required />
          </div>
          <div className="col-6 col-md-4">
            <InputField label="Secretary Name" name="secretaryName" maxLength={30} />
          </div>
          <div className="col-6 col-md-4">
            <InputField
              label="MobileNumber"
              name="mobileNumber"
              maxLength={10}
              sanitize={(v) => v.replace(/\D/g, '')}
            />
          </div>
        </div>
      </FormikModel>
    </>
  )
}

export default SocietyEntry
