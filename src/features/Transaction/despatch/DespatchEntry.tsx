import * as Yup from 'yup'
import { useEffect, useState } from 'react'
import { Field, useFormikContext } from 'formik'
import { PageHeader } from '../../../components/common/PageHeader'
import { InputField } from '../../../components/form/input-field.component'
import { SelectField } from '../../../core/select-field-component'
import { FormikModel, SubmitStatus } from '../../../core/formik-drawer-component'
import { BmcLineGrid } from '../../../components/common/BmcLineGrid'
import { useGetDespatchLines } from '../../../apiclient/transaction/use-get-despatch-lines'
import { useGetDestinations } from '../../../apiclient/master/use-get-destinations'
import { useGetTankers } from '../../../apiclient/master/use-get-tankers'
import { useGetBmcs } from '../../../apiclient/master/use-get-bmcs'
import { transactionApiClient, unwrap } from '../../../api/httpClient'
import { toDateInputValue } from '../../../core/date-utils'
import type Despatch from '../../../models/Transaction/Despatch'
/*import type { DespatchLine } from '../../../models/Transaction/Despatch'*/
import type Tanker from '../../../models/masters/Tanker'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'


interface DespatchEditProps {
  despatch: Despatch
  fetchedDespatch: Despatch[]
  onClose?: (status: SubmitStatus, data?: any) => any
}

const validationSchema = Yup.object().shape({
  despatchDate: Yup.string().required('Despatch Date is required'),
  invoiceNumber: Yup.string().required('Invoice Number is required'),
  despatchToId: Yup.number().min(1, 'Destination is required').required('Destination is required'),
  tankerId: Yup.number().min(1, 'Tanker is required').required('Tanker is required'),
})

function DespatchLineGridField() {
  const { values, setFieldValue } = useFormikContext<Despatch>()
  const { data: bmcs = [] } = useGetBmcs()
  return <BmcLineGrid lines={values.lines ?? []} onChange={(lines) => setFieldValue('lines', lines)} bmcs={bmcs} />
}
function buildDesMain(values: Despatch, tankers: Tanker[]) {
  const tankerNumber = tankers.find((t) => t.tankerId === values.tankerId)?.tankerNumber
  return {
    despatchMainId: values.despatchMainId,
    despatchDate: values.despatchDate,
    invoiceNumber: values.invoiceNumber,
    despatchToId: values.despatchToId,
    tankerId: values.tankerId != null ? String(values.tankerId) : null,
    tankerNumber,
    driverName: values.driverName,
    isAck: values.isAck ?? false,
    fMbrt: values.fMbrt ?? 0,
    mMbrt: values.mMbrt ?? 0,
    rMbrt: values.rMbrt ?? 0,
  }
}

const DespatchEntry: React.FC<DespatchEditProps> = ({ ...props }) => {
  const { despatch, onClose } = props
  const isEdit = (despatch?.despatchMainId || 0) > 0
  const title = isEdit ? 'Edit Despatch' : 'Add Despatch'
  const { data: destinations = [] } = useGetDestinations()
  const { data: tankers = [] } = useGetTankers()
  const { data: fetchedLinesData } = useGetDespatchLines({
    variables: { despatchMainId: despatch?.despatchMainId || 0 },
    enabled: isEdit,
  })
  const fetchedLines = fetchedLinesData ?? []
  const [initialData, setInitialData] = useState<any>()

  useEffect(() => {
    if (despatch) {
      setInitialData({
        despatchMainId: despatch?.despatchMainId || 0,
        despatchDate: toDateInputValue(despatch?.despatchDate),
        invoiceNumber: despatch?.invoiceNumber || '',
        despatchToId: despatch?.despatchToId || 0,
        tankerId: despatch?.tankerId || 0,
        driverName: despatch?.driverName || '',
        lines: isEdit ? fetchedLines : [],
      })
    }
    
  }, [despatch, fetchedLines, isEdit])

  if (!initialData) return null

  return (
    <div>
      <PageHeader title={title} />
      <FormikModel<Despatch>
        initialData={initialData}
        validationSchema={validationSchema}
        isUpDateEntityDetails={isEdit}
        wide
        client={transactionApiClient}
        onSubmitOverride={async (values, { isUpdate }) => {
          const desMain = buildDesMain(values, tankers)
          const desLine = values.lines ?? []

          if (isUpdate) {
            const payload = {
              despatchMainId: values.despatchMainId,
              desMain: [desMain],
              desLine,
            }
            await unwrap(transactionApiClient.put('/DespatchMain/UpdateDespatch', payload))
          } else {
            const payload = {
              desMain: [desMain],
              desLine,
            }
            const despatchMainId = await unwrap<number>(transactionApiClient.post('/DespatchMain/InsertDespatch', payload))
            // Optionally handle the returned ID if needed
          }
        }}
        onClose={(status) => onClose?.(status)}
      >
        <div className="row g-3">
          <div className="col-6 col-md-4">
           <Field name="despatchDate">
                         {({ field, form }: any) => (
                           <>
                             <label htmlFor="despatchDate">
                               Despatch Date <span className="field-error">*</span>
                             </label>
           
                             <DatePicker
                               id="despatchDate"
                               name="despatchDate"
                               selected={field.value ? new Date(field.value) : null}
                               openToDate={new Date()}
                               className="calendarBg"
                               placeholderText="Despatch Date"
                               dateFormat="dd-MM-yyyy"
                               popperPlacement="bottom-start"
                               portalId="root-portal"
                               showIcon
                               toggleCalendarOnIconClick
                               onChange={(date: Date | null) => {
                                 form.setFieldValue('despatchDate', date ? toDateInputValue(date) : '')
                               }}
                             />
                           </>
                         )}
                       </Field>
          </div>
          <div className="col-6 col-md-4">
            <InputField label="Invoice Number" name="invoiceNumber" maxLength={20} required />
          </div>
          <div className="col-6 col-md-4">
            <SelectField
              label="To (Destination)"
              name="despatchToId"
              options={destinations.map((d) => ({ value: d.destinationId!, label: d.name ?? '' }))}
            />
          </div>

          <div className="col-6 col-md-4">
            <SelectField
              label="Tanker No"
              name="tankerId"
              options={tankers.map((t) => ({ value: t.tankerId!, label: t.tankerNumber ?? '' }))}
            />
          </div>
          {/* <div className="col-6 col-md-4">
            <InputField label="Driver Name" name="driverName" maxLength={25} />
          </div> */}
        </div>

        <DespatchLineGridField />
      </FormikModel>
    </div>
  )
}

export default DespatchEntry
