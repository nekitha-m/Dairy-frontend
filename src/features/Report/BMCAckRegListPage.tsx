/* 2. Ack.Register1(Dairy) */
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetBmcWiseAckregDiff } from '../../apiclient/report/use-get-bmc-wise-ackreg-diff'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type { BMCAckRegDiff } from '../../models/Report/BMCAckRegDiff'
import type Bmc from '../../models/masters/Bmc'

interface BMCAckRegListGridRow {
  date: string
  bmc: string
  advNo: string
  fLitre: number
  fFat: number
  fSnf: number
  fLitFat: number
  fLitSnf: number
  fMbrt: number
  mLitre: number
  mFat: number
  mSnf: number
  mLitFat: number
  mLitSnf: number
  mMbrt: number
  rLitre: number
  rFat: number
  rSnf: number
  rLitFat: number
  rLitSnf: number
  rMbrt: number
}

interface BMCAckRegListExportRow {
  date: string
  bmc: string
  advNo: string
  fLitre: number
  fFat: number
  fSnf: number
  fMbrt: number
  mLitre: number
  mFat: number
  mSnf: number
  mMbrt: number
  rLitre: number
  rFat: number
  rSnf: number
  rMbrt: number
}

const PDF_LEAD_COLS = [108, 185, 90]
const PDF_METRIC_COLS = [
  { key: 'Litre', title: 'Litre', width: 80, decimals: 1 },
  { key: 'Fat', title: 'Fat', width: 60, decimals: 1 },
  { key: 'Snf', title: 'Snf', width: 60, decimals: 1 },
  { key: 'LitFat', title: 'LitFat', width: 84, decimals: 3 },
  { key: 'LitSnf', title: 'LitSnf', width: 84, decimals: 3 },
  { key: 'Mbrt', title: 'MBRT', width: 80, decimals: 2 },
]
const PDF_LEAD_WIDTH = PDF_LEAD_COLS.reduce((a, b) => a + b, 0)
const PDF_GROUP_WIDTH = PDF_METRIC_COLS.reduce((a, c) => a + c.width, 0)
const PDF_TOTAL_WIDTH = PDF_LEAD_WIDTH + PDF_GROUP_WIDTH * 3

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

const formatPdfHeaderDate = (date: Date | null): string => {
  if (!date) {
    return ''
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

const calculateRow = (item: BMCAckRegDiff): BMCAckRegListGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    advNo: item.advNo ?? '',
    fLitre: Number(Number(item.afLitre ?? 0).toFixed(1)),
    fFat: Number(Number(item.afFat ?? 0).toFixed(1)),
    fSnf: Number(Number(item.afSnf ?? 0).toFixed(1)),
    fLitFat: Number(Number(item.afLitFat ?? 0).toFixed(3)),
    fLitSnf: Number(Number(item.afLitSnf ?? 0).toFixed(3)),
    fMbrt: Number(Number(item.fMbrt ?? 0).toFixed(2)),
    mLitre: Number(Number(item.amLitre ?? 0).toFixed(1)),
    mFat: Number(Number(item.amFat ?? 0).toFixed(1)),
    mSnf: Number(Number(item.amSnf ?? 0).toFixed(1)),
    mLitFat: Number(Number(item.amLitFat ?? 0).toFixed(3)),
    mLitSnf: Number(Number(item.amLitSnf ?? 0).toFixed(3)),
    mMbrt: Number(Number(item.mMbrt ?? 0).toFixed(2)),
    rLitre: Number(Number(item.arLitre ?? 0).toFixed(1)),
    rFat: Number(Number(item.arFat ?? 0).toFixed(1)),
    rSnf: Number(Number(item.arSnf ?? 0).toFixed(1)),
    rLitFat: Number(Number(item.arLitFat ?? 0).toFixed(3)),
    rLitSnf: Number(Number(item.arLitSnf ?? 0).toFixed(3)),
    rMbrt: Number(Number(item.rMbrt ?? 0).toFixed(2)),
  }
}
const calculateExportRow = (item: BMCAckRegDiff): BMCAckRegListExportRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    advNo: item.advNo ?? '',
    fLitre: Number(item.afLitre ?? 0),
    fFat: Number(item.afFat ?? 0),
    fSnf: Number(item.afSnf ?? 0),
    fMbrt: Number(item.fMbrt ?? 0),
    mLitre: Number(item.amLitre ?? 0),
    mFat: Number(item.amFat ?? 0),
    mSnf: Number(item.amSnf ?? 0),
    mMbrt: Number(item.mMbrt ?? 0),
    rLitre: Number(item.arLitre ?? 0),
    rFat: Number(item.arFat ?? 0),
    rSnf: Number(item.arSnf ?? 0),
    rMbrt: Number(item.rMbrt ?? 0),
  }
}

