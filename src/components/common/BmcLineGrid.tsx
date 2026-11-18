import { useState, type ReactElement } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import { Modal } from 'react-bootstrap'
import { Button } from './Button'
import type Bmc from '../../models/masters/Bmc'
import type { DespatchLine } from '../../models/Transaction/Despatch'
import styles from './BmcLineGrid.module.scss'

const DeleteIcon = FiTrash2 as unknown as (props: { size?: number }) => ReactElement
interface LineDraft {
  bmcId?: number
  bmcCode?: string
  bmcName?: string
  advNo?: string
  fLitre?: string
  fFat?: string
  fSnf?: string
  mLitre?: string
  mFat?: string
  mSnf?: string
  rLitre?: string
  rFat?: string
  rSnf?: string
}

const EMPTY_DRAFT: LineDraft = {}

interface BmcLineGridProps {
  lines: DespatchLine[]
  onChange?: (lines: DespatchLine[]) => void
  bmcs?: Bmc[]
  /** Returns the header fields still missing; when non-empty a validation popup is shown instead of adding the line */
  getMissingFields?: () => { label: string; inputName: string }[]
}

export function BmcLineGrid({ lines, onChange, bmcs = [], getMissingFields }: BmcLineGridProps) {
const [missing, setMissing] = useState<{ label: string; inputName: string }[]>([])
const editable = !!onChange
const [entry, setEntry] = useState<LineDraft>(EMPTY_DRAFT)
const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const closeValidation = () => {
    const first = missing[0]
    setMissing([])
    // Send the user to the first missing header field
    if (first) setTimeout(() => document.querySelector<HTMLElement>(`[name="${first.inputName}"]`)?.focus(), 0)
  }

  const updateEntry = (field: keyof LineDraft, value: string) => {
    setEntry((prev) => ({ ...prev, [field]: value }))
  }

  const handleCodeBlur = () => {
    if (!entry.bmcCode) return
    const match = bmcs.find((b) => b.code?.toLowerCase() === entry.bmcCode?.toLowerCase())
    if (match) setEntry((prev) => ({ ...prev, bmcName: match.name, bmcId: match.bmcId }))
  }

  const handleNameBlur = () => {
    if (!entry.bmcName) return
    const match = bmcs.find((b) => b.name?.toLowerCase() === entry.bmcName?.toLowerCase())
    if (match) setEntry((prev) => ({ ...prev, bmcCode: match.code, bmcId: match.bmcId }))
  }
const handleCodeEnter = () => {
  if (!entry.bmcCode?.trim()) return

  const match = bmcs.find(
    (b) => b.code?.toLowerCase() === entry.bmcCode?.trim().toLowerCase()
  )

  if (match) {
    setEntry((prev) => ({
      ...prev,
      bmcCode: match.code,
      bmcName: match.name,
      bmcId: match.bmcId,
    }))
  } else {
    setEntry((prev) => ({
      ...prev,
      bmcName: '',
      bmcId: 0,
    }))
  }
}

 const saveLine = () => {
    if (!entry.advNo?.trim()) {
    setMissing([{ label: 'AdvNo', inputName: 'advNo' }])
    return
  }
  if (!entry.bmcCode || !entry.bmcName || !onChange) return

 
  const fLitre = Number(entry.fLitre) || 0
  const fFat = Number(entry.fFat) || 0
  const fSnf = Number(entry.fSnf) || 0
  const mLitre = Number(entry.mLitre) || 0
  const mFat = Number(entry.mFat) || 0
  const mSnf = Number(entry.mSnf) || 0
  const rLitre = Number(entry.rLitre) || 0
  const rFat = Number(entry.rFat) || 0
  const rSnf = Number(entry.rSnf) || 0
  const fLitFat = (fLitre * fFat) / 100
  const fLitSnf = (fLitre * fSnf) / 100
  const mLitFat = (mLitre * mFat) / 100
  const mLitSnf = (mLitre * mSnf) / 100
  const rLitFat = (rLitre * rFat) / 100
  const rLitSnf = (rLitre * rSnf) / 100

  const updatedLine: DespatchLine = {
    bmcId: entry.bmcId,
    bmcCode: entry.bmcCode,
    bmcName: entry.bmcName,
    advNo: entry.advNo,
    fLitre,
    fFat,
    fSnf,
    fLitFat,
    fLitSnf,
    mLitre,
    mFat,
    mSnf,
    mLitFat,
    mLitSnf,
    rLitre,
    rFat,
    rSnf,
    rLitFat,
    rLitSnf,
    afLitre: 0,
    afFat: 0,
    afSnf: 0,
    afLitFat: 0,
    afLitSnf: 0,
    amLitre: 0,
    amFat: 0,
    amSnf: 0,
    amLitFat: 0,
    amLitSnf: 0,
    arLitre: 0,
    arFat: 0,
    arSnf: 0,
    arLitFat: 0,
    arLitSnf: 0,
  }

  if (editingIndex !== null) {
    const updatedLines = [...lines]
    updatedLines[editingIndex] = updatedLine

    onChange(updatedLines)

    // Stay on the same page
    setEditingIndex(null)
    setEntry(EMPTY_DRAFT)

    return
  }

  
  onChange([
    ...lines,
    updatedLine,
  ])

  setEntry(EMPTY_DRAFT)
}

const editLine = (index: number) => {
  const line = lines[index]

  setEntry({
    bmcId: line.bmcId,
    bmcCode: line.bmcCode ?? '',
    bmcName: line.bmcName ?? '',
    advNo: line.advNo ?? '',
    fLitre: String(line.fLitre ?? ''),
    fFat: String(line.fFat ?? ''),
    fSnf: String(line.fSnf ?? ''),
    mLitre: String(line.mLitre ?? ''),
    mFat: String(line.mFat ?? ''),
    mSnf: String(line.mSnf ?? ''),
    rLitre: String(line.rLitre ?? ''),
    rFat: String(line.rFat ?? ''),
    rSnf: String(line.rSnf ?? ''),
  })

  setEditingIndex(index)
}
  const removeLine = (index: number) => {
    if (!onChange) return
    onChange(lines.filter((_, i) => i !== index))
  }

  const totalLitre = (line: DespatchLine) =>
    (Number(line.fLitre) || 0) + (Number(line.mLitre) || 0) + (Number(line.rLitre) || 0)
  const columnTotal = (key: keyof DespatchLine) => lines.reduce((sum, line) => sum + (Number(line[key]) || 0), 0)
  const grandTotal = lines.reduce((sum, line) => sum + totalLitre(line), 0)

  return (
    <div className={styles.wrap}>
   {editingIndex !== null && (
     <div className={styles.sectionTitle}>Edit BMC Line</div>
   )}
     {editable && (
  <div
    className={`${styles.entryRow} row g-2 align-items-center`}
    onKeyDown={(e) => {
      if (e.key !== 'Enter' || !(e.target instanceof HTMLInputElement)) return
      e.preventDefault()
      const inputs = Array.from(e.currentTarget.querySelectorAll('input'))
      const index = inputs.indexOf(e.target)
      if (index < 0) return
      if (index < inputs.length - 1) {
        inputs[index + 1].focus()
        return
      }
      // Last field: header fields must be filled before the line is added
     // Last field: validate Adv No after all grid fields are entered
if (!entry.advNo?.trim()) {
  setMissing([{ label: 'AdvNo', inputName: 'advNo' }])
  return
}

// Validate header fields before adding the line
const m = getMissingFields?.() ?? []
if (m.length > 0) {
  setMissing(m)
  return
}

// Add the valid line and return to the first field
saveLine()
inputs[0].focus()
    }}
  >
    <div className="col-1">
  <input
    className="form-control form-control-sm rounded"
    autoComplete="off"
    type="text"
    placeholder="Bmc Code"
    value={entry.bmcCode ?? ''}
    maxLength={6}
    onChange={(e) => updateEntry('bmcCode', e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        handleCodeEnter()
        // Move to Adv No once the BMC is found (the name field is auto-filled)
        const code = entry.bmcCode?.trim().toLowerCase()
        if (code && bmcs.some((b) => b.code?.toLowerCase() === code)) {
          const inputs = e.currentTarget.closest('.row')?.querySelectorAll('input')
          inputs?.[2]?.focus()
        }
      }
    }}
  />
</div>

    <div className="col-2">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        type="text"
        placeholder="Bmc Name"
        value={entry.bmcName ?? ''}
        maxLength={30}
        onChange={(e) => updateEntry('bmcName', e.target.value)}
        onBlur={handleNameBlur}
      />
    </div>

    <div className="col">
  <input
    name="advNo"
    className="form-control form-control-sm rounded"
    autoComplete="off"
    type="text"
    placeholder="Adv No"
    value={entry.advNo ?? ''}
    maxLength={6}
    onChange={(e) => updateEntry('advNo', e.target.value)}
  />
</div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="F-Litre"
        type="number"
        value={entry.fLitre ?? ''}
        onChange={(e) => updateEntry('fLitre', e.target.value)}
      />
    </div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="F-Fat"
        type="number"
        value={entry.fFat ?? ''}
        onChange={(e) => updateEntry('fFat', e.target.value)}
      />
    </div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="F-Snf"
        type="number"
        value={entry.fSnf ?? ''}
        onChange={(e) => updateEntry('fSnf', e.target.value)}
      />
    </div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="M-Litre"
        type="number"
        value={entry.mLitre ?? ''}
        onChange={(e) => updateEntry('mLitre', e.target.value)}
      />
    </div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="M-Fat"
        type="number"
        value={entry.mFat ?? ''}
        onChange={(e) => updateEntry('mFat', e.target.value)}
      />
    </div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="M-Snf"
        type="number"
        value={entry.mSnf ?? ''}
        onChange={(e) => updateEntry('mSnf', e.target.value)}
      />
    </div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="R-Litre"
        type="number"
        value={entry.rLitre ?? ''}
        onChange={(e) => updateEntry('rLitre', e.target.value)}
      />
    </div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="R-Fat"
        type="number"
        value={entry.rFat ?? ''}
        onChange={(e) => updateEntry('rFat', e.target.value)}
      />
    </div>

    <div className="col">
      <input
        className="form-control form-control-sm rounded"
    autoComplete="off"
        placeholder="R-Snf"
        type="number"
        value={entry.rSnf ?? ''}
        onChange={(e) => updateEntry('rSnf', e.target.value)}
      />
    </div>
  </div>
)}

      <Modal
        show={missing.length > 0}
        restoreFocus={false}
        onHide={() => closeValidation()}
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Entry Validation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ul>
            {missing.map((m) => (
              <li key={m.inputName}><strong>{m.label}</strong></li>
            ))}
          </ul>
          <strong style={{ marginLeft: 24 }}>Above mentioned field(s) are required</strong>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-primary" autoFocus onClick={() => closeValidation()}>
            OK
          </button>
        </Modal.Footer>
      </Modal>

      <div className={styles.grid}>
        <div className={styles.headerCell} style={{ gridColumn: '1', gridRow: '1 / 3' }}>Code</div>
        <div className={styles.headerCell} style={{ gridColumn: '2', gridRow: '1 / 3' }}>Name</div>
        <div className={styles.headerCell} style={{ gridColumn: '3', gridRow: '1 / 3' }}>Adv No</div>
        <div className={styles.headerGroup} style={{ gridColumn: '4 / 7', gridRow: '1' }}>Front</div>
        <div className={styles.headerGroup} style={{ gridColumn: '7 / 10', gridRow: '1' }}>Middle</div>
        <div className={styles.headerGroup} style={{ gridColumn: '10 / 13', gridRow: '1' }}>Rear</div>
        <div className={styles.headerCell} style={{ gridColumn: '13', gridRow: '1 / 3' }}>Total Litre</div>
        <div className={styles.headerCell} style={{ gridColumn: '14', gridRow: '1 / 3' }}>Action</div>
        <div className={styles.headerCell} style={{ gridColumn: '4', gridRow: '2' }}>Litre</div>
        <div className={styles.headerCell} style={{ gridColumn: '5', gridRow: '2' }}>Fat</div>
        <div className={styles.headerCell} style={{ gridColumn: '6', gridRow: '2' }}>Snf</div>
        <div className={styles.headerCell} style={{ gridColumn: '7', gridRow: '2' }}>Litre</div>
        <div className={styles.headerCell} style={{ gridColumn: '8', gridRow: '2' }}>Fat</div>
        <div className={styles.headerCell} style={{ gridColumn: '9', gridRow: '2' }}>Snf</div>
        <div className={styles.headerCell} style={{ gridColumn: '10', gridRow: '2' }}>Litre</div>
        <div className={styles.headerCell} style={{ gridColumn: '11', gridRow: '2' }}>Fat</div>
        <div className={styles.headerCell} style={{ gridColumn: '12', gridRow: '2' }}>Snf</div>

        {lines.length === 0 && <div className={styles.empty}>No BMC lines{editable ? ' added yet' : ''}</div>}

       {lines.map((line, index) => (
  // display: contents keeps the cells as direct grid items while letting one handler cover the whole row
  <div
    key={index}
    style={{ display: 'contents' }}
    onDoubleClick={(e) => {
      if (!editable || (e.target as HTMLElement).closest('button')) return
      editLine(index)
    }}
    title={editable ? 'Double click to edit' : ''}
  >
    <div className={styles.cell}>{line.bmcCode}</div>

    <div className={styles.cell}>{line.bmcName}</div>

    <div className={styles.cell}>{line.advNo}</div>
    <div className={styles.cell}>{line.fLitre}</div>
    <div className={styles.cell}>{line.fFat}</div>
    <div className={styles.cell}>{line.fSnf}</div>
    <div className={styles.cell}>{line.mLitre}</div>
    <div className={styles.cell}>{line.mFat}</div>
    <div className={styles.cell}>{line.mSnf}</div>
    <div className={styles.cell}>{line.rLitre}</div>
    <div className={styles.cell}>{line.rFat}</div>
    <div className={styles.cell}>{line.rSnf}</div>

    <div className={styles.cell}>
      {totalLitre(line).toFixed(2)}
    </div>

    <div className={styles.cell}>
      {editable && (
        <button
          type="button"
          className={styles.removeButton}
          title="Remove"
          aria-label="Remove"
          onClick={() => removeLine(index)}
        >
          <DeleteIcon size={15} />
        </button>
      )}
    </div>
  </div>
))}

        {lines.length > 0 && (
          <>
            <div className={styles.footerCell}>Total</div>
            <div className={styles.footerCell} />
            <div className={styles.footerCell} />
            <div className={styles.footerCell}>{columnTotal('fLitre').toFixed(2)}</div>
            <div className={styles.footerCell} />
            <div className={styles.footerCell} />
            <div className={styles.footerCell}>{columnTotal('mLitre').toFixed(2)}</div>
            <div className={styles.footerCell} />
            <div className={styles.footerCell} />
            <div className={styles.footerCell}>{columnTotal('rLitre').toFixed(2)}</div>
            <div className={styles.footerCell} />
            <div className={styles.footerCell} />
            <div className={styles.footerCell}>{grandTotal.toFixed(2)}</div>
            <div className={styles.footerCell} />
          </>
        )}
      </div>
    </div>
  )
}
