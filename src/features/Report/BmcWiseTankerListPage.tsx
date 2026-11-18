/*  13. BMC-Tanker Register */
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
import { useGetBmcWiseTankerDiff } from '../../apiclient/report/use-get-bmc-wise-tanker-diff'
import { useGetBmcWiseAckregDiff } from '../../apiclient/report/use-get-bmc-wise-ackreg-diff'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type Destination from '../../models/masters/Destination'
import type { BMCAckRegDiff } from '../../models/Report/BMCAckRegDiff'
import type { BmcWiseTankerDiff } from '../../models/Report/BmcWiseTankerDiff'
import { safePercent } from '../../utils/safePercent'

interface BmcWiseTankerGridRow {
  serialNo: number
  date: string
  bmc: string
  invNo: string
  invLitre: number
  invLitFat: number
  invLitSnf: number
  invLitTs: number
  ackLitre: number
  ackLitFat: number
  ackLitSnf: number
  ackLitTs: number
  diffLitre: number
  diffLitFat: number
  diffLitFatP: number
  diffLitSnf: number
  diffLitSnfP: number
  diffLitTs: number
  diffLitTsP: number
}

type TankerDiffSource = (BmcWiseTankerDiff | BMCAckRegDiff) & {
  mLitre?: number
  mLitFat?: number
  mLitSnf?: number
  amLitre?: number
  amLitFat?: number
  amLitSnf?: number
}

