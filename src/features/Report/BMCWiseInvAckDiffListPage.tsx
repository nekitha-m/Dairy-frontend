/*      11. Invoice &amp; AckDifference Register */
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

interface BMCWiseInvAckDiffGridRow {
  date: string
  bmc: string
  advNo: string
  invLitre: number
  invFat: number
  invSnf: number
  ackLitre: number
  ackFat: number
  ackSnf: number
  diffLitre: number
  diffFat: number
  diffSnf: number
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

const calculateRow = (item: BMCAckRegDiff): BMCWiseInvAckDiffGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

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
  const diffFat = ackFat - invFat
  const diffSnf = ackSnf - invSnf

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    advNo: item.advNo ?? '',
    invLitre: Number(invLitre.toFixed(1)),
    invFat: Number(invFat.toFixed(1)),
    invSnf: Number(invSnf.toFixed(1)),
    ackLitre: Number(ackLitre.toFixed(1)),
    ackFat: Number(ackFat.toFixed(1)),
    ackSnf: Number(ackSnf.toFixed(1)),
    diffLitre: Number(diffLitre.toFixed(1)),
    diffFat: Number(diffFat.toFixed(1)),
    diffSnf: Number(diffSnf.toFixed(1)),
  }
}
// Returns 0 instead of NaN/Infinity when the denominator is 0 (e.g. no litres on a row)
function safePercent(part: number, whole: number): number {
  const value = (part / whole) * 100
  return Number.isFinite(value) ? value : 0
}

