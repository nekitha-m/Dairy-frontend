/* 16. Tanker Despatch And Acknowledgement Abnormal Shortage Details */
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetDesAckAbnrmlList } from '../../apiclient/report/use-get-des-ack-abnrml-list'
import type { DesAckAbnrml } from '../../models/Report/DesAckAbnrml'

interface DesAckAbnormalGridRow {
  date: string
  invNo: string
  tankerNo: number | string
  bmc: string
  destination: string
  desQty: number
  ackQty: number
  qtyDiff: number
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
const calculateRow = (item: DesAckAbnrml): DesAckAbnormalGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  const fLitre = Number(item.fLitre ?? 0)
  const mLitre = Number(item.mLitre ?? 0)
  const rLitre = Number(item.rLitre ?? 0)
  const afLitre = Number(item.afLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const desQty = fLitre + rLitre+mLitre
  const ackQty = afLitre + arLitre+amLitre
  const qtyDiff = desQty - ackQty

  return {
    date,
    invNo: item.invoiceNo ?? '',
    tankerNo: item.tankerNo ?? '',
    bmc: item.bmcName ?? '',
    destination: item.destinationId ?? '',
    desQty: Number(desQty.toFixed(1)),
    ackQty: Number(ackQty.toFixed(1)),
    qtyDiff: Number(qtyDiff.toFixed(1)),
  }
}
export function DesAckAbnormalListPage() {
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(
    new Date()
  )
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(
    new Date()
  )
  const [committedFilters, setCommittedFilters] = useState<{
    fromDate: string
    toDate: string
  } | null>(null)

  const pdfExportRef = useRef<PDFExport>(null)

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <div>  
      <PdfPageHeader
        title="16. Tanker Despatch And Acknowledgement Abnormal Shortage Details"
        subtitle={`From: ${formatPdfHeaderDate(selectedFromDate) || '-'}  To: ${formatPdfHeaderDate(selectedToDate) || '-'}`}
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
    </div>
  )
  const excelExportRef = useRef<ExcelExport>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetDesAckAbnrmlList({
    variables: committedFilters ?? { fromDate: '', toDate: '' },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<DesAckAbnormalGridRow[]>(() => {
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
  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.desQty += row.desQty
        total.ackQty += row.ackQty
        total.qtyDiff += row.qtyDiff

        return total
      },
      {
        desQty: 0,
        ackQty: 0,
        qtyDiff: 0,
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
        const columnCount = sheet.columns?.length ?? 1

        sheet.rows = [
          {
            cells: [
              {
                value:
                  '16. Tanker Despatch And Acknowledgement Abnormal Shortage Details',
                bold: true,
                fontSize: 14,
                colSpan: columnCount,
                textAlign: 'center',
              },
            ],
          },
          {
            cells: [
              {
                value: `From: ${committedFilters?.fromDate || '-'}    To: ${committedFilters?.toDate || '-'}`,
                colSpan: columnCount,
                textAlign: 'center',
              },
            ],
          },
          ...(sheet.rows ?? []),
        ]
      }

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
        16. Tanker Despatch And Acknowledgement Abnormal Shortage Details
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

      {/* On-screen grid — always rendered, unaffected by PDF export */}
      <Grid
        data={pagedResult}
        {...dataState}
        onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
        sortable
        pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
        className="desAckAbnormalGrid"
        style={{
          width: '100%',
        }}
      >
        <GridColumn field="date" title="Date" width="150px"  headerClassName="text-center fw-bold"/>
        <GridColumn field="invNo" title="Inv No" width="150px"  headerClassName="text-center fw-bold"/>
        <GridColumn field="tankerNo" title="Tanker No" width="150px"  headerClassName="text-center fw-bold"/>

        <GridColumn
          field="bmc"
          title="Bmc"
          width="200px"
           headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
          }}
        />

        <GridColumn field="destination" title="Destination" width="200px"  headerClassName="text-center fw-bold"/>

        <GridColumn
          field="desQty"
          title="Des Qty"
          width="120px"
           headerClassName="text-center fw-bold"
          format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.desQty.toFixed(1)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="ackQty"
          title="Ack Qty"
          width="120px"
           headerClassName="text-center fw-bold"
          format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.ackQty.toFixed(1)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="qtyDiff"
          title="Qty Diff"
          width="120px"
           headerClassName="text-center fw-bold"
          format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.qtyDiff.toFixed(1)}
              </td>
            ),
          }}
        />
      </Grid>

      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A4"
            landscape={false}
            margin={PDF_HEADER_MARGIN}
            scale={0.50}
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`DesAckAbnormalList_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
          >
              {isPdf && (
                <>
                  <Grid
                    data={gridData}
                    groupable={false}
                    sortable={false}
                    scrollable="none"
                    className="desAckAbnormalGrid"
                    style={{
                      width: '100%',
                    }}
                  >
                    <GridColumn field="date" title="Date" width="120px"  headerClassName="text-center fw-bold"/>
                    <GridColumn field="invNo" title="Inv No" width="100px"  headerClassName="text-center fw-bold"/>
                    <GridColumn field="tankerNo" title="Tanker No" width="150px"  headerClassName="text-center fw-bold"/>
                    <GridColumn
                      field="bmc"
                      title="Bmc"
                      width="210px"
                       headerClassName="text-center fw-bold"
                      cells={{
                        footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                      }}
                    />

                    <GridColumn field="destination" title="Destination" width="200px"  headerClassName="text-center fw-bold"/>
                    <GridColumn
                      field="desQty"
                      title="Des Qty"
                      width="120px"
                       headerClassName="text-center fw-bold"
                      format="{0:n1}"
                      cells={{
                        footerCell: () => (
                          <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                            {totals.desQty.toFixed(1)}
                          </td>
                        ),
                      }}
                    />
                    <GridColumn
                      field="ackQty"
                      title="Ack Qty"
                      width="120px"
                       headerClassName="text-center fw-bold"
                      format="{0:n1}"
                      cells={{
                        footerCell: () => (
                          <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                            {totals.ackQty.toFixed(1)}
                          </td>
                        ),
                      }}
                    />
                    <GridColumn
                      field="qtyDiff"
                      title="Qty Diff"
                      width="120px"
                       headerClassName="text-center fw-bold"
                      format="{0:n1}"
                      cells={{
                        footerCell: () => (
                          <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                            {totals.qtyDiff.toFixed(1)}
                          </td>
                        ),
                      }}
                    />
                  </Grid>
                </>
              )}
          </PDFExport>
        </div>
      )}

      {/* Excel export — explicit columns matching the export row shape */}
      <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`TankerDespatchAndAckAbnormalShortageDetails_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="date" title="Date" width={150} />
        <ExcelExportColumn field="invNo" title="Inv No" width={150} />
        <ExcelExportColumn field="tankerNo" title="Tanker No" width={100} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn field="destination" title="Destination" width={200} />
        <ExcelExportColumn field="desQty" title="Des Qty" width={120} />
        <ExcelExportColumn field="ackQty" title="Ack Qty" width={120} />
        <ExcelExportColumn field="qtyDiff" title="Qty Diff" width={120} />
      </ExcelExport>
    </div>
  )
}
