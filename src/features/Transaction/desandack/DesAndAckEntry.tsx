import { useEffect, useMemo, useRef, useState } from 'react'
import * as Yup from 'yup'
import { Field, useFormikContext } from 'formik'
import { PageHeader } from '../../../components/common/PageHeader'
import { InputField } from '../../../components/form/input-field.component'
import { SelectField } from '../../../core/select-field-component'
import { FormikModel, SubmitStatus } from '../../../core/formik-drawer-component'
import { BmcLineGrid } from '../../../components/common/BmcLineGrid'
import { useGetDesAndAckById } from '../../../apiclient/transaction/use-get-desandack-by-id'
import { useGetDespatchLines } from '../../../apiclient/transaction/use-get-despatch-lines'
import { getDespatchMainForInv } from '../../../apiclient/transaction/get-despatch-main-for-inv'
import { useGetDestinations } from '../../../apiclient/master/use-get-destinations'
import { useGetTankers } from '../../../apiclient/master/use-get-tankers'
import { useGetBmcs } from '../../../apiclient/master/use-get-bmcs'
import { transactionApiClient, unwrap } from '../../../api/httpClient'
import { SwitchField } from '../../../components/common/switch-field-component'
import entryStyles from '../../../components/common/EntryCard.module.scss'
import { Modal } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import type DesAndAck from '../../../models/Transaction/DesAndAck'
import type Tanker from '../../../models/masters/Tanker'
import { formatLocalDate } from '../../../core/date-utils'


interface DesAndAckEditProps {
  desAndAck: DesAndAck
  fetchedDesAndAck: DesAndAck[]
  onClose?: (status: SubmitStatus, data?: any) => any
}

const validationSchema = Yup.object().shape({
  despatchDate: Yup.string().required('Despatch Date is required'),
  invoiceNumber: Yup.string().required('Invoice Number is required'),
  despatchToId: Yup.number().min(1, 'Destination is required').required('Destination is required'),
  tankerNumber: Yup.string().trim().required('Tanker No is required'),
  kg: Yup.number().notRequired(),
  acknowledgementDate: Yup.string().when('kg', {
    is: (kg: number | null) => kg != null && kg > 0,
    then: (schema) => schema.required('Acknowledgement Date is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
})

const toDateInputValue = (value: any): string => {
  if (!value) return ''

  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  return formatLocalDate(date)
}


function DesAndAckLineGridField() {
  const { values, setFieldValue } = useFormikContext<DesAndAck>()
  const { data: bmcs = [] } = useGetBmcs()
  const getMissingFields = () => {
    const missing: { label: string; inputName: string }[] = []
    if (!values.invoiceNumber?.trim()) missing.push({ label: 'InvoiceNumber', inputName: 'invoiceNumber' })
    if (!values.despatchToId) missing.push({ label: 'DestinationId', inputName: 'despatchToId' })
    if (!values.tankerNumber?.trim()) missing.push({ label: 'TankerNo', inputName: 'tankerNumber' })
    return missing
  }
  return (
    <BmcLineGrid
      lines={values.lines ?? []}
      onChange={(lines) => setFieldValue('lines', lines)}
      bmcs={bmcs}
      getMissingFields={getMissingFields}
    />
  )
}


function KgField() {
  const { values, setFieldValue } = useFormikContext<DesAndAck>()
  const recalcLitre = () => {
    const kg = values.kg ?? 0
    const gravity = values.gravity ?? 0
    if (kg && gravity) {
      setFieldValue('ackLitre', Math.round(kg / gravity))
    }
  }
  return (
    <div className={entryStyles.field}>
      <label htmlFor="kg">KG</label>
      <input
        id="kg"
        name="kg"
        type="number"
        autoComplete="off"
        value={values.kg ?? ''}
        onChange={(e) => setFieldValue('kg', e.target.value === '' ? null : Number(e.target.value))}
        onBlur={recalcLitre}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            recalcLitre()
          }
        }}
      /> 
    </div>
  )
}

