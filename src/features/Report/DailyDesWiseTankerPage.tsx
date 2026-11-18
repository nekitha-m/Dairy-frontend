/* 15. DesWiseTanker Daily Abstract */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetBmcWiseAck } from '../../apiclient/report/use-get-bmc-wise-ack'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type { BMCAckRegVm } from '../../models/Report/BMCAckRegVm'
import type Destination from '../../models/masters/Destination'
import { safePercent } from '../../utils/safePercent'

interface DailyDesWiseTankerGridRow {
  serialNo: number
  bmc: string
  tankerNo: number | string
  invNo: string
  invLitre: number
  invFat: number
  invSnf: number
  invLitFat: number
  invLitSnf: number
  ackLitre: number
  ackFat: number
  ackSnf: number
  ackLitFat: number
  ackLitSnf: number
  diffLitre: number
  diffLitFat: number
  diffLitSnf: number
  fatP: number
  snfP: number
}

const ALL_DESTINATION: Destination = {
  destinationId: 0,
  name: '-All-',
}

// GetBmcWiseAck passes this straight into the backend's date parsing, so
// ISO (yyyy-MM-dd) is sent — not dd-MM-yyyy.
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
  item: BMCAckRegVm,
  serialNo: number
): DailyDesWiseTankerGridRow => {
  const fLitre = Number(item.fLitre ?? 0)
  const rLitre = Number(item.rLitre ?? 0)
  const mLitre = Number(item.mLitre ?? 0)
  const fFat = Number(item.fFat ?? 0)
  const rFat = Number(item.rFat ?? 0)
  const mFat = Number(item.mFat ?? 0)
  const fSnf = Number(item.fSnf ?? 0)
  const rSnf = Number(item.rSnf ?? 0)
  const mSnf = Number(item.mSnf ?? 0)
  const fLitFat = Number(item.fLitFat ?? 0)
  const rLitFat = Number(item.rLitFat ?? 0)
  const mLitFat = Number(item.mLitFat ?? 0)
  const fLitSnf = Number(item.fLitSnf ?? 0)
  const rLitSnf = Number(item.rLitSnf ?? 0)
  const mLitSnf = Number(item.mLitSnf ?? 0)
  const afLitre = Number(item.afLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const afFat = Number(item.afFat ?? 0)
  const arFat = Number(item.arFat ?? 0)
  const amFat = Number(item.amFat ?? 0)
  const afSnf = Number(item.afSnf ?? 0)
  const arSnf = Number(item.arSnf ?? 0)
  const amSnf = Number(item.amSnf ?? 0)
  const afLitFat = Number(item.afLitFat ?? 0)
  const arLitFat = Number(item.arLitFat ?? 0)
  const amLitFat = Number(item.amLitFat ?? 0)
  const afLitSnf = Number(item.afLitSnf ?? 0)
  const arLitSnf = Number(item.arLitSnf ?? 0)
  const amLitSnf = Number(item.amLitSnf ?? 0)
  const invLitre = fLitre + rLitre + mLitre
  const invLitFat = fLitFat + rLitFat + mLitFat
  const invLitSnf = fLitSnf + rLitSnf + mLitSnf
  const rawInvFat = fFat + rFat + mFat
  const rawInvSnf = fSnf + rSnf + mSnf
  const ackLitre = afLitre + arLitre + amLitre
  const ackLitFat = afLitFat + arLitFat + amLitFat
  const ackLitSnf = afLitSnf + arLitSnf + amLitSnf
  const rawAckFat = afFat + arFat + amFat
  const rawAckSnf = afSnf + arSnf + amSnf
  const invFat =rawInvFat < 5 || rawAckFat < 5 ? rawInvFat : rawInvFat / 2
  const ackFat =rawInvFat < 5 || rawAckFat < 5 ? rawAckFat : rawAckFat / 2
  const invSnf =rawInvSnf < 10 || rawAckSnf < 10 ? rawInvSnf : rawInvSnf / 2
  const ackSnf =rawInvSnf < 10 || rawAckSnf < 10 ? rawAckSnf : rawAckSnf / 2
  const diffLitre = invLitre - ackLitre
  const diffLitFat = invLitFat - ackLitFat
  const diffLitSnf = invLitSnf - ackLitSnf
  const fatP = safePercent(diffLitFat, invLitFat)
  const snfP = safePercent(diffLitSnf, invLitSnf)

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    tankerNo: item.tankerNo ?? '',
    invNo: item.invoiceNo ?? '',
    invLitre: Number(invLitre.toFixed(1)),
    invFat: Number(invFat.toFixed(1)),
    invSnf: Number(invSnf.toFixed(1)),
    invLitFat: Number(invLitFat.toFixed(3)),
    invLitSnf: Number(invLitSnf.toFixed(3)),
    ackLitre: Number(ackLitre.toFixed(1)),
    ackFat: Number(ackFat.toFixed(1)),
    ackSnf: Number(ackSnf.toFixed(1)),
    ackLitFat: Number(ackLitFat.toFixed(3)),
    ackLitSnf: Number(ackLitSnf.toFixed(3)),
    diffLitre: Number(diffLitre.toFixed(1)),
    diffLitFat: Number(diffLitFat.toFixed(3)),
    diffLitSnf: Number(diffLitSnf.toFixed(3)),
    fatP: Number(fatP.toFixed(1)),
    snfP: Number(snfP.toFixed(1)),
  }
}

