import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn } from '@progress/kendo-react-grid'
import { PDFExport } from '@progress/kendo-react-pdf'
import { DatePicker } from '@progress/kendo-react-dateinputs'
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetHonorariumList } from '../../apiclient/report/use-get-honorarium-list'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type { Honorarium } from '../../models/Report/Honorarium'
import type Bmc from '../../models/masters/Bmc'

interface HonorariumOld27052024GridRow {
  serialNo: number
  bmc: string
  fatSnf: string
  litre: number
  rate: number
  amount: number
  type: string
}

const ALL_BMC: Bmc = {
  bmcId: 0,
  name: '-All-',
}

const formatDate = (date: Date | null): string => {
  if (!date) {
    return ''
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${year}-${month}-${day}`
}


const calculateRow = (
  item: Honorarium,
  serialNo: number
): HonorariumOld27052024GridRow => {
  const litre = Number(item.litre ?? 0)
  const rate = Number(item.rate ?? 0)
  const amount = litre * rate

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    fatSnf: item.description ?? '',
    litre,
    rate: Number(rate.toFixed(2)),
    amount: Number(amount.toFixed(2)),
    type: item.typ ?? '',
  }
}

export function HonorariumListOld27052024Page() {
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(
    new Date()
  )
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(
    new Date()
  )

  const [selectedBmc, setSelectedBmc] = useState<Bmc>(ALL_BMC)

  const [committedFilters, setCommittedFilters] = useState<{
    fromDate: string
    toDate: string
    bmcId: number
  } | null>(null)

  const pdfExportRef = useRef<PDFExport>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)

  const { data: bmcList = [] } = useGetBmcs()
  const bmcs = useMemo(() => [ALL_BMC, ...bmcList], [bmcList])

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetHonorariumList({
    variables: committedFilters ?? { fromDate: '', toDate: '', bmcId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<HonorariumOld27052024GridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateRow(item, index + 1))
  }, [result])

  useEffect(() => {
    if (committedFilters && !isLoading && !error && gridData.length === 0) {
      setShowNoDataDialog(true)
    }
  }, [committedFilters, isLoading, error, gridData])

  const totals = useMemo(() => {
    const raw = gridData.reduce(
      (total, row) => {
        total.litre += row.litre
        total.rate += row.rate
        total.amount += row.amount

        return total
      },
      { litre: 0, rate: 0, amount: 0 }
    )

    return {
      litre: raw.litre.toFixed(1),
      rate: raw.rate.toFixed(2),
      amount: raw.amount.toFixed(1),
    }
  }, [gridData])

  const handleGenerate = () => {
    if (!selectedFromDate || !selectedToDate) {
      window.alert('Please Select Date')
      return
    }

    if (selectedFromDate > selectedToDate) {
      window.alert('Fromdate cannot be greater than Todate')
      return
    }

    setCommittedFilters({
      fromDate: formatDate(selectedFromDate),
      toDate: formatDate(selectedToDate),
      bmcId: selectedBmc?.bmcId ?? 0,
    })
  }

  const handlePDFExport =() => {
    if (pdfExportRef.current) {
      setIsPdf(true)
      setTimeout(() => {
        pdfExportRef.current?.save()
        setIsPdf(false)
      }, 100)
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '25px',
        }}
      >
        7. Honorarium List
      </h3>

      {/* Filter section */}
      <div
        style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '5px',
          background: '#f5f5f5',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'end',
            gap: '25px',
            flexWrap: 'nowrap',
          }}
        >
          {/* From Date */}
          <div style={{ flexShrink: 0, width: '200px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 500,
              }}
            >
              From Date *
            </label>

            <DatePicker
              value={selectedFromDate}
              format="dd-MM-yyyy"
              onChange={(event) => setSelectedFromDate(event.value)}
              style={{
                width: '100%',
              }}
            />
          </div>

          {/* To Date */}
          <div style={{ flexShrink: 0, width: '200px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 500,
              }}
            >
              To Date *
            </label>

            <DatePicker
              value={selectedToDate}
              format="dd-MM-yyyy"
              onChange={(event) => setSelectedToDate(event.value)}
              style={{
                width: '100%',
              }}
            />
          </div>

          {/* BMC */}
          <div style={{ flexShrink: 0, width: '250px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 500,
              }}
            >
              BMC *
            </label>

            <DropDownList
              data={bmcs}
              textField="name"
              dataItemKey="bmcId"
              value={selectedBmc}
              onChange={(event) => setSelectedBmc(event.value)}
              style={{
                width: '100%',
              }}
            />
          </div>

          {/* Generate */}
          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success"
              onClick={handleGenerate}
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Export — only PDF, matching the legacy UI (its Excel dropdown
          item is commented out) */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '15px',
        }}
      >
        <button
          type="button"
          className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-info"
          onClick={handlePDFExport}
          disabled={gridData.length === 0}
        >
          PDF
        </button>
      </div>

      {/* Loading */}
      {isLoading && <div style={{ marginBottom: '10px' }}>Loading...</div>}

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: '10px',
            color: 'red',
          }}
        >
          Failed to load report.
        </div>
      )}

      {/* No data */}
      {showNoDataDialog && (
        <Dialog
          title="No Data"
          onClose={() => setShowNoDataDialog(false)}
          width={600}
          style={{ justifyContent: 'flex-start', paddingTop: 40 }}
        >
          <p>No Data Found</p>
          <DialogActionsBar layout="end">
            <button
              type="button"
              className="k-button k-button-sm k-rounded-md k-button-solid k-button-solid-primary"
              style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd', color: '#fff' }}
              onClick={() => setShowNoDataDialog(false)}
            >
              OK
            </button>
          </DialogActionsBar>
        </Dialog>
      )}

      <PDFExport
        ref={pdfExportRef}
        paperSize="A4"
        landscape={true}
        margin="1cm"
        scale={0.85}
        keepTogether="tr"
        fileName={`HonorariumListOld27052024_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
      >
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
          <div style={{ fontSize: '1.2rem' }}>7. Honorarium List</div>
          <div style={{ fontSize: '1rem' }}>From: {committedFilters?.fromDate ?? '-'} &nbsp;|&nbsp; To: {committedFilters?.toDate ?? '-'} &nbsp;|&nbsp; BMC: {selectedBmc?.name ?? '-'}</div>
        </div>
        <Grid
          data={gridData}
          className="honorariumListOld27052024Grid"
          style={{
            height: '500px',
            width: '100%',
          }}
        >
          <GridColumn field="serialNo" title="S.No" width="80px" />

          <GridColumn field="bmc" title="BmcId" width="180px" />

          <GridColumn
            field="fatSnf"
            title="Fat & Snf"
            width="150px"
            cells={{
              footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
            }}
          />

          <GridColumn
            field="litre"
            title="Litres"
            width="100px"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.litre}
                </td>
              ),
            }}
          />

          <GridColumn
            field="rate"
            title="Rate"
            width="90px"
            format="{0:n2}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.rate}
                </td>
              ),
            }}
          />

          <GridColumn
            field="amount"
            title="Amt"
            width="100px"
            format="{0:n2}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.amount}
                </td>
              ),
            }}
          />
        </Grid>
      </PDFExport>
    </div>
  )
}