function GravityField() {
  const { values, setFieldValue } = useFormikContext<DesAndAck>()
  const recalcLitre = () => {
    const kg = values.kg ?? 0
    const gravity = values.gravity ?? 0
    if (kg && gravity) {
      setFieldValue('ackLitre', Math.round(kg / gravity))
    }
  }
  return (
    <div>
      <label htmlFor="gravity">Gravity</label>
      <input
        id="gravity"
        name="gravity"
        type="number"
        autoComplete="off"
        value={values.gravity ?? ''}
        onChange={(e) => setFieldValue('gravity', e.target.value === '' ? null : Number(e.target.value))}
        onBlur={recalcLitre}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            recalcLitre()
          }
        }}
      />
    </div>
  )
}
function InvoiceNumberField({ isEdit }: { isEdit: boolean }) {
  const { values, errors, touched, setFieldValue, setFieldError, setFieldTouched } = useFormikContext<DesAndAck>()

  const checkDuplicateInvoice = async () => {
    setFieldTouched('invoiceNumber', true, false)
    if (isEdit || !values.despatchDate || !values.invoiceNumber) return

    try {
      const matches = await getDespatchMainForInv(values.despatchDate)

      const isDuplicate = matches.some((m) => m.invoiceNumber === values.invoiceNumber)
      if (isDuplicate) {
        setFieldError('invoiceNumber', 'InvoiceNumber Already Exists')
      }
    } catch {
      // duplicate check is best-effort; a failed lookup must not break data entry
    }
  }

  return (
    <div className={entryStyles.field}>
      <label htmlFor="invoiceNumber">
        Invoice Number <span className="field-error"> *</span>
      </label>
      <input
        id="invoiceNumber"
        name="invoiceNumber"
        type="text"
        autoComplete="off"
        maxLength={20}
        value={values.invoiceNumber ?? ''}
        onChange={(e) => setFieldValue('invoiceNumber', e.target.value)}
        onBlur={checkDuplicateInvoice}
        onKeyDown={(e) => {
          // Enter moves focus on, and the resulting blur runs the duplicate check
          if (e.key === 'Enter') e.preventDefault()
        }}
      />
      {touched.invoiceNumber && errors.invoiceNumber && (
        <div className="field-error">{errors.invoiceNumber as string}</div>
      )}
    </div>
  )
}