export function BMCWiseInvAckDiffListPage() {
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

  // 'yyyy-mm-dd' -> 'dd-mm-yyyy' for the PDF header
  const pdfPeriodDate = (value?: string) =>
    value ? value.split('-').reverse().join('-') : '-'
  const excelExportRef = useRef<ExcelExport>(null)
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

  const gridData = useMemo<BMCWiseInvAckDiffGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item) => calculateRow(item))
  }, [result])

  const [dataState, setDataState] = useState<State>({ skip: 0, take: 10 })

  useEffect(() => {
    setDataState((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }))
  }, [gridData.length])

  const pagedResult = process(gridData, dataState)

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.invLitre += row.invLitre
        total.invFat += row.invFat
        total.invSnf += row.invSnf
        total.ackLitre += row.ackLitre
        total.ackFat += row.ackFat
        total.ackSnf += row.ackSnf
        total.diffLitre += row.diffLitre
        total.diffFat += row.diffFat
        total.diffSnf += row.diffSnf
        return total
      },
      {
        invLitre: 0,
        invFat: 0,
        invSnf: 0,
        ackLitre: 0,
        ackFat: 0,
        ackSnf: 0,
        diffLitre: 0,
        diffFat: 0,
        diffSnf: 0,
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

  const [isPdf, setIsPdf] = useState(false)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)

  useEffect(() => {
    if (committedFilters && !isLoading && !error && gridData.length === 0) {
      setShowNoDataDialog(true)
    }
  }, [committedFilters, isLoading, error, gridData])

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

  const formatDisplayDate = (date: Date | null): string =>
    date
      ? date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        })
      : ''

  const reportTitle = `Invoice & AckDifference Register${
    committedFilters
      ? ` - ${formatDisplayDate(selectedFromDate)} to ${formatDisplayDate(selectedToDate)}`
      : ''
  }`

  const bmcHeaderLabel =
    selectedBmc?.bmcId && selectedBmc.bmcId !== 0
      ? `${selectedBmc.code ?? ''}-${selectedBmc.name ?? ''}`
      : selectedBmc?.name ?? '-All-'

  const calculateBmcTotals = (rows: BMCWiseInvAckDiffGridRow[]) =>
    rows.reduce(
      (total, row) => {
        total.invLitre += row.invLitre
        total.invFat += row.invFat
        total.invSnf += row.invSnf
        total.ackLitre += row.ackLitre
        total.ackFat += row.ackFat
        total.ackSnf += row.ackSnf
        total.diffLitre += row.diffLitre
        total.diffFat += row.diffFat
        total.diffSnf += row.diffSnf
        return total
      },
      {
        invLitre: 0,
        invFat: 0,
        invSnf: 0,
        ackLitre: 0,
        ackFat: 0,
        ackSnf: 0,
        diffLitre: 0,
        diffFat: 0,
        diffSnf: 0,
      }
    )

  const pdfBmcGroups = useMemo(() => {
    // A specific BMC was selected: print only that BMC.
    if (selectedBmc?.bmcId && selectedBmc.bmcId !== 0) {
      return [
        {
          bmc: bmcHeaderLabel,
          rows: gridData,
        },
      ]
    }

    // ALL BMC: group the rows by BMC and print each BMC separately.
    const groups = new Map<string, BMCWiseInvAckDiffGridRow[]>()

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
  }, [selectedBmc, bmcHeaderLabel, gridData])

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => {
    const isLastPage = props.pageNum === props.totalPages

    return (
      <div>
        <PdfPageHeader
          title="11. Invoice & AckDifference Register"
          subtitle={`BMC REGISTER FOR THE PERIOD ${pdfPeriodDate(committedFilters?.fromDate)}  --  ${pdfPeriodDate(committedFilters?.toDate)}`}
        />
        {isLastPage && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '20px',
              fontSize: '12px',
              color: '#000',
              fontWeight: 'bold',
            }}
          >
           {/*  {new Date().toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })} */}
          </div>
        )}
        <div
           style={{
            position: 'absolute',
            bottom: '10px',
            width: '100%',
            textAlign: 'right',
            fontSize: '12px',
          }} 
        >
          Page {props.pageNum} 
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '25px',
        }}
      >
        11. Invoice & AckDifference Register
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
              BMC *
            </label>

            <DropDownList
              data={bmcs}
              textField="name"
              dataItemKey="bmcId"
              value={selectedBmc}
              onChange={(event) => setSelectedBmc(event.value)}
              className="bmcWiseInvAckDiffBmc"
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
          disabled={gridData.length === 0}
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

      <Grid
            data={pagedResult}
            {...dataState}
            onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
            sortable
            pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
            className="bmcWiseInvAckDiffGrid"
            style={{
              width: '100%',
            }}
          >
            <GridColumn field="date" title="Date" width="150px" />

            <GridColumn field="bmc" title="Bmc" width="250px" />

            <GridColumn
              field="advNo"
              title="Adv No"
              width="150px"
              cells={{
                footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
              }}
            />

            <GridColumn title="Invoiced">
              <GridColumn
                field="invLitre"
                title="Litre"
                width="130px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.invLitre.toFixed(2)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="invFat"
                title="Fat"
                width="90px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.invFat.toFixed(2)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="invSnf"
                title="Snf"
                width="90px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.invSnf.toFixed(1)}
                    </td>
                  ),
                }}
              />
            </GridColumn>

            <GridColumn title="Ack">
              <GridColumn
                field="ackLitre"
                title="Litre"
                width="130px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.ackLitre.toFixed(2)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="ackFat"
                title="Fat"
                width="90px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.ackFat.toFixed(2)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="ackSnf"
                title="Snf"
                width="90px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.ackSnf.toFixed(1)}
                    </td>
                  ),
                }}
              />
            </GridColumn>

            <GridColumn title="Difference">
              <GridColumn
                field="diffLitre"
                title="Litre"
                width="100px"
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
                field="diffFat"
                title="Fat"
                width="90px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffFat.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="diffSnf"
                title="Snf"
                width="90px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.diffSnf.toFixed(1)}
                    </td>
                  ),
                }}
              />
            </GridColumn>
          </Grid>
      <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`InvoiceAndAckDifference_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="date" title="Date" width={150} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn field="advNo" title="Adv No" width={150} />

        <ExcelExportColumn title="Invoiced">
          <ExcelExportColumn field="invLitre" title="Litre" width={100} />
          <ExcelExportColumn field="invFat" title="Fat" width={90} />
          <ExcelExportColumn field="invSnf" title="Snf" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Ack">
          <ExcelExportColumn field="ackLitre" title="Litre" width={100} />
          <ExcelExportColumn field="ackFat" title="Fat" width={90} />
          <ExcelExportColumn field="ackSnf" title="Snf" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Difference">
          <ExcelExportColumn field="diffLitre" title="Litre" width={100} />
          <ExcelExportColumn field="diffFat" title="Fat" width={90} />
          <ExcelExportColumn field="diffSnf" title="Snf" width={90} />
        </ExcelExportColumn>
      </ExcelExport>
      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A4"
            landscape={false}
            margin={PDF_HEADER_MARGIN}
            scale={0.60}
            pageTemplate={PageTemplate}
            forcePageBreak=".pdfBmcPageBreak"
            keepTogether=".pdf-keep-together"
            fileName={`BMCRegister_${pdfPeriodDate(committedFilters?.fromDate)}_${pdfPeriodDate(committedFilters?.toDate)}.pdf`}
          >
            {isPdf && (
              <>
                {pdfBmcGroups.map((group, index) => {
                  const groupTotals = calculateBmcTotals(group.rows)

                  return (
                    <div
                      key={group.bmc}
                      className={index > 0 ? 'pdfBmcPageBreak pdf-keep-together' : 'pdf-keep-together'}
                      style={{
                        marginBottom: '15px',
                      }}
                    >
                      <div
                        style={{
                          textAlign: 'left',
                          fontWeight: 'bold',
                          marginBottom: '8px',
                        }}
                      >
                        BMC Name : {group.bmc}
                      </div>

                      <div style={{ width: '930px' }}>
                      {/* Group header band — one cell per group, widths match the grid columns below */}
                      <div style={{ display: 'flex', width: '930px', boxSizing: 'border-box', fontWeight: 'bold', textAlign: 'center', border: '1px solid #dee2e6', borderBottom: 'none', background: '#f8f9fa' }}>
                        <div style={{ width: '405px', flexShrink: 0, padding: '6px 0' }}>&nbsp;</div>
                        <div style={{ width: '175px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Invoiced</div>
                        <div style={{ width: '175px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Ack</div>
                        <div style={{ width: '175px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Difference</div>
                      </div>
                      <Grid
                        data={group.rows}
                        groupable={false}
                        sortable={false}
                        scrollable="none"
                        style={{ width: '930px' }}
                      >
                        <GridColumn field="date" title="Date" width="110px" />
                        <GridColumn field="bmc" title="Bmc" width="230px" />
                        <GridColumn
                          field="advNo"
                          title="Adv No"
                          width="65px"
                          cells={{
                            footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                          }}
                        />
                        <GridColumn
                          field="invLitre"
                          title="Litre"
                          width="65px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.invLitre.toFixed(2)}
                              </td>
                            ),
                          }}
                        />
                        <GridColumn
                          field="invFat"
                          title="Fat"
                          width="55px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.invFat.toFixed(2)}
                              </td>
                            ),
                          }}
                        />
                        <GridColumn
                          field="invSnf"
                          title="Snf"
                          width="55px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.invSnf.toFixed(1)}
                              </td>
                            ),
                          }}
                        />
                        <GridColumn
                          field="ackLitre"
                          title="Litre"
                          width="65px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.ackLitre.toFixed(2)}
                              </td>
                            ),
                          }}
                        />
                        <GridColumn
                          field="ackFat"
                          title="Fat"
                          width="55px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.ackFat.toFixed(2)}
                              </td>
                            ),
                          }}
                        />
                        <GridColumn
                          field="ackSnf"
                          title="Snf"
                          width="55px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.ackSnf.toFixed(1)}
                              </td>
                            ),
                          }}
                        />
                        <GridColumn
                          field="diffLitre"
                          title="Litre"
                          width="65px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.diffLitre.toFixed(1)}
                              </td>
                            ),
                          }}
                        />
                        <GridColumn
                          field="diffFat"
                          title="Fat"
                          width="55px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.diffFat.toFixed(1)}
                              </td>
                            ),
                          }}
                        />
                        <GridColumn
                          field="diffSnf"
                          title="Snf"
                          width="55px"
                          format="{0:n1}"
                          cells={{
                            footerCell: () => (
                              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                                {groupTotals.diffSnf.toFixed(1)}
                              </td>
                            ),
                          }}
                        />
                      </Grid>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </PDFExport>
        </div>
      )}
    </div>
  )
}