const calculateExportRow = (
  item: BMCAckRegVm,
  serialNo: number
): DailyDesWiseTankerGridRow => {
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
  const invFat = safePercent(invLitFat, invLitre)
  const invSnf = safePercent(invLitSnf, invLitre)
  const ackLitre = afLitre + arLitre + amLitre
  const ackLitFat = afLitFat + arLitFat + amLitFat
  const ackLitSnf = afLitSnf + arLitSnf + amLitSnf
  const ackFat = safePercent(ackLitFat, ackLitre)
  const ackSnf = safePercent(ackLitSnf, ackLitre)
  const diffLitre = ackLitre - invLitre
  const diffLitFat = ackLitFat - invLitFat
  const diffLitSnf = ackLitSnf - invLitSnf
  const fatP = safePercent(diffLitFat, invLitFat)
  const snfP = safePercent(diffLitSnf, invLitSnf)

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    tankerNo: item.tankerNo ?? '',
    invNo: item.invoiceNo ?? '',
    invLitre: Number(invLitre.toFixed(1)),
    invFat: Number(invFat.toFixed(1)),
    invSnf: Number(invSnf.toFixed(1)),
    invLitFat: Number(invLitFat.toFixed(3)),
    invLitSnf: Number(invLitSnf.toFixed(3)),
    ackLitre: Number(ackLitre.toFixed(1)),
    ackFat: Number(ackFat.toFixed(1)),
    ackSnf: Number(ackSnf.toFixed(1)),
    ackLitFat: Number(ackLitFat.toFixed(3)),
    ackLitSnf: Number(ackLitSnf.toFixed(3)),
    diffLitre: Number(diffLitre.toFixed(1)),
    diffLitFat: Number(diffLitFat.toFixed(3)),
    diffLitSnf: Number(diffLitSnf.toFixed(3)),
    fatP: Number(fatP.toFixed(1)),
    snfP: Number(snfP.toFixed(1)),
  }
}
export function DailyDesWiseTankerPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const [selectedDestination, setSelectedDestination] =
    useState<Destination>(ALL_DESTINATION)

 
  const [committedFilters, setCommittedFilters] = useState<{
    date: string
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
  } = useGetBmcWiseAck({
    variables: committedFilters ?? { date: '', destinationId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<DailyDesWiseTankerGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateRow(item, index + 1))
  }, [result])

  const exportData = useMemo<DailyDesWiseTankerGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateExportRow(item, index + 1))
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

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.invLitre += row.invLitre
        total.invFat += row.invFat
        total.invSnf += row.invSnf
        total.invLitFat += row.invLitFat
        total.invLitSnf += row.invLitSnf
        total.ackLitre += row.ackLitre
        total.ackFat += row.ackFat
        total.ackSnf += row.ackSnf
        total.ackLitFat += row.ackLitFat
        total.ackLitSnf += row.ackLitSnf
        total.diffLitre += row.diffLitre
        total.diffLitFat += row.diffLitFat
        total.diffLitSnf += row.diffLitSnf
        total.fatP += row.fatP
        total.snfP += row.snfP

        return total
      },
      {
        invLitre: 0,
        invFat: 0,
        invSnf: 0,
        invLitFat: 0,
        invLitSnf: 0,
        ackLitre: 0,
        ackFat: 0,
        ackSnf: 0,
        ackLitFat: 0,
        ackLitSnf: 0,
        diffLitre: 0,
        diffLitFat: 0,
        diffLitSnf: 0,
        fatP: 0,
        snfP: 0,
      }
    )
  }, [gridData])

  const handleGenerate = () => {
    if (!selectedDate) {
      window.alert('Please Select Date')
      return
    }

    setCommittedFilters({
      date: formatDate(selectedDate),
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
        title="15. DesWiseTanker Daily Abstract"
        subtitle={`TANKER ARRIVALS FROM BMC TO FBD(TIRUPUR) DAIRY FOR THE PERIOD : ${selectedDate ? selectedDate.toLocaleDateString('en-GB').replace(/\//g, '-') : '-'}`}
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
        15. DesWiseTanker Daily Abstract
      </h3>

      {/* Filter section */}
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
                              selected={selectedDate}
                              placeholderText="Select Date"
                              dateFormat={"dd-MM-yyyy"}
                              popperPlacement="bottom-start"
                              portalId="root-portal"
                              onChange={(value: Date | null) => setSelectedDate(value)}
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
              className="dailyDesWiseTankerDestination"
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


      {/* On-screen grid — always rendered, unaffected by PDF export */}
      <Grid
        data={pagedResult}
        {...dataState}
        onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
        sortable
        pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
        className="dailyDesWiseTankerGrid"
        style={{
          width: '100%',
        }}
      >
        <GridColumn field="serialNo" title="S.No" width="70px" headerClassName="text-center fw-bold"/>
        <GridColumn field="bmc" title="Bmc" width="250px" headerClassName="text-center fw-bold"/>
        <GridColumn field="tankerNo" title="TankerNo" width="150px" headerClassName="text-center fw-bold"/>
        <GridColumn
          field="invNo"
          title="Inv No"
          width="150px"
          headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
          }}
        />

        <GridColumn title="Invoiced" headerClassName="text-center fw-bold">
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
            field="invFat"
            title="Fat"
            width="125px"
            headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.invFat.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="invSnf"
            title="Snf"
            width="125px"
            headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.invSnf.toFixed(1)}
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
            field="ackFat"
            title="Fat"
            width="125px"
            headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.ackFat.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="ackSnf"
            title="Snf"
            width="125px"
            headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.ackSnf.toFixed(1)}
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
        </GridColumn>

        <GridColumn title="Difference" headerClassName="text-center fw-bold">
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
        </GridColumn>

        <GridColumn title="Gain/Loss" headerClassName="text-center fw-bold">
          <GridColumn
            field="fatP"
            title="Fat%"
            width="125px"
            headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.fatP.toFixed(1)}
                </td>
              ),
            }}
          />
          <GridColumn
            field="snfP"
            title="Snf%"
            width="125px"
            headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.snfP.toFixed(1)}
                </td>
              ),
            }}
          />
        </GridColumn>
      </Grid>

      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A4"
            landscape={false}
            margin={PDF_HEADER_MARGIN}
            scale={0.3}
            repeatHeaders
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`DesWiseTankerDailyAbstract_${(committedFilters?.date ?? '').split('-').reverse().join('-')}.pdf`}
          >
              {isPdf && (
                <>
                  <div style={{ textAlign: 'left', fontWeight: 'bold', marginBottom: '8px' }}>
                    Acknowledgement Type : {selectedDestination?.name ?? '-'}
                  </div>
                  <div style={{ width: '1930px', margin: '0 auto' }}>
                    {/* Group header band — one cell per group, widths match the grid columns below */}
                    <div style={{ display: 'flex', width: '1930px', boxSizing: 'border-box', fontWeight: 'bold', textAlign: 'center', border: '1px solid #dee2e6', borderBottom: 'none', background: '#f8f9fa' }}>
                      <div style={{ width: '620px', flexShrink: 0, padding: '6px 0' }}>&nbsp;</div>
                      <div style={{ width: '430px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Invoiced</div>
                      <div style={{ width: '430px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Ack</div>
                      <div style={{ width: '270px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Difference</div>
                      <div style={{ width: '180px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Gain/Loss</div>
                    </div>
                  <Grid
                    data={gridData}
                    groupable={false}
                    sortable={false}
                    scrollable="none"
                    className="dailyDesWiseTankerGrid"
                    style={{ width: '1930px' }}
                  >
                    <GridColumn field="serialNo" title="S.No" width="70px" headerClassName="text-center fw-bold"/>
                    <GridColumn field="bmc" title="Bmc" width="250px" headerClassName="text-center fw-bold"/>
                    <GridColumn field="tankerNo" title="TankerNo" width="150px" headerClassName="text-center fw-bold"/>
                    <GridColumn field="invNo" title="Inv No" width="150px" headerClassName="text-center fw-bold"
                      cells={{
                        footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                      }}
                    />
                      <GridColumn
                        field="invLitre"
                        title="Litre"
                        width="90px"
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
                        field="invFat"
                        title="Fat"
                        width="80px"
                        headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.invFat.toFixed(1)}
                            </td>
                          ),
                        }}
                      />
                      <GridColumn
                        field="invSnf"
                        title="Snf"
                        width="80px"
                        headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.invSnf.toFixed(1)}
                            </td>
                          ),
                        }}
                      />
                      <GridColumn
                        field="invLitFat"
                        title="LitFat"
                        width="90px"
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
                        width="90px"
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
                        field="ackLitre"
                        title="Litre"
                        width="90px"
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
                        field="ackFat"
                        title="Fat"
                        width="80px"
                        headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.ackFat.toFixed(1)}
                            </td>
                          ),
                        }}
                      />
                      <GridColumn
                        field="ackSnf"
                        title="Snf"
                        width="80px"
                        headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.ackSnf.toFixed(1)}
                            </td>
                          ),
                        }}
                      />
                      <GridColumn
                        field="ackLitFat"
                        title="LitFat"
                        width="90px"
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
                        width="90px"
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
                        field="diffLitre"
                        title="Litre"
                        width="90px"
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
                        width="90px"
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
                        field="diffLitSnf"
                        title="LitSnf"
                        width="90px"
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
                        field="fatP"
                        title="Fat%"
                        width="90px"
                        headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.fatP.toFixed(1)}
                            </td>
                          ),
                        }}
                      />
                      <GridColumn
                        field="snfP"
                        title="Snf%"
                        width="90px"
                        headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.snfP.toFixed(1)}
                            </td>
                          ),
                        }}
                      />
                  </Grid>
                  </div>
                </>
              )}
          </PDFExport>
        </div>
      )}

      {/* Excel export — explicit columns matching the export row shape */}
      <ExcelExport
        ref={excelExportRef}
        data={exportData}
        fileName={`DesWiseTanker(Daily Abs)_${committedFilters?.date ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="serialNo" title="S.No" width={70} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn field="tankerNo" title="TankerNo" width={100} />
        <ExcelExportColumn field="invNo" title="Inv No" width={150} />

        <ExcelExportColumn title="Invoiced">
          <ExcelExportColumn field="invLitre" title="Litre" width={90} />
          <ExcelExportColumn field="invFat" title="Fat" width={80} />
          <ExcelExportColumn field="invSnf" title="Snf" width={80} />
          <ExcelExportColumn field="invLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="invLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Ack">
          <ExcelExportColumn field="ackLitre" title="Litre" width={90} />
          <ExcelExportColumn field="ackFat" title="Fat" width={80} />
          <ExcelExportColumn field="ackSnf" title="Snf" width={80} />
          <ExcelExportColumn field="ackLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="ackLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Difference">
          <ExcelExportColumn field="diffLitre" title="Litre" width={90} />
          <ExcelExportColumn field="diffLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="diffLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Gain/Loss">
          <ExcelExportColumn field="fatP" title="Fat%" width={90} />
          <ExcelExportColumn field="snfP" title="Snf%" width={90} />
        </ExcelExportColumn>
      </ExcelExport>
    </div>
  )
}