function AllocationCalculator() {
  const { values, setFieldValue } = useFormikContext<DesAndAck>()

  useEffect(() => {
    const lines = values.lines ?? []
    if (lines.length === 0) return

    const totalFLitre = lines.reduce((s, l) => s + (l.fLitre || 0), 0)
    const totalMLitre = lines.reduce((s, l) => s + (l.mLitre || 0), 0)
    const totalRLitre = lines.reduce((s, l) => s + (l.rLitre || 0), 0)
    const totalFLitFat = lines.reduce((s, l) => s + ((l.fLitre || 0) * (l.fFat || 0)) / 100, 0)
    const totalFLitSnf = lines.reduce((s, l) => s + ((l.fLitre || 0) * (l.fSnf || 0)) / 100, 0)
    const totalMLitFat = lines.reduce((s, l) => s + ((l.mLitre || 0) * (l.mFat || 0)) / 100, 0)
    const totalMLitSnf = lines.reduce((s, l) => s + ((l.mLitre || 0) * (l.mSnf || 0)) / 100, 0)
    const totalRLitFat = lines.reduce((s, l) => s + ((l.rLitre || 0) * (l.rFat || 0)) / 100, 0)
    const totalRLitSnf = lines.reduce((s, l) => s + ((l.rLitre || 0) * (l.rSnf || 0)) / 100, 0)
    const ackLitre = values.ackLitre || 0
    const totalLitre = totalFLitre + totalMLitre + totalRLitre
   const afLitre = totalLitre
    ? Number(((totalFLitre / totalLitre) * ackLitre).toFixed(3))
    : 0;

const amLitre = totalLitre
    ? Number(((totalMLitre / totalLitre) * ackLitre).toFixed(3))
    : 0;

const arLitre = totalLitre
    ? Number(((totalRLitre / totalLitre) * ackLitre).toFixed(3))
    : 0;
    const afLitFat = (afLitre * (values.afFat || 0)) / 100
    const afLitSnf = (afLitre * (values.afSnf || 0)) / 100
    const amLitFat = (amLitre * (values.amFat || 0)) / 100
    const amLitSnf = (amLitre * (values.amSnf || 0)) / 100
    const arLitFat = (arLitre * (values.arFat || 0)) / 100
    const arLitSnf = (arLitre * (values.arSnf || 0)) / 100
    const allocatedLines = lines.map((line) => {
      const fLitre = line.fLitre || 0
      const mLitre = line.mLitre || 0
      const rLitre = line.rLitre || 0
      const fLitFat = (fLitre * (line.fFat || 0)) / 100
      const fLitSnf = (fLitre * (line.fSnf || 0)) / 100
      const mLitFat = (mLitre * (line.mFat || 0)) / 100
      const mLitSnf = (mLitre * (line.mSnf || 0)) / 100
      const rLitFat = (rLitre * (line.rFat || 0)) / 100
      const rLitSnf = (rLitre * (line.rSnf || 0)) / 100
      const aFLit = totalFLitre ? (fLitre / totalFLitre) * afLitre : 0
      const aMLit = totalMLitre ? (mLitre / totalMLitre) * amLitre : 0
      const aRLit = totalRLitre ? (rLitre / totalRLitre) * arLitre : 0
      const aFLitFat = totalFLitFat ? (fLitFat / totalFLitFat) * afLitFat : 0
      const aFLitSnf = totalFLitSnf ? (fLitSnf / totalFLitSnf) * afLitSnf : 0
      const aMLitFat = totalMLitFat ? (mLitFat / totalMLitFat) * amLitFat : 0
      const aMLitSnf = totalMLitSnf ? (mLitSnf / totalMLitSnf) * amLitSnf : 0
      const aRLitFat = totalRLitFat ? (rLitFat / totalRLitFat) * arLitFat : 0
      const aRLitSnf = totalRLitSnf ? (rLitSnf / totalRLitSnf) * arLitSnf : 0

      return {
        ...line,
        afLitre: Math.round(aFLit),
        afFat: aFLit ? (aFLitFat / aFLit) * 100 : 0,
        afSnf: aFLit ? (aFLitSnf / aFLit) * 100 : 0,
        amLitre: Math.round(aMLit),
        amFat: aMLit ? (aMLitFat / aMLit) * 100 : 0,
        amSnf: aMLit ? (aMLitSnf / aMLit) * 100 : 0,
        arLitre: Math.round(aRLit),
        arFat: aRLit ? (aRLitFat / aRLit) * 100 : 0,
        arSnf: aRLit ? (aRLitSnf / aRLit) * 100 : 0,
      }
    })

    setFieldValue('afLitre', afLitre)
    setFieldValue('amLitre', amLitre)
    setFieldValue('arLitre', arLitre)
    setFieldValue('afLitFat', afLitFat)
    setFieldValue('afLitSnf', afLitSnf)
    setFieldValue('amLitFat', amLitFat)
    setFieldValue('amLitSnf', amLitSnf)
    setFieldValue('arLitFat', arLitFat)
    setFieldValue('arLitSnf', arLitSnf)
    setFieldValue('allocatedLines', allocatedLines)
    
  }, [values.lines, values.kg, values.gravity, values.ackLitre, values.afFat, values.afSnf, values.arFat, values.arSnf, values.amFat, values.amSnf])

  return null
}


const findTankerId = (tankers: Tanker[], tankerNumber?: string) =>
  tankers.find((t) => t.tankerNumber?.toLowerCase() === tankerNumber?.trim().toLowerCase())?.tankerId