const ALL_DESTINATION: Destination = {
  destinationId: 0,
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

const sumInvAck = (item: TankerDiffSource) => {
  const fLitre = Number(item.fLitre ?? 0)
  const rLitre = Number(item.rLitre ?? 0)
  const mLitre = Number(item.mLitre ?? 0)
  const fLitFat = Number(item.fLitFat ?? 0)
  const rLitFat = Number(item.rLitFat ?? 0)
  const mLitFat = Number(item.mLitFat ?? 0)
  const fLitSnf = Number(item.fLitSnf ?? 0)
  const rLitSnf = Number(item.rLitSnf ?? 0)
  const mLitSnf = Number(item.mLitSnf ?? 0)
  const afLitre = Number(item.afLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const afLitFat = Number(item.afLitFat ?? 0)
  const arLitFat = Number(item.arLitFat ?? 0)
  const amLitFat = Number(item.amLitFat ?? 0)
  const afLitSnf = Number(item.afLitSnf ?? 0)
  const arLitSnf = Number(item.arLitSnf ?? 0)
  const amLitSnf = Number(item.amLitSnf ?? 0)
  const invLitre = fLitre + rLitre + mLitre
  const invLitFat = fLitFat + rLitFat + mLitFat
  const invLitSnf = fLitSnf + rLitSnf + mLitSnf
  const invLitTs = invLitFat + invLitSnf
  const ackLitre = afLitre + arLitre + amLitre
  const ackLitFat = afLitFat + arLitFat + amLitFat
  const ackLitSnf = afLitSnf + arLitSnf + amLitSnf
  const ackLitTs = ackLitFat + ackLitSnf

  return { invLitre, invLitFat, invLitSnf, invLitTs, ackLitre, ackLitFat, ackLitSnf, ackLitTs }
}


const calculateRow = (
  item: TankerDiffSource,
  serialNo: number
): BmcWiseTankerGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  const { invLitre, invLitFat, invLitSnf, invLitTs, ackLitre, ackLitFat, ackLitSnf, ackLitTs } =
    sumInvAck(item)

  const diffLitre = ackLitre - invLitre
  const diffLitFat = ackLitFat - invLitFat
  const diffLitSnf = ackLitSnf - invLitSnf
  const diffLitFatP = invLitFat ? safePercent(diffLitFat, invLitFat) : 0
  const diffLitSnfP = invLitSnf ? safePercent(diffLitSnf, invLitSnf) : 0
  const diffLitTs = diffLitFat + diffLitSnf
  const diffLitTsP = diffLitFatP + diffLitSnfP

  return {
    serialNo,
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    invNo: item.invoiceNo ?? '',
    invLitre: Number(invLitre.toFixed(1)),
    invLitFat: Number(invLitFat.toFixed(3)),
    invLitSnf: Number(invLitSnf.toFixed(3)),
    invLitTs: Number(invLitTs.toFixed(3)),
    ackLitre: Number(ackLitre.toFixed(1)),
    ackLitFat: Number(ackLitFat.toFixed(3)),
    ackLitSnf: Number(ackLitSnf.toFixed(3)),
    ackLitTs: Number(ackLitTs.toFixed(3)),
    diffLitre: Number(diffLitre.toFixed(1)),
    diffLitFat: Number(diffLitFat.toFixed(3)),
    diffLitFatP: Number(diffLitFatP.toFixed(3)),
    diffLitSnf: Number(diffLitSnf.toFixed(3)),
    diffLitSnfP: Number(diffLitSnfP.toFixed(3)),
    diffLitTs: Number(diffLitTs.toFixed(3)),
    diffLitTsP: Number(diffLitTsP.toFixed(3)),
  }
}


const calculateExportRow = (
  item: TankerDiffSource,
  serialNo: number
): BmcWiseTankerGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  const { invLitre, invLitFat, invLitSnf, invLitTs, ackLitre, ackLitFat, ackLitSnf, ackLitTs } =
    sumInvAck(item)

  const diffLitre = ackLitre - invLitre
  const diffLitFat = ackLitFat - invLitFat
  const diffLitSnf = ackLitSnf - invLitSnf
  const diffLitFatP = safePercent(diffLitFat, invLitFat)
  const diffLitSnfP = safePercent(diffLitSnf, invLitSnf)
  const diffLitTs = diffLitFat + diffLitFatP
  const diffLitTsP = diffLitFatP + diffLitSnfP

  return {
    serialNo,
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    invNo: item.invoiceNo ?? '',
    invLitre: Number(invLitre.toFixed(1)),
    invLitFat: Number(invLitFat.toFixed(3)),
    invLitSnf: Number(invLitSnf.toFixed(3)),
    invLitTs: Number(invLitTs.toFixed(3)),
    ackLitre: Number(ackLitre.toFixed(1)),
    ackLitFat: Number(ackLitFat.toFixed(3)),
    ackLitSnf: Number(ackLitSnf.toFixed(3)),
    ackLitTs: Number(ackLitTs.toFixed(3)),
    diffLitre: Number(diffLitre.toFixed(1)),
    diffLitFat: Number(diffLitFat.toFixed(3)),
    diffLitFatP: Number(diffLitFatP.toFixed(3)),
    diffLitSnf: Number(diffLitSnf.toFixed(3)),
    diffLitSnfP: Number(diffLitSnfP.toFixed(3)),
    diffLitTs: Number(diffLitTs.toFixed(3)),
    diffLitTsP: Number(diffLitTsP.toFixed(3)),
  }
}
export function BmcWiseTankerListPage() {
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(new Date())

  const [selectedToDate, setSelectedToDate] = useState<Date | null>(new Date())

  const [selectedDestination, setSelectedDestination] =
    useState<Destination>(ALL_DESTINATION)

 

  const [committedFilters, setCommittedFilters] = useState<{
    fromDate: string
    toDate: string
    destinationId: number
  } | null>(null)

  const pdfExportRef = useRef<PDFExport>(null)
  const excelExportRef = useRef<ExcelExport>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)

  const { data: destinationList = [] } = useGetDestinations()
  const destinations = useMemo(
    () => [ALL_DESTINATION, ...destinationList],
    [destinationList]
  )

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetBmcWiseTankerDiff({
    variables: committedFilters ?? { fromDate: '', toDate: '', destinationId: 0 },
    enabled: committedFilters !== null,
  })

  
  const { data: exportResult = [] } = useGetBmcWiseAckregDiff({
    variables: {
      fromDate: committedFilters?.fromDate ?? '',
      toDate: committedFilters?.toDate ?? '',
      bmcId: committedFilters?.destinationId ?? 0,
    },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<BmcWiseTankerGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateRow(item, index + 1))
  }, [result])

  const exportData = useMemo<BmcWiseTankerGridRow[]>(() => {
    if (!exportResult || exportResult.length === 0) {
      return []
    }

    return exportResult.map((item, index) => calculateExportRow(item, index + 1))
  }, [exportResult])

  const [dataState, setDataState] = useState<State>({ skip: 0, take: 10 })

  useEffect(() => {
    setDataState((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }))
  }, [gridData.length])

  useEffect(() => {
    if (committedFilters && !isLoading && !error && gridData.length === 0) {
      setShowNoDataDialog(true)
    }
  }, [committedFilters, isLoading, error, gridData])

  const pagedResult = process(gridData, dataState)

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.invLitre += row.invLitre
        total.invLitFat += row.invLitFat
        total.invLitSnf += row.invLitSnf
        total.invLitTs += row.invLitTs
        total.ackLitre += row.ackLitre
        total.ackLitFat += row.ackLitFat
        total.ackLitSnf += row.ackLitSnf
        total.ackLitTs += row.ackLitTs
        total.diffLitre += row.diffLitre
        total.diffLitFat += row.diffLitFat
        total.diffLitFatP += row.diffLitFatP
        total.diffLitSnf += row.diffLitSnf
        total.diffLitSnfP += row.diffLitSnfP
        total.diffLitTs += row.diffLitTs
        total.diffLitTsP += row.diffLitTsP

        return total
      },
      {
        invLitre: 0,
        invLitFat: 0,
        invLitSnf: 0,
        invLitTs: 0,
        ackLitre: 0,
        ackLitFat: 0,
        ackLitSnf: 0,
        ackLitTs: 0,
        diffLitre: 0,
        diffLitFat: 0,
        diffLitFatP: 0,
        diffLitSnf: 0,
        diffLitSnfP: 0,
        diffLitTs: 0,
        diffLitTsP: 0,
      }
    )
  }, [gridData])

  const calculateGroupTotals = (rows: BmcWiseTankerGridRow[]) =>
    rows.reduce(
      (total, row) => {
        total.invLitre += row.invLitre
        total.invLitFat += row.invLitFat
        total.invLitSnf += row.invLitSnf
        total.invLitTs += row.invLitTs
        total.ackLitre += row.ackLitre
        total.ackLitFat += row.ackLitFat
        total.ackLitSnf += row.ackLitSnf
        total.ackLitTs += row.ackLitTs
        total.diffLitre += row.diffLitre
        total.diffLitFat += row.diffLitFat
        total.diffLitFatP += row.diffLitFatP
        total.diffLitSnf += row.diffLitSnf
        total.diffLitSnfP += row.diffLitSnfP
        total.diffLitTs += row.diffLitTs
        total.diffLitTsP += row.diffLitTsP

        return total
      },
      {
        invLitre: 0,
        invLitFat: 0,
        invLitSnf: 0,
        invLitTs: 0,
        ackLitre: 0,
        ackLitFat: 0,
        ackLitSnf: 0,
        ackLitTs: 0,
        diffLitre: 0,
        diffLitFat: 0,
        diffLitFatP: 0,
        diffLitSnf: 0,
        diffLitSnfP: 0,
        diffLitTs: 0,
        diffLitTsP: 0,
      }
    )

  // PDF column groups: Invoiced (4), Acknowledged (4), Difference (7)
  type TotalsKey = keyof ReturnType<typeof calculateGroupTotals>
  const pdfGroups: { id: string; title: string; columns: { key: TotalsKey; title: string; digits: number }[] }[] = [
    {
      id: 'pdf-group-inv',
      title: 'Invoiced',
      columns: [
        { key: 'invLitre', title: 'Litre', digits: 1 },
        { key: 'invLitFat', title: 'LitFat', digits: 3 },
        { key: 'invLitSnf', title: 'LitSnf', digits: 3 },
        { key: 'invLitTs', title: 'LitTs', digits: 3 },
      ],
    },
    {
      id: 'pdf-group-ack',
      title: 'Acknowledged',
      columns: [
        { key: 'ackLitre', title: 'Litre', digits: 1 },
        { key: 'ackLitFat', title: 'LitFat', digits: 3 },
        { key: 'ackLitSnf', title: 'LitSnf', digits: 3 },
        { key: 'ackLitTs', title: 'LitTs', digits: 3 },
      ],
    },
    {
      id: 'pdf-group-diff',
      title: 'Difference',
      columns: [
        { key: 'diffLitre', title: 'Litre', digits: 1 },
        { key: 'diffLitFat', title: 'LitFat', digits: 3 },
        { key: 'diffLitFatP', title: 'LitFat%', digits: 3 },
        { key: 'diffLitSnf', title: 'LitSnf', digits: 3 },
        { key: 'diffLitSnfP', title: 'LitSnf%', digits: 3 },
        { key: 'diffLitTs', title: 'LitTs', digits: 3 },
        { key: 'diffLitTsP', title: 'LitTs%', digits: 3 },
      ],
    },
  ]

  const pdfBmcGroups = useMemo(() => {
    const groups = new Map<string, BmcWiseTankerGridRow[]>()

    gridData.forEach((row) => {
      const bmc = row.bmc || '-'

      if (!groups.has(bmc)) {
        groups.set(bmc, [])
      }

      groups.get(bmc)!.push(row)
    })

    // Sort BMCs by BMC code: 101, 102, 103, ...
    return Array.from(groups.entries())
      .map(([bmc, rows]) => ({ bmc, rows }))
      .sort((a, b) => {
        const codeA = Number.parseInt(a.bmc.split('-')[0], 10)
        const codeB = Number.parseInt(b.bmc.split('-')[0], 10)

        if (Number.isNaN(codeA) && Number.isNaN(codeB)) {
          return a.bmc.localeCompare(b.bmc)
        }

        if (Number.isNaN(codeA)) {
          return 1
        }

        if (Number.isNaN(codeB)) {
          return -1
        }

        return codeA - codeB
      })
  }, [gridData])

  const handleGenerate = () => {
    if (!selectedFromDate || !selectedToDate) {
      window.alert('Please Select Date')
      return
    }

    if (selectedFromDate > selectedToDate) {
      window.alert('From date cannot be greater than To date')
      return
    }

    setCommittedFilters({
      fromDate: formatDate(selectedFromDate),
      toDate: formatDate(selectedToDate),
      destinationId: selectedDestination?.destinationId ?? 0,
    })
  }

  const handlePDFExport = () => {
      // The PDF is built from the full result off-screen, so the visible grid's paging is left untouched
      setIsPdf(true)

      setTimeout(() => {
        pdfExportRef.current?.save()
        setIsPdf(false)
      }, 100)
  }

 const handleExcelExport = () => {
  if (excelExportRef.current) {
    const options = excelExportRef.current.workbookOptions()
    const sheet = options.sheets?.[0]

    if (sheet) {
      // Keep only the actual grid data.
      // Do not add title, From Date, To Date, or Destination rows.
      sheet.rows = [...(sheet.rows ?? [])]
    }

    excelExportRef.current.save(options)
  }
}

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <>
    <PdfPageHeader
      title="13. BMC-Tanker Register"
      subtitle={`TANKER ARRIVALS FROM BMC TO FBD(TIRUPUR) DAIRY  form  : ${formatPdfHeaderDate(selectedFromDate) || '-'}  --  ${formatPdfHeaderDate(selectedToDate) || '-'}`}
    />
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '15px',
        width: 'auto',
        textAlign: 'right',
        fontSize: '12px',
        whiteSpace: 'nowrap',
      }}
    >
      Page - {props.pageNum}
    </div>
    </>
  )

  return (
    <div style={{ padding: '20px' }}>
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '25px',
        }}
      >
        13. BMC-Tanker Register
      </h3>

    
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

          {/* Destination */}
          <div style={{ flexShrink: 0, width: '250px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 500,
              }}
            >
              Destination *
            </label>

            <DropDownList
              data={destinations}
              textField="name"
              dataItemKey="destinationId"
              value={selectedDestination}
              onChange={(event) => setSelectedDestination(event.value)}
              className="bmcWiseTankerDestination"
              style={{
                width: '100%',
                height: '35px',
              }}
            />
          </div>

          {/* Generate */}
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

      {/* Export */}
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

      {/* PDF export wrapper */}
      {isPdf && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
      <PDFExport
        ref={pdfExportRef}
        paperSize="A3"
        landscape={false}
        margin={PDF_HEADER_MARGIN}
        scale={0.50}
        keepTogether=".pdf-keep-together"
        pageTemplate={PageTemplate}
        fileName={`BmcWiseTankerList_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
      >
            <>
            {pdfBmcGroups.map((group) => {
              const groupTotals = calculateGroupTotals(group.rows)

              return (
                <div key={group.bmc} className="pdf-keep-together" style={{ marginBottom: '15px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                    {`BmcName:  ${group.bmc}`}
                  </div>

                  {/* Group header band — one cell per group, widths match the grid columns below */}
                  <div style={{ display: 'flex', width: '1720px', boxSizing: 'border-box', fontWeight: 'bold', textAlign: 'center', border: '1px solid #dee2e6', borderBottom: 'none', background: '#f8f9fa' }}>
                    <div style={{ width: '520px', flexShrink: 0, padding: '6px 0' }}>&nbsp;</div>
                    {pdfGroups.map((pdfGroup) => (
                      <div key={pdfGroup.id} style={{ width: `${pdfGroup.columns.length * 80}px`, flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>
                        {pdfGroup.title}
                      </div>
                    ))}
                  </div>
                  <Grid data={group.rows} groupable={false} sortable={false} scrollable="none" style={{ width: '1720px' }}>
                    <GridColumn field="serialNo" title="S.No" width="50px" headerClassName="text-center fw-bold" />
                    <GridColumn field="date" title="Date" width="120px" headerClassName="text-center fw-bold" />
                    <GridColumn field="bmc" title="Bmc" width="250px" headerClassName="text-center fw-bold" />
                    <GridColumn
                      field="invNo"
                      title="Inv No"
                      width="100px"
                      headerClassName="text-center fw-bold"
                      cells={{
                        footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                      }}
                    />
                    {pdfGroups.flatMap((pdfGroup) =>
                      pdfGroup.columns.map((col) => (
                        <GridColumn
                          key={col.key}
                          field={col.key}
                          title={col.title}
                          width="80px"
                          headerClassName="text-center fw-bold"
                          format={`{0:n${col.digits}}`}
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals[col.key].toFixed(col.digits)}
                              </td>
                            ),
                          }}
                        />
                      ))
                    )}
                  </Grid>
                </div>
              )
            })}
            </>
          </PDFExport>
        </div>
      )}
          <Grid
            data={pagedResult}
            {...dataState}
            onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
            sortable
            pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
            className="bmcWiseTankerGrid"
            style={{
              width: '100%',
            }}
          >
            <GridColumn field="serialNo" title="S.No" width="70px"  headerClassName="text-center fw-bold" />
            <GridColumn field="date" title="Date" width="100px"  headerClassName="text-center fw-bold"/>
            <GridColumn field="bmc" title="Bmc" width="250px"  headerClassName="text-center fw-bold"/>
            <GridColumn
              field="invNo"
              title="Inv No"
              width="200px"
               headerClassName="text-center fw-bold"
              cells={{
                footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
              }}
            />

            <GridColumn title="Invoiced"  headerClassName="text-center fw-bold">
              <GridColumn
                field="invLitre"
                title="Litre"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.invLitre.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="invLitFat"
                title="LitFat"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.invLitFat.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="invLitSnf"
                title="LitSnf"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.invLitSnf.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="invLitTs"
                title="LtTs"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.invLitTs.toFixed(3)}
                    </td>
                  ),
                }}
              />
            </GridColumn>

            <GridColumn title="Ack"  headerClassName="text-center fw-bold">
              <GridColumn
                field="ackLitre"
                title="Litre"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.ackLitre.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="ackLitFat"
                title="LitFat"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.ackLitFat.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="ackLitSnf"
                title="LitSnf"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.ackLitSnf.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="ackLitTs"
                title="LtTs"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.ackLitTs.toFixed(3)}
                    </td>
                  ),
                }}
              />
            </GridColumn>

            <GridColumn title="Difference"  headerClassName="text-center fw-bold">
              <GridColumn
                field="diffLitre"
                title="Litre"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffLitre.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="diffLitFat"
                title="LitFat"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffLitFat.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="diffLitFatP"
                title="LitFat%"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffLitFatP.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="diffLitSnf"
                title="LitSnf"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffLitSnf.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="diffLitSnfP"
                title="LitSnf%"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffLitSnfP.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="diffLitTs"
                title="LitTs"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffLitTs.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="diffLitTsP"
                title="LitTs%"
                width="125px"
                 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffLitTsP.toFixed(3)}
                    </td>
                  ),
                }}
              />
            </GridColumn>
          </Grid>

      {/* Excel export — explicit columns matching the export row shape */}
      <ExcelExport
        ref={excelExportRef}
        data={exportData}
        fileName={`BmcWiseTanker_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="serialNo" title="S.No" width={70} />
        <ExcelExportColumn field="date" title="Date" width={100} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn field="invNo" title="Inv No" width={200} />

        <ExcelExportColumn title="Invoiced">
          <ExcelExportColumn field="invLitre" title="Litre" width={90} />
          <ExcelExportColumn field="invLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="invLitSnf" title="LitSnf" width={90} />
          <ExcelExportColumn field="invLitTs" title="LtTs" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Ack">
          <ExcelExportColumn field="ackLitre" title="Litre" width={90} />
          <ExcelExportColumn field="ackLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="ackLitSnf" title="LitSnf" width={90} />
          <ExcelExportColumn field="ackLitTs" title="LtTs" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Difference">
          <ExcelExportColumn field="diffLitre" title="Litre" width={90} />
          <ExcelExportColumn field="diffLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="diffLitFatP" title="LitFat%" width={90} />
          <ExcelExportColumn field="diffLitSnf" title="LitSnf" width={90} />
          <ExcelExportColumn field="diffLitSnfP" title="LitSnf%" width={90} />
          <ExcelExportColumn field="diffLitTs" title="LitTs" width={90} />
          <ExcelExportColumn field="diffLitTsP" title="LitTs%" width={90} />
        </ExcelExportColumn>
      </ExcelExport>
    </div>
  )
}
