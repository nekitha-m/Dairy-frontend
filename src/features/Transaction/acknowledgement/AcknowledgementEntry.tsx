import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { Field, useFormikContext } from 'formik'
import { PageHeader } from '../../../components/common/PageHeader'
import { InputField } from '../../../components/form/input-field.component'
import { FormikModel, SubmitStatus } from '../../../core/formik-drawer-component'
import { BmcLineGrid } from '../../../components/common/BmcLineGrid'
import { useGetAckMainList } from '../../../apiclient/transaction/use-get-ack-main-list'
import { useGetDespatches } from '../../../apiclient/transaction/use-get-despatches'
import { useGetDespatchLines } from '../../../apiclient/transaction/use-get-despatch-lines'
import { useGetDestinations } from '../../../apiclient/master/use-get-destinations'
import { useGetTankers } from '../../../apiclient/master/use-get-tankers'
import { useGetBmcs } from '../../../apiclient/master/use-get-bmcs'
import { transactionApiClient, unwrap } from '../../../api/httpClient'
import { SwitchField } from '../../../components/common/switch-field-component'
import { formatLocalDate, toDateInputValue } from '../../../core/date-utils'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import entryStyles from '../../../components/common/EntryCard.module.scss'
import type Acknowledgement from '../../../models/Transaction/Acknowledgement'
import type Despatch from '../../../models/Transaction/Despatch'
//import type { DespatchLine } from '../../../models/Transaction/Despatch'


interface AcknowledgementEditProps {
  acknowledgement: Acknowledgement
  fetchedAcknowledgement: Acknowledgement[]
  onClose?: (status: SubmitStatus, data?: any) => any
}

const validationSchema = Yup.object().shape({
  despatchMainId: Yup.number().min(1, 'Despatch is required').required('Despatch is required'),
  acknowledgementDate: Yup.string().required('Acknowledgement Date is required'),
  kg: Yup.number().required('KG is required'),
})

function DespatchPicker({ disabled, despatches }: { disabled: boolean; despatches: Despatch[] }) {
  const { values, setFieldValue } = useFormikContext<Acknowledgement>()

  const { data: destinations = [] } = useGetDestinations()
  const { data: tankers = [] } = useGetTankers()

  const selected = despatches.find((d) => d.despatchMainId === values.despatchMainId)

  const destinationName = destinations.find((d) => d.destinationId === selected?.despatchToId)?.name
  const tankerNumber = tankers.find((t) => t.tankerId === selected?.tankerId)?.tankerNumber

  const handleSelect = (despatchMainId: number) => {
    const despatch = despatches.find((d) => d.despatchMainId === despatchMainId)
    setFieldValue('despatchMainId', despatchMainId)
    setFieldValue('despatchDate', toDateInputValue(despatch?.despatchDate ?? null))
    setFieldValue('invoiceNumber', despatch?.invoiceNumber ?? '')
    setFieldValue('despatchToId', despatch?.despatchToId ?? 0)
    setFieldValue('driverName', despatch?.driverName ?? '')
  }

const toDateInputValue = (value: string | Date | null): string => {
  if (!value) return ''

  const date = value instanceof Date ? value : new Date(value)

  if (isNaN(date.getTime())) return ''

  return formatLocalDate(date)
}

  return (
    <div className={entryStyles.field}>
      <label htmlFor="despatchMainId">Despatch Invoice</label>
      <select
        id="despatchMainId"
        value={values.despatchMainId ?? 0}
        disabled={disabled}
        onChange={(e) => handleSelect(Number(e.target.value))}
      >
        <option value={0}>-Select-</option>
        {despatches.map((d) => (
          <option key={d.despatchMainId} value={d.despatchMainId}>
            {d.invoiceNumber} — {d.despatchDate}
          </option>
        ))}
      </select>

      {selected && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#6c757d' }}>
          Destination: {destinationName ?? '—'}
          {' · '}
          Tanker: {tankerNumber ?? '—'}
          {' · '}
          Driver: {selected.driverName || '—'}
        </div>
      )}
    </div>
  )
}