function buildDesMain(values: DesAndAck, tankers: Tanker[]) {
  const tankerNumber = values.tankerNumber?.trim()
  // Link to the tanker master when the typed number matches one
  const tankerId = findTankerId(tankers, tankerNumber)
  return {
    despatchMainId: values.despatchMainId,
    despatchDate: values.despatchDate,
    invoiceNumber: values.invoiceNumber,
    despatchToId: values.despatchToId,
    tankerId: tankerId != null ? String(tankerId) : null,
    tankerNumber,
    driverName: values.driverName,
  }
}

function buildDesLine(values: DesAndAck) {
  const lines = values.allocatedLines ?? values.lines ?? []
  return lines.map((line) => ({
    despatchLineId: line.despatchLineId,
    bmcId: line.bmcId,
    bmcCode: line.bmcCode,
    bmcName: line.bmcName,
    advNo: line.advNo,
    fLitre: line.fLitre,
    fFat: line.fFat,
    fSnf: line.fSnf,
    mLitre: line.mLitre,
    mFat: line.mFat,
    mSnf: line.mSnf,
    rLitre: line.rLitre,
    rFat: line.rFat,
    rSnf: line.rSnf,
    afLitre: 'afLitre' in line ? line.afLitre : 0,
    afFat: 'afFat' in line ? line.afFat : 0,
    afSnf: 'afSnf' in line ? line.afSnf : 0,
    amLitre: 'amLitre' in line ? line.amLitre : 0,
    amFat: 'amFat' in line ? line.amFat : 0,
    amSnf: 'amSnf' in line ? line.amSnf : 0,
    arLitre: 'arLitre' in line ? line.arLitre : 0,
    arFat: 'arFat' in line ? line.arFat : 0,
    arSnf: 'arSnf' in line ? line.arSnf : 0,
  }))
}

