/*  4. Check-Acknowledgement Register */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { useGetCheckAckList } from '../../apiclient/report/use-get-check-ack-list'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type { CheckAckList } from '../../models/Report/CheckAckList'
import type Destination from '../../models/masters/Destination'

interface CheckAckGridRow {
  date: string
  bmc: string
  invNo: string
  tankerNo: number | string
  fLitre: number
  fFat: number
  fSnf: number
  mLitre: number
  mFat: number
  mSnf: number
  rLitre: number
  rFat: number
  rSnf: number
  tLitre: number
  gravity: number
  kg: number
  destination: string
  afLitre: number
  afFat: number
  afSnf: number
  amLitre: number
  amFat: number
  amSnf: number
  arLitre: number
  arFat: number
  arSnf: number
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

const calculateRow = (item: CheckAckList): CheckAckGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    invNo: item.invoiceNo ?? '',
    tankerNo: item.tankerNo ?? '',
    fLitre: Number(Number(item.fLitre ?? 0).toFixed(1)),
    fFat: Number(Number(item.fFat ?? 0).toFixed(1)),
    fSnf: Number(Number(item.fSnf ?? 0).toFixed(1)),
    mLitre: Number(Number(item.mLitre ?? 0).toFixed(1)),
    mFat: Number(Number(item.mFat ?? 0).toFixed(1)),
    mSnf: Number(Number(item.mSnf ?? 0).toFixed(1)),
    rLitre: Number(Number(item.rLitre ?? 0).toFixed(1)),
    rFat: Number(Number(item.rFat ?? 0).toFixed(1)),
    rSnf: Number(Number(item.rSnf ?? 0).toFixed(1)),
    tLitre: Number(
      (Number(item.fLitre ?? 0) + Number(item.mLitre ?? 0) + Number(item.rLitre ?? 0)).toFixed(2)
    ),
    gravity: Number(item.gravity ?? 0),
    kg: Number(item.kg ?? 0),
    destination: item.destinationId ?? '',
    afLitre: Number(item.afLitre ?? 0),
    afFat: Number(item.afFat ?? 0),
    afSnf: Number(item.afSnf ?? 0),
    amLitre: Number(item.amLitre ?? 0),
    amFat: Number(item.amFat ?? 0),
    amSnf: Number(item.amSnf ?? 0),
    arLitre: Number(item.arLitre ?? 0),
    arFat: Number(item.arFat ?? 0),
    arSnf: Number(item.arSnf ?? 0),
  }
}
export function CheckAckListPage() {
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
  } = useGetCheckAckList({
    variables: committedFilters ?? { fromDate: '', toDate: '', destinationId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<CheckAckGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item) => calculateRow(item))
  }, [result])

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

  const invoiceAckSummaries = useMemo(() => {
    const groups: { invNo: string; rows: CheckAckGridRow[] }[] = []

    gridData.forEach((row) => {
      const currentGroup = groups[groups.length - 1]

      if (currentGroup && currentGroup.invNo === row.invNo) {
        currentGroup.rows.push(row)
      } else {
        groups.push({ invNo: row.invNo, rows: [row] })
      }
    })

    return groups.map((group) => {
      const count = group.rows.length
      const totalAFLitre = group.rows.reduce((sum, row) => sum + row.afLitre, 0)
      const totalAMLitre = group.rows.reduce((sum, row) => sum + row.amLitre, 0)
      const totalARLitre = group.rows.reduce((sum, row) => sum + row.arLitre, 0)
      const totalAFFat = group.rows.reduce((sum, row) => sum + row.afFat, 0)
      const totalAFSnf = group.rows.reduce((sum, row) => sum + row.afSnf, 0)
      const totalAMFat = group.rows.reduce((sum, row) => sum + row.amFat, 0)
      const totalAMSnf = group.rows.reduce((sum, row) => sum + row.amSnf, 0)
      const totalARFat = group.rows.reduce((sum, row) => sum + row.arFat, 0)
      const totalARSnf = group.rows.reduce((sum, row) => sum + row.arSnf, 0)
      const totalKg = group.rows.reduce((sum, row) => sum + row.kg, 0)
      const totalGravity = group.rows.reduce((sum, row) => sum + row.gravity, 0)

      return {
        invNo: group.invNo,
        rows: group.rows,
        destination: group.rows[0]?.destination ?? '',
        ttlALtr: totalAFLitre + totalAMLitre + totalARLitre,
        totalAFLitre,
        totalAMLitre,
        totalARLitre,
        avgAFFat: count ? totalAFFat / count : 0,
        avgAFSnf: count ? totalAFSnf / count : 0,
        avgAMFat: count ? totalAMFat / count : 0,
        avgAMSnf: count ? totalAMSnf / count : 0,
        avgARFat: count ? totalARFat / count : 0,
        avgARSnf: count ? totalARSnf / count : 0,
        avgKg: count ? totalKg / count : 0,
        avgGravity: count ? totalGravity / count : 0,
      }
    })
  }, [gridData])

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.fLitre += row.fLitre
        total.fFat += row.fFat
        total.fSnf += row.fSnf
        total.mLitre += row.mLitre
        total.mFat += row.mFat
        total.mSnf += row.mSnf
        total.rLitre += row.rLitre
        total.rFat += row.rFat
        total.rSnf += row.rSnf
        total.gravity += row.gravity
        total.kg += row.kg

        return total
      },

      {
        fLitre: 0,
        fFat: 0,
        fSnf: 0,
        mLitre: 0,
        mFat: 0,
        mSnf: 0,
        rLitre: 0,
        rFat: 0,
        rSnf: 0,
        gravity: 0,
        kg: 0,
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
      destinationId: selectedDestination?.destinationId ?? 0,
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
      title={`DESPATCH & ACKNOWLEDGEMENT CHECK LIST ${formatPdfHeaderDate(selectedFromDate) || '-'}  --  ${formatPdfHeaderDate(selectedToDate) || '-'}`}
      subtitle={`Acknowledgement Type : ${selectedDestination?.destinationId ? selectedDestination.name ?? '-' : 'ALL'}`}
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
        4. Check-Acknowledgement Register
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
              className="checkAckListDestination"
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
          disabled={gridData.length === 0}
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


      <Grid
            data={pagedResult}
            {...dataState}
            onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
            sortable
            pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
            className="checkAckListGrid"
            style={{
              width: '100%',
            }}
          >
            <GridColumn field="date" 
            title="Date" width="100px" 
             headerClassName="text-center fw-bold"
             />
            <GridColumn
             field="bmc" 
             title="Bmc" 
             width="250px" 
              headerClassName="text-center fw-bold"
              />
            <GridColumn 
            field="invNo"
             title="Inv No" 
             width="100px"
               headerClassName="text-center fw-bold"
               />
            <GridColumn
              field="tankerNo"
              title="Tanker No"
              width="150px"
               headerClassName="text-center fw-bold"
              cells={{
                footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
              }}
            />
            <GridColumn title="Front"  headerClassName="text-center fw-bold">
              <GridColumn
                field="fLitre"
                title="Litre"
                width="90px"
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
            </GridColumn>

            <GridColumn title="Middle"  headerClassName="text-center fw-bold">
              <GridColumn
                field="mLitre"
                title="Litre"
                width="90px"
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
            </GridColumn>

            <GridColumn title="Rear"  headerClassName="text-center fw-bold">
              <GridColumn
                field="rLitre"
                title="Litre"
                width="90px"
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
            </GridColumn>

            <GridColumn
              field="gravity"
              title="Gravity"
              width="130px"
               headerClassName="text-center fw-bold"
              format="{0:n2}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right', whiteSpace: 'nowrap', textOverflow: 'clip' }}>
                    {totals.gravity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                ),
              }}
            />

            <GridColumn
              field="kg"
              title="KG"
              width="90px"
               headerClassName="text-center fw-bold"
              format="{0:n1}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.kg.toFixed(1)}
                  </td>
                ),
              }}
            />

            <GridColumn field="destination" title="Destination" width="200px"  headerClassName="text-center fw-bold"/>
          </Grid>

      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A3"
            landscape={false}
            margin={PDF_HEADER_MARGIN}
            scale={0.50}
            keepTogether=".pdf-keep-together"
            pageTemplate={PageTemplate}
            fileName={`CheckAckList_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
          >
            {isPdf && (
              // Usable page width at scale 0.52 estimated from the rendered PDF (~1560 layout px); content (1520px) is centred inside it
              <div style={{ width: '1632px' }}>
              <div style={{ width: '1520px', margin: '0 auto' }}>
                {invoiceAckSummaries.map((summary) => (
                  <div key={summary.invNo} className="pdf-keep-together" style={{ marginBottom: '10px' }}>
                    <div style={{ width: '1520px' }}>
                    {/* Group header band — one cell per group, widths match the grid columns below */}
                    <div style={{ display: 'flex', width: '1520px', boxSizing: 'border-box', fontWeight: 'bold', textAlign: 'center', border: '1px solid #dee2e6', borderBottom: 'none', background: '#f8f9fa' }}>
                      <div style={{ width: '580px', flexShrink: 0, padding: '6px 0' }}>&nbsp;</div>
                      <div style={{ width: '220px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Front</div>
                      <div style={{ width: '220px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Middle</div>
                      <div style={{ width: '220px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Rear</div>
                      <div style={{ width: '280px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>&nbsp;</div>
                    </div>
                    <Grid data={summary.rows} groupable={false} sortable={false} scrollable="none" style={{ width: '1520px', fontSize: '15px' }}>
                      <GridColumn field="date" title="Date" width="120px" className="text-nowrap" headerClassName="text-center fw-bold" />
                      <GridColumn field="invNo" title="InvNo" width="90px" headerClassName="text-center fw-bold" />
                      <GridColumn field="tankerNo" title="TankerNo" width="150px" headerClassName="text-center fw-bold" />
                      <GridColumn field="bmc" title="BMC Name" width="260px" className="text-nowrap" headerClassName="text-center fw-bold" />
                      <GridColumn field="fLitre" title="Litre" width="80px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="fFat" title="Fat" width="70px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="fSnf" title="Snf" width="70px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="mLitre" title="Litre" width="80px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="mFat" title="Fat" width="70px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="mSnf" title="Snf" width="70px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="rLitre" title="Litre" width="80px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="rFat" title="Fat" width="70px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="rSnf" title="Snf" width="70px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="gravity" title="Gravity" width="80px" format="{0:n2}" headerClassName="text-center fw-bold" />
                      <GridColumn field="kg" title="KG" width="70px" format="{0:n1}" headerClassName="text-center fw-bold" />
                      <GridColumn field="destination" title="Destination" width="130px" headerClassName="text-center fw-bold" />
                    </Grid>
                    </div>

                    <div
                      style={{
                        width: '1520px',
                        boxSizing: 'border-box',
                        background: 'transparent',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        whiteSpace: 'nowrap',
                        padding: '4px 6px',
                        border: '1px solid #000',
                        borderTop: 'none',
                        borderRight: 'none',
                      }}
                    >
                      {`Ack: T.Litres: ${summary.ttlALtr.toFixed(1)}   | F.T: ${summary.totalAFLitre.toFixed(2)}  FFAT: ${summary.avgAFFat.toFixed(2)}  FSNF: ${summary.avgAFSnf.toFixed(2)}   | M.T: ${summary.totalAMLitre.toFixed(2)}  MFAT: ${summary.avgAMFat.toFixed(2)}  MSNF: ${summary.avgAMSnf.toFixed(2)}   | R.T: ${summary.totalARLitre.toFixed(2)}  RFAT: ${summary.avgARFat.toFixed(2)}  RSNF: ${summary.avgARSnf.toFixed(2)}   | KG: ${summary.avgKg.toFixed(2)} | Gravity: ${summary.avgGravity.toFixed(4)}   | DesName: ${summary.destination}`}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            )}
          </PDFExport>
        </div>
      )}

      {/* Excel export — explicit columns matching the export row shape */}
      <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`CheckAckList_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="date" title="Date" width={100} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn field="invNo" title="Inv No" width={200} />
        <ExcelExportColumn field="tankerNo" title="Tanker No" width={100} />

        <ExcelExportColumn title="Front">
          <ExcelExportColumn field="fLitre" title="Litre" width={90} />
          <ExcelExportColumn field="fFat" title="Fat" width={80} />
          <ExcelExportColumn field="fSnf" title="Snf" width={80} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Middle">
          <ExcelExportColumn field="mLitre" title="Litre" width={90} />
          <ExcelExportColumn field="mFat" title="Fat" width={80} />
          <ExcelExportColumn field="mSnf" title="Snf" width={80} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Rear">
          <ExcelExportColumn field="rLitre" title="Litre" width={90} />
          <ExcelExportColumn field="rFat" title="Fat" width={80} />
          <ExcelExportColumn field="rSnf" title="Snf" width={80} />
        </ExcelExportColumn>

        <ExcelExportColumn field="gravity" title="Gravity" width={90} />
        <ExcelExportColumn field="kg" title="KG" width={90} />
        <ExcelExportColumn field="destination" title="Destination" width={200} />
      </ExcelExport>
    </div>
  )
}