function KgField() {
  const { values, setFieldValue } = useFormikContext<Acknowledgement>()
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
  const { values, setFieldValue } = useFormikContext<Acknowledgement>()
  const recalcLitre = () => {
    const kg = values.kg ?? 0
    const gravity = values.gravity ?? 0
    if (kg && gravity) {
      setFieldValue('ackLitre', Math.round(kg / gravity))
    }
  }

  return (
    <div className={entryStyles.field}>
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

function AcknowledgementLineGridField() {
  const { values, setFieldValue } = useFormikContext<Acknowledgement>()

  const { data: linesData } = useGetDespatchLines({
    variables: { despatchMainId: values.despatchMainId ?? 0 },
    enabled: !!values.despatchMainId,
  })
  const { data: bmcs = [] } = useGetBmcs()
  const lines = linesData ?? []

  useEffect(() => {
    setFieldValue('lines', lines)
  }, [lines, setFieldValue])

  return (
    <BmcLineGrid
      lines={values.lines ?? []}
      onChange={(lines) => setFieldValue('lines', lines)}
      bmcs={bmcs}
    />
  )
}

function AllocationCalculator() {
  const { values, setFieldValue } = useFormikContext<Acknowledgement>()

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
    const totalLitre = totalFLitre + totalRLitre + totalMLitre
    const afLitre = totalLitre ? Math.round((totalFLitre / totalLitre) * ackLitre) : 0
    const amLitre = totalLitre ? Math.round((totalMLitre / totalLitre) * ackLitre) : 0
    const arLitre = totalLitre ? Math.round((totalRLitre / totalLitre) * ackLitre) : 0
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
   
  }, [
    values.lines,
    values.kg,
    values.gravity,
    values.ackLitre,
    values.afFat,
    values.afSnf,
    values.amFat,
    values.amSnf,
    values.arFat,
    values.arSnf,
    setFieldValue,
  ])

  return null
}