const DesAndAckEntry: React.FC<DesAndAckEditProps> = ({ ...props }) => {
  const { desAndAck, onClose } = props
  const despatchMainId = desAndAck?.despatchMainId || 0
  const isEdit = despatchMainId > 0
  const title = isEdit ? 'Edit Despatch And Acknowledgement' : 'Add Despatch And Acknowledgement'

  const isViewMode = false

  const { data: found, isFetched: foundFetched } = useGetDesAndAckById({
    variables: { id: despatchMainId },
    enabled: isEdit,
  })
  const { data: fetchedLinesData } = useGetDespatchLines({ variables: { despatchMainId }, enabled: isEdit })
  // Memoised: a fresh `[]` each render re-triggers the initialData effect below and loops forever
  const fetchedLines = useMemo(() => fetchedLinesData ?? [], [fetchedLinesData])
  const { data: destinations = [] } = useGetDestinations()
  const { data: tankers = [] } = useGetTankers()

  const ackDatePickerRef = useRef<DatePicker>(null)
  const despatchDatePickerRef = useRef<DatePicker>(null)
  const [initialData, setInitialData] = useState<any>()
  const [showNoBmcDialog, setShowNoBmcDialog] = useState(false)

    useEffect(() => {
    if (isEdit && !foundFetched) return
    setInitialData(
      found
        ? {
            despatchMainId: found.despatchMainId,
            despatchDate: toDateInputValue(found.despatchDate),
            invoiceNumber: found.invoiceNumber ?? '',
            despatchToId: found.despatchToId ?? 0,
            tankerNumber:
              found.tankerNumber ?? tankers.find((t) => t.tankerId === found.tankerId)?.tankerNumber ?? '',
            driverName: found.driverName ?? '',
            lines: fetchedLines,
            acknowledgementMainId: found.acknowledgementMainId,
            acknowledgementDate: toDateInputValue(found.acknowledgementDate),
            acknowledgementEntryName: found.acknowledgementEntryName ?? '',
            // API returns null for empty values; inputs must get undefined/'' instead of null
            kg: found.kg ,
            gravity: found.gravity ,
            temp: found.temp,
            afFat: found.afFat,
            afSnf: found.afSnf,
            amFat: found.amFat,
            amSnf: found.amSnf,
            arFat: found.arFat,
            arSnf: found.arSnf,
            fMbrt: found.fMbrt,
            mMbrt: found.mMbrt,
            rMbrt: found.rMbrt,
            ackLitre: found.ackLitre,
            isFSour: found.isFSour ?? false,
            isMSour: found.isMSour ?? false,
            isRSour: found.isRSour ?? false,
          }
        : {
            despatchDate: toDateInputValue(new Date()),
            invoiceNumber: '',
            despatchToId: 0,
            tankerNumber: '',
            driverName: '',
            lines: [],
            acknowledgementDate: toDateInputValue(new Date()),
            acknowledgementEntryName: '',
            isFSour: false,
            isMSour: false,
            isRSour: false,
          }
    )
  }, [found, fetchedLines, isEdit, foundFetched, tankers])

  if (!initialData) return null

  return (
    <div
      className="desAndAckEntryPage"
      style={{ width: '100%', maxWidth: 'none', margin: '0 auto', padding: '0 8px', boxSizing: 'border-box' }}
    >{/* 
      <style>
        {`
        .desAndAckEntryPage input,
        .desAndAckEntryPage select {
          border-radius: 8px;
          border-color: #bcdcf0;
          padding: 10px 14px;
          font-size: 15px;
        }
        .desAndAckEntryPage input[type="number"] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
        .desAndAckEntryPage input[type="number"]::-webkit-outer-spin-button,
        .desAndAckEntryPage input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .desAndAckEntryPage .react-datepicker__view-calendar-icon input {
          padding-left: 34px;
        }
        .desAndAckEntryPage .react-datepicker__calendar-icon {
          top: 10px;
        }
        .desAndAckEntryPage input:focus,
        .desAndAckEntryPage select:focus {
          border-color: #2f85c4;
        }
      `}
      </style> */}
      <PageHeader title={title} />
      <FormikModel<DesAndAck>
        initialData={initialData}
        validationSchema={validationSchema}
        isUpDateEntityDetails={isEdit}
        wide
        grid
        maxWidth={1700}
        client={transactionApiClient}
        onSubmitOverride={async (values, { isUpdate }) => {
          const desMain = buildDesMain(values, tankers)
          const desLine = buildDesLine(values)

          // Nothing to save without BMC lines: warn and stay on the entry page
          if (desLine.length === 0) {
            setShowNoBmcDialog(true)
            return false
          }

          let resolvedDespatchMainId = values.despatchMainId
          if (isUpdate) {
            await unwrap(transactionApiClient.put('/DespatchMain/UpdateDespatch', desMain))
          } else {
            resolvedDespatchMainId = await unwrap<number>(
              transactionApiClient.post('/DespatchMain/InsertDespatch', desMain)
            )
          }

          if (desLine.length > 0) {
            const linePayload = { despatchMainId: resolvedDespatchMainId, desLine }
            if (isUpdate) {
              await unwrap(transactionApiClient.put('/DespatchLine/UpdateDespatchLine', linePayload))
            } else {
              await unwrap(transactionApiClient.post('/DespatchLine/InsertDespatchLine', linePayload))
            }
          }

          const hasAcknowledgementData = values.kg != null && values.kg > 0
          if (!hasAcknowledgementData) {
            
            return
          }

          const ackTankerId = findTankerId(tankers, values.tankerNumber)
          const desAckPayload = {
            despatchMainId: resolvedDespatchMainId,
            despatchDate: values.despatchDate,
            invoiceNumber: values.invoiceNumber,
            despatchToId: values.despatchToId,
            // DespatchAckDto.TankerId is a string on the API, so a number fails model binding (400)
            tankerId: ackTankerId != null ? String(ackTankerId) : null,
            tankerNumber: values.tankerNumber?.trim(),
            driverName: values.driverName,
            acknowledgementMainId: values.acknowledgementMainId,
            acknowledgementDate: values.acknowledgementDate,
            acknowledgementEntryName: values.acknowledgementEntryName,
            kg: values.kg,
            gravity: values.gravity,
            temp: values.temp,
            afFat: values.afFat,
            afSnf: values.afSnf,
            amFat: values.amFat,
            amSnf: values.amSnf,
            arFat: values.arFat,
            arSnf: values.arSnf,
            afLitre: values.afLitre,
            afLitFat: values.afLitFat,
            afLitSnf: values.afLitSnf,
            amLitre: values.amLitre,
            amLitFat: values.amLitFat,
            amLitSnf: values.amLitSnf,
            arLitre: values.arLitre,
            arLitFat: values.arLitFat,
            arLitSnf: values.arLitSnf,
            fMbrt: values.fMbrt,
            mMbrt: values.mMbrt,
            rMbrt: values.rMbrt,
            ackLitre: values.ackLitre,
            isFSour: values.isFSour,
            isMSour: values.isMSour,
            isRSour: values.isRSour,
          }
          if (isUpdate) {
            await unwrap(transactionApiClient.put('/DesAck/DesAckUpdate', desAckPayload))
          } else {
            await unwrap(transactionApiClient.post('/DesAck/DesAckInsert', desAckPayload))
          }
        }}
        onClose={(status) => onClose?.(status)}
      >
        <div className="row g-3 flex-nowrap" style={{ gridColumn: '1 / -1' }}>
          <div className="col-md-2">
            <Field name="despatchDate">
              {({ field, form }: any) => (
                <>
                  <label htmlFor="despatchDate">
                    Despatch Date <span className="field-error">*</span>
                  </label>

                  <DatePicker
                    ref={despatchDatePickerRef}
                    onKeyDown={(e) => {
                      // Enter would submit the form or re-open the calendar; move to Invoice Number instead
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      setTimeout(() => {
                        despatchDatePickerRef.current?.setOpen(false)
                        document.getElementById('invoiceNumber')?.focus()
                      }, 0)
                    }}
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

          <div
            className="col-md-2"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              document.getElementById('despatchToId')?.focus()
            }}
          >
            <InvoiceNumberField isEdit={isEdit} />
          </div>

          <div
            className="col-md-2"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              document.getElementById('tankerNumber')?.focus()
            }}
          >
            <SelectField
              label="To (Destination)"
              name="despatchToId"
              options={destinations.map((d) => ({ value: d.destinationId!, label: d.name ?? '' }))}
            />
          </div>

          <div
            className="col-md-2"
            onKeyDown={(e) => {
              // Enter would submit the form; move to the BMC grid entry row instead
              if (e.key !== 'Enter') return
              e.preventDefault()
              document.querySelector<HTMLInputElement>('.desAndAckEntryPage input[placeholder="Bmc Code"]')?.focus()
            }}
          >
            <InputField label="Tanker No" name="tankerNumber" maxLength={20} />
          </div>

         {/*  <div className="col-md-2">
            <InputField label="Driver Name" name="driverName" maxLength={25} />
          </div> */}
        </div>

        <DesAndAckLineGridField />
        <AllocationCalculator />

        <div
          style={{ gridColumn: '1 / -1' }}
          onKeyDown={(e) => {
            // Enter would submit the form; move to the next enabled input in the acknowledgement section instead
            if (e.key !== 'Enter') return
            const target = e.target as HTMLElement
            if (target.tagName !== 'INPUT') return
            e.preventDefault()
            const inputs = Array.from(
              e.currentTarget.querySelectorAll<HTMLInputElement>('input:not([disabled]):not([type="hidden"])'),
            )
            const next = inputs[inputs.indexOf(target as HTMLInputElement) + 1]
            // timeout lets the date picker commit its selection before focus moves
            setTimeout(() => next?.focus(), 0)
          }}
        >
          <div className="row g-5">
            <div className="col-md-2">
              <Field name="acknowledgementDate">
                {({ field, form }: any) => (
                  <div>
                    <label htmlFor="acknowledgementDate" className="form-label">
                      Acknowledgement Date
                    </label>

                    <DatePicker
                      ref={ackDatePickerRef}
                      onKeyDown={(e) => {
                        // Enter on a closed picker re-opens the calendar; keep it closed while moving on
                        if (e.key === 'Enter') setTimeout(() => ackDatePickerRef.current?.setOpen(false), 0)
                      }}
                      id="acknowledgementDate"
                      name="acknowledgementDate"
                      selected={field.value ? new Date(field.value) : null}
                      openToDate={new Date()}
                      className="form-control calendarBg"
                      placeholderText="Acknowledgement Date"
                      dateFormat="dd-MM-yyyy"
                      popperPlacement="bottom-start"
                      portalId="root-portal"
                      showIcon
                      toggleCalendarOnIconClick
                      onChange={(date: Date | null) => {
                        form.setFieldValue('acknowledgementDate', date ? toDateInputValue(date) : '')
                      }}
                    />
                  </div>
                )}
              </Field>
            </div>
            {/* <div className="col-md-2">
              <InputField label="Entered By" name="acknowledgementEntryName" maxLength={5} />
            </div> */}
            <div className="col-md-2">
              <KgField />
            </div>
            <div className="col-md-2">
              <GravityField />
            </div>
            <div className="col-md-2">
              <InputField label="Litre" name="ackLitre" type="number" disabled />
            </div>
            <div className="col-md-2">
              <InputField label="Temp" name="temp" type="number" asNumber />
            </div>
          </div>

          <div className="row g-5">
         
            <div className="col-md-2">
              <InputField label="Front Fat" name="afFat" type="number" asNumber />
            </div>

             <div className="col-md-2">
              <InputField label="Front Snf" name="afSnf" type="number" asNumber />
            </div>

             <div className="col-md-2">
              <InputField label="FMBRT" name="fMbrt" type="number" asNumber />
            </div>

            <div className="col-md-2">
              <InputField label="Middle Fat" name="amFat" type="number" asNumber />
            </div>

            <div className="col-md-2">
              <InputField label="Middle Snf" name="amSnf" type="number" asNumber />
            </div>
          
          </div>

          <div className="row g-5">
             <div className="col-md-2">
              <InputField label="MMBRT" name="mMbrt" type="number" asNumber />
            </div>

            <div className="col-md-2">
              <InputField label="Rear Fat" name="arFat" type="number" asNumber />
            </div>

             <div className="col-md-2">
              <InputField label="Rear Snf" name="arSnf" type="number" asNumber />
            </div>

            <div className="col-md-2">
              <InputField label="RMBRT" name="rMbrt" type="number" asNumber />
            </div>
            
          </div>

        {/*   <div className="row g-5">
            <div className="col-md-2">
              <InputField label="Allocated Front Litre" name="afLitre" disabled />
            </div>
            <div className="col-md-2">
              <InputField label="Allocated Middle  Litre" name="afLitre" disabled />
            </div>
            <div className="col-md-2">
              <InputField label="Allocated Rear Litre" name="arLitre" disabled />
            </div>
          </div> */}

          <div className="row g-5">
            <div className="col-md-3 d-flex align-items-center gap-2">
              <SwitchField prefix="No" sufix="Yes" label="Front Sour" name="isFSour" disabled={isViewMode} />
            </div>
            <div className="col-md-3 d-flex align-items-center gap-2">
              <SwitchField prefix="No" sufix="Yes" label="Middle Sour" name="isMSour" disabled={isViewMode} />
            </div>
            <div className="col-md-3 d-flex align-items-center gap-2">
              <SwitchField prefix="No" sufix="Yes" label="Rear Sour" name="isRSour" disabled={isViewMode} />
            </div>
          </div>
        </div>
      </FormikModel>

      <Modal show={showNoBmcDialog} restoreFocus={false} onHide={() => setShowNoBmcDialog(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 'normal' }}>No Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>Please add some Bmc</Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-primary" autoFocus onClick={() => setShowNoBmcDialog(false)}>
            OK
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default DesAndAckEntry