export function BMCAckRegListPage() {
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

  const excelExportRef = useRef<ExcelExport>(null)
  const pdfExportRef = useRef<PDFExport>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)

  const { data: bmcList = [] } = useGetBmcs()
  const bmcs = useMemo(() => [ALL_BMC, ...bmcList], [bmcList])

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetBmcWiseAckregDiff({
    variables: committedFilters ?? { fromDate: '', toDate: '', bmcId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<BMCAckRegListGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item) => calculateRow(item))
  }, [result])

  useEffect(() => {
    if (committedFilters && !isLoading && !error && gridData.length === 0) {
      setShowNoDataDialog(true)
    }
  }, [committedFilters, isLoading, error, gridData])

  const exportData = useMemo<BMCAckRegListExportRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item) => calculateExportRow(item))
  }, [result])

  const [dataState, setDataState] = useState<State>({ skip: 0, take: 10 })

  useEffect(() => {
    setDataState((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }))
  }, [gridData.length])

  const pagedResult = process(gridData, dataState)

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.fLitre += row.fLitre
        total.fFat += row.fFat
        total.fSnf += row.fSnf
        total.fLitFat += row.fLitFat
        total.fLitSnf += row.fLitSnf
        total.fMbrt += row.fMbrt
        total.mLitre += row.mLitre
        total.mFat += row.mFat
        total.mSnf += row.mSnf
        total.mLitFat += row.mLitFat
        total.mLitSnf += row.mLitSnf
        total.mMbrt += row.mMbrt
        total.rLitre += row.rLitre
        total.rFat += row.rFat
        total.rSnf += row.rSnf
        total.rLitFat += row.rLitFat
        total.rLitSnf += row.rLitSnf
        total.rMbrt += row.rMbrt

        return total
      },
      {
        fLitre: 0,
        fFat: 0,
        fSnf: 0,
        fLitFat: 0,
        fLitSnf: 0,
        fMbrt: 0,
        mLitre: 0,
        mFat: 0,
        mSnf: 0,
        mLitFat: 0,
        mLitSnf: 0,
        mMbrt: 0,
        rLitre: 0,
        rFat: 0,
        rSnf: 0,
        rLitFat: 0,
        rLitSnf: 0,
        rMbrt: 0,
      }
    )
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

  const handlePDFExport = () => {
    if (pdfExportRef.current) {
      setIsPdf(true)

      setTimeout(() => {
        pdfExportRef.current?.save()
        setIsPdf(false)
      }, 100)
    }
  }

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <>
    <PdfPageHeader
      titleSize={22}
      subtitleSize={18}
      top={30}
      title="2. Ack.Register1(Dairy)"
      subtitle={`BMC-ACKNOWLEDGEMENT REGISTER FOR THE PERIOD ${formatPdfHeaderDate(selectedFromDate) || '-'}  --  ${formatPdfHeaderDate(selectedToDate) || '-'}`}
    />
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '15px',
        width: 'auto',
        textAlign: 'right',
        fontSize: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      Page - {props.pageNum}
    </div>
    </>
  )

  const handleExcelExport = () => {
  if (excelExportRef.current) {
    const options = excelExportRef.current.workbookOptions()

    excelExportRef.current.save(options)
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
        2. Ack.Register1(Dairy)
      </h3>

      <div
        style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '5px',
          background: '#eeeeee',
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
                className="bmcWiseAckDatePicker"
                wrapperClassName="bmcWiseAckDatePickerWrapper"
                selected={selectedFromDate}
                placeholderText="From"
                dateFormat="dd-MM-yyyy"
                popperPlacement="bottom-start"
                portalId="root-portal"
                onChange={(date: Date | null) => setSelectedFromDate(date)}
              />
          </div>

         
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
                className="bmcWiseAckDatePicker"
                wrapperClassName="bmcWiseAckDatePickerWrapper"
                selected={selectedToDate}
                placeholderText="To"
                dateFormat="dd-MM-yyyy"
                popperPlacement="bottom-start"
                portalId="root-portal"
                onChange={(date: Date | null) => setSelectedToDate(date)}
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
              className="bmcAckRegListBmc"
              style={{
                width: '100%',
                height: '35px',
              }}
            />
          </div>
          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-success"
              onClick={handleGenerate}
              style={{ height: '35px' }}
            >
              Generate
            </button>
          </div>
        </div>
      </div>
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

        <button
          type="button"
          className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-info"
          onClick={handleExcelExport}
          disabled={exportData.length === 0}
        >
          Excel
        </button>
      </div>     
      {isLoading && <div style={{ marginBottom: '10px' }}>Loading...</div>}
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

      <Grid
        data={pagedResult}
        {...dataState}
        onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
        sortable
        pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
        className="bmcAckRegListCopyGrid"
        style={{
          width: '100%',
        }}
      >
        <GridColumn field="date" title="Date" width="100px"  headerClassName="text-center fw-bold" />
        <GridColumn field="bmc" title="Bmc" width="250px"  headerClassName="text-center fw-bold" />
        <GridColumn
          field="advNo"
          title="Adv No"
          width="100px"
           headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
          }}
        />
        <GridColumn title="Front"  headerClassName="text-center fw-bold">
          <GridColumn
            field="fLitre"
            title="Litre"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.fLitre.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="fFat"
            title="Fat"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.fFat.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="fSnf"
            title="Snf"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.fSnf.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="fLitFat"
            title="LitFat"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n3}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.fLitFat.toFixed(3)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="fLitSnf"
            title="LitSnf"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n3}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.fLitSnf.toFixed(3)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="fMbrt"
            title="MBRT"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n2}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.fMbrt.toFixed(2)}
                </td>
              ),
            }}
          />
        </GridColumn>
        <GridColumn title="Middle"  headerClassName="text-center fw-bold">
          <GridColumn
            field="mLitre"
            title="Litre"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.mLitre.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="mFat"
            title="Fat"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.mFat.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="mSnf"
            title="Snf"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.mSnf.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="mLitFat"
            title="LitFat"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n3}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.mLitFat.toFixed(3)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="mLitSnf"
            title="LitSnf"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n3}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.mLitSnf.toFixed(3)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="mMbrt"
            title="MBRT"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n2}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.mMbrt.toFixed(2)}
                </td>
              ),
            }}
          />
        </GridColumn>

        <GridColumn title="Rear"  headerClassName="text-center fw-bold">
          <GridColumn
            field="rLitre"
            title="Litre"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.rLitre.toFixed(1)}
                </td>
              ),
            }}
          />
          
          <GridColumn
            field="rFat"
            title="Fat"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.rFat.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="rSnf"
            title="Snf"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.rSnf.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="rLitFat"
            title="LitFat"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n3}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.rLitFat.toFixed(3)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="rLitSnf"
            title="LitSnf"
            width="120px"
             headerClassName="text-center fw-bold"
            format="{0:n3}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.rLitSnf.toFixed(3)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="rMbrt"
            title="MBRT"
            width="80px"
             headerClassName="text-center fw-bold"
            format="{0:n2}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.rMbrt.toFixed(2)}
                </td>
              ),
            }}
          />
        </GridColumn>
      </Grid>


      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0, width: `${PDF_TOTAL_WIDTH}px` }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A3"
            margin={{ ...PDF_HEADER_MARGIN, top: '2.8cm' }}
            scale={0.47}
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`AckRegister1Dairy_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
          >
            {isPdf && (
              <>
                <div style={{ width: `${PDF_TOTAL_WIDTH}px` }}>
                  {/* flex-grow values mirror the grid column widths below, so Middle starts at
                      column 10 and Rear at column 16, exactly like the grid. */}
                  <div style={{ display: 'flex', width: `${PDF_TOTAL_WIDTH}px`, boxSizing: 'border-box', fontWeight: 'bold', textAlign: 'center', border: '1px solid #dee2e6', borderBottom: 'none', background: '#f8f9fa' }}>
                    <div style={{ flex: `${PDF_LEAD_WIDTH} 0 0`, minWidth: 0, padding: '6px 0' }}>&nbsp;</div>
                    {['Front', 'Middle', 'Rear'].map((label) => (
                      <div key={label} style={{ flex: `${PDF_GROUP_WIDTH} 0 0`, minWidth: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>{label}</div>
                    ))}
                  </div>
                  <Grid
                    data={gridData}
                    groupable={false}
                    sortable={false}
                    scrollable="none"
                    className="bmcAckRegPdfGrid"
                    style={{ width: `${PDF_TOTAL_WIDTH}px` }}
                  >
                    <GridColumn field="date" title="Date" width={`${PDF_LEAD_COLS[0]}px`} headerClassName="text-center fw-bold" />
                    <GridColumn field="bmc" title="Bmc" width={`${PDF_LEAD_COLS[1]}px`} headerClassName="text-center fw-bold" />
                    <GridColumn
                      field="advNo"
                      title="Adv No"
                      width={`${PDF_LEAD_COLS[2]}px`}
                      headerClassName="text-center fw-bold"
                      cells={{
                        footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                      }}
                    />
                    {['f', 'm', 'r'].flatMap((prefix) =>
                      PDF_METRIC_COLS.map(({ key, title, width, decimals }) => {
                        const field = `${prefix}${key}`
                        return (
                          <GridColumn
                            key={field}
                            field={field}
                            title={title}
                            width={`${width}px`}
                            headerClassName="text-center fw-bold"
                            format={`{0:n${decimals}}`}
                            cells={{
                              footerCell: () => (
                                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                  {((totals as unknown as Record<string, number>)[field] ?? 0).toFixed(decimals)}
                                </td>
                              ),
                            }}
                          />
                        )
                      })
                    )}
                  </Grid>
                </div>
              </>
            )}
          </PDFExport>
        </div>
      )}

      <ExcelExport
        ref={excelExportRef}
        data={exportData}
        fileName={`AckRegister1-${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="date" title="Date" width={100} />
        <ExcelExportColumn field="bmc" title="Bmc" width={180} />
        <ExcelExportColumn field="advNo" title="Adv No" width={100} />
        <ExcelExportColumn title="Front">
          <ExcelExportColumn field="fLitre" title="Litre" width={90} />
          <ExcelExportColumn field="fFat" title="Fat" width={80} />
          <ExcelExportColumn field="fSnf" title="Snf" width={80} />
          <ExcelExportColumn field="fMbrt" title="MBRT" width={80} />
        </ExcelExportColumn>
        <ExcelExportColumn title="Middle">
          <ExcelExportColumn field="mLitre" title="Litre" width={90} />
          <ExcelExportColumn field="mFat" title="Fat" width={80} />
          <ExcelExportColumn field="mSnf" title="Snf" width={80} />
          <ExcelExportColumn field="mMbrt" title="MBRT" width={80} />
        </ExcelExportColumn>
        <ExcelExportColumn title="Rear">
          <ExcelExportColumn field="rLitre" title="Litre" width={90} />
          <ExcelExportColumn field="rFat" title="Fat" width={80} />
          <ExcelExportColumn field="rSnf" title="Snf" width={80} />
          <ExcelExportColumn field="rMbrt" title="MBRT" width={80} />
        </ExcelExportColumn>
      </ExcelExport>
    </div>
  )
}