const AcknowledgementEntry: React.FC<AcknowledgementEditProps> = ({ ...props }) => {
  const { acknowledgement, onClose } = props
  const isEdit = (acknowledgement?.acknowledgementMainId || 0) > 0
  const title = isEdit ? 'Edit Acknowledgement' : 'Add Acknowledgement'

  const { data: acknowledgementDetails, isFetched: acknowledgementDetailsFetched } = useGetAckMainList({
    variables: acknowledgement?.acknowledgementMainId || 0,
    enabled: isEdit,
  })
  const { data: despatches = [] } = useGetDespatches()

  const found = isEdit ? acknowledgementDetails : null

  const [initialData, setInitialData] = useState<any>()

  useEffect(() => {

    if (isEdit && !acknowledgementDetailsFetched) return

    setInitialData(
      found
        ? {
            acknowledgementMainId: found.acknowledgementMainId,
            despatchMainId: found.despatchMainId ?? 0,
            despatchDate: toDateInputValue(found.despatchDate),
            invoiceNumber: found.invoiceNumber ?? '',
            despatchToId: found.despatchToId ?? 0,
            driverName: found.driverName ?? '',
            lines: [],
             acknowledgementDate: toDateInputValue(found.acknowledgementDate),
            acknowledgementEntryName: found.acknowledgementEntryName ?? '',
            kg: found.kg,
            gravity: found.gravity,
            ackLitre: found.ackLitre,
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
            isFSour: found.isFSour ?? false,
            isMSour: found.isMSour ?? false,
            isRSour: found.isRSour ?? false,
          }
          
        : {
            despatchMainId: 0,
            despatchDate: '',
            invoiceNumber: '',
            despatchToId: 0,
            driverName: '',
            lines: [],
            acknowledgementDate: '',
            acknowledgementEntryName: '',
            isFSour: false,
            isMSour: false,
            isRSour: false,
          }
    )
  }, [found, isEdit, acknowledgementDetailsFetched])

  if (!initialData) return null

  return (
    <div>
      <PageHeader title={title} />
      <FormikModel<Acknowledgement>
        initialData={initialData}
        validationSchema={validationSchema}
        isUpDateEntityDetails={isEdit}
        wide
        grid
        client={transactionApiClient}
        onSubmitOverride={async (values, { isUpdate }) => {
          const selectedDespatch = despatches.find((d) => d.despatchMainId === values.despatchMainId)

          const main = {
            acknowledgementMainId: values.acknowledgementMainId ?? 0,
            despatchMainId: values.despatchMainId,
            despatchDate: values.despatchDate,
            invoiceNumber: values.invoiceNumber,
            despatchToId: values.despatchToId,
            driverName: values.driverName,
            afLitre: values.afLitre,
            afFat: values.afFat,
            afSnf: values.afSnf,
            amLitre: values.amLitre,
            amFat: values.amFat,
            amSnf: values.amSnf,
            arLitre: values.arLitre,
            arFat: values.arFat,
            arSnf: values.arSnf,
            afLitFa: values.afLitFat,
            afLitSnf: values.afLitSnf,
            amLitFa: values.amLitFat,
            amLitSnf: values.amLitSnf,
            arLitFat: values.arLitFat,
            arLitSnf: values.arLitSnf,
            tankerId: selectedDespatch?.tankerId != null ? String(selectedDespatch.tankerId) : null,
            acknowledgementDate: values.acknowledgementDate,
            acknowledgementEntryName: values.acknowledgementEntryName,
            isFSour: values.isFSour,
            isMSour: values.isMSour,
            isRSour: values.isRSour,
            gravity: values.gravity,
            kg: values.kg,
            temp: values.temp,
            fMbrt: values.fMbrt,
            mMbrt: values.mMbrt,
            rMbrt: values.rMbrt,
            ackLitre: values.ackLitre,
          }
          const lines = (values.allocatedLines ?? []).map((line) => ({
            acknowledgementMainId: values.acknowledgementMainId ?? 0,
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
            afLitre: line.afLitre,
            afFat: line.afFat,
            afSnf: line.afSnf,
            amLitre: line.amLitre,
            amFat: line.amFat,
            amSnf: line.amSnf,
            arLitre: line.arLitre,
            arFat: line.arFat,
            arSnf: line.arSnf,
          }))

          if (!isUpdate) {
            await unwrap(transactionApiClient.post('/Acknowledgement/AcknowledgementEntry', { main, lines }))
          } else {
            await unwrap(transactionApiClient.post('/Acknowledgement/AcknowledgementUpdate', { main, lines }))
          }
        }}
        onClose={(status) => onClose?.(status)}
      >
        <DespatchPicker disabled={isEdit} despatches={despatches} />
        <AcknowledgementLineGridField />
        <AllocationCalculator />

         <div style={{ gridColumn: '1 / -1' }}>
                 <div className="row g-5">
                   <div className="col-md-2">
                     <Field name="acknowledgementDate">
                       {({ field, form }: any) => (
                         <div>
                           <label htmlFor="acknowledgementDate" className="form-label">
                             Acknowledgement Date <span className="field-error">*</span>
                           </label>
       
                           <DatePicker
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
                    <div className="col-md-2">
                     <InputField label="Entered By" name="acknowledgementEntryName" maxLength={5} />
                   </div> 
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
       
                 {/*<div className="row g-5">
                   <div className="col-md-2">
                     <InputField label="Allocated Front Litre" name="afLitre" disabled />
                   </div>
                   <div className="col-md-2">
                     <InputField label="Allocated Mid Litre" name="afLitre" disabled />
                   </div>
                   <div className="col-md-2">
                     <InputField label="Allocated Rear Litre" name="arLitre" disabled />
                   </div>
                 </div>*/}
       
                 <div className="row g-5">
                   <div className="col-md-3 d-flex align-items-center gap-2">
                     <SwitchField
                  prefix="No"
                   sufix="Yes"
                  label="Front Sour"
                  name="isFSour"
                     />
                   </div>
                   <div className="col-md-3 d-flex align-items-center gap-2">

                   <SwitchField
                  prefix="No"
                   sufix="Yes"
                    label="Middle Sour"
                     name="isMSour"
                    />
                    
                   </div>
                   <div className="col-md-3 d-flex align-items-center gap-2">

                    <SwitchField
                     prefix="No"
                 sufix="Yes"
                label="Rear Sour"
                 name="isRSour"/> 

                   </div>
                 </div>
               </div>
             </FormikModel>
           </div>
         )
       }

export default AcknowledgementEntry
