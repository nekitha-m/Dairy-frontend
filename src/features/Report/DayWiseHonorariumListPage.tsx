/* 18. Day Honorarium List */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
//import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetDayWiseHonoList } from '../../apiclient/report/use-get-day-wise-hono-list'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type { HonorariumVm } from '../../models/Report/HonorariumVm'
import type Bmc from '../../models/masters/Bmc'

interface DayWiseHonoGridRow {
  date: string
  bmc: string
  invNo: string
  litres: number
  fat: number
  snf: number
  mbrt: number
  ts: number
  kg: number
  rate: number
  amount: number
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

const formatPdfHeaderDate = (date: Date | null): string => {
  if (!date) {
    return ''
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

const calculateRow = (
  item: HonorariumVm,
  _serialNo: number
): DayWiseHonoGridRow => {
  const aDate = item.aDate ? new Date(item.aDate) : null
  const date = aDate
    ? `${aDate.getDate()}-${aDate.getMonth() + 1}-${aDate.getFullYear()}`
    : ''

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    invNo: item.invNo ?? '',
    litres: Number(Number(item.litre ?? 0).toFixed(1)),
    fat: Number(Number(item.fat ?? 0).toFixed(1)),
    snf: Number(Number(item.snf ?? 0).toFixed(1)),
    mbrt: Number(item.mbrt ?? 0),
    ts: Number(Number(item.ts ?? 0).toFixed(1)),
    kg: Number(Number(item.qty ?? 0).toFixed(2)),
    rate: Number(Number(item.rate ?? 0).toFixed(2)),
    amount: Number(Number(item.amount ?? 0).toFixed(2)),
  }

}

interface PdfBmcGroup {
  bmc: string
  rows: DayWiseHonoGridRow[]
}

const calculateGroupTotals = (rows: DayWiseHonoGridRow[]) =>
  rows.reduce(
    (total, row) => {
      total.litres += row.litres
      total.fat += row.fat
      total.snf += row.snf
      total.mbrt += row.mbrt
      total.ts += row.ts
      total.kg += row.kg
      total.rate += row.rate
      total.amount += row.amount
      return total
    },
    {
      litres: 0,
      fat: 0,
      snf: 0,
      mbrt: 0,
      ts: 0,
      kg: 0,
      rate: 0,
      amount: 0,
    }
  )

export function DayWiseHonorariumListPage() {
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
  //const excelExportRef = useRef<ExcelExport>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)

  const fromDateString = formatDate(selectedFromDate)
  const toDateString = formatDate(selectedToDate)

  const { data: bmcList = [] } = useGetBmcs()
  const bmcs = useMemo(() => [ALL_BMC, ...bmcList], [bmcList])

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetDayWiseHonoList({
    variables: committedFilters ?? { fromDate: '', toDate: '', bmcId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<DayWiseHonoGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateRow(item, index + 1))
  }, [result])

  const [dataState, setDataState] = useState<State>({ skip: 0, take: 10 })

  useEffect(() => {
    setDataState((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }))
  }, [gridData.length])

  useEffect(() => {
    if (committedFilters !== null && !isLoading && !error && gridData.length === 0) {
      setShowNoDataDialog(true)
    }
  }, [committedFilters, isLoading, error, gridData])

  const pagedResult = process(gridData, dataState)

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.litres += row.litres
        total.fat += row.fat
        total.snf += row.snf
        total.mbrt += row.mbrt
        total.ts += row.ts
        total.kg += row.kg
        total.rate += row.rate
        total.amount += row.amount

        return total
      },
      
      {
        litres: 0,
        fat: 0,
        snf: 0,
        mbrt: 0,
        ts: 0,
        kg: 0,
        rate: 0,
        amount: 0,
      }
    )
  }, [gridData])

  const pdfBmcGroups = useMemo<PdfBmcGroup[]>(() => {
    // A specific BMC was selected: print only that BMC.
    if (selectedBmc?.bmcId && selectedBmc.bmcId !== 0) {
      return [
        {
          bmc: gridData[0]?.bmc || selectedBmc.name || '-',
          rows: gridData,
        },
      ]
    }

    // ALL BMC: group the rows by BMC and print each BMC separately.
    const groups = new Map<string, DayWiseHonoGridRow[]>()

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
  }, [selectedBmc, gridData])

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

  /* const handleExcelExport = () => {
    if (excelExportRef.current) {
      const options = excelExportRef.current.workbookOptions()
      const sheet = options.sheets?.[0]

      if (sheet) {
        const columnCount = sheet.columns?.length ?? 1

        sheet.rows = [
          {
            cells: [
              {
                value: '18. Day Honorarium List',
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
                value: `From: ${committedFilters?.fromDate || '-'}    To: ${committedFilters?.toDate || '-'}    BMC: ${selectedBmc?.name ?? '-'}`,
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
  } */

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <>
    <PdfPageHeader
      title="18. Day Honorarium List"
      subtitle={`HONORARIUM FOR THE PERIOD ${formatPdfHeaderDate(selectedFromDate) || '-'}  --  ${formatPdfHeaderDate(selectedToDate) || '-'}`}
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
        18. Day Honorarium List
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
              BMC *
            </label>

            <DropDownList
              data={bmcs}
              textField="name"
              dataItemKey="bmcId"
              value={selectedBmc}
              onChange={(event) => setSelectedBmc(event.value)}
              className="dayWiseHonoBmc"
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

      {/*   <button
          type="button"
          className="k-button k-button-md k-rounded-md k-button-solid k-button-solid-info"
          onClick={handleExcelExport}
          disabled={gridData.length === 0}
        >
          Excel
        </button> */}
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
        className="dayWiseHonoGrid"
        style={{
          width: '100%',
        }}
      >
        <GridColumn field="date" title="Date" width="100px"  headerClassName="text-center fw-bold" />
        <GridColumn field="bmc" title="Bmc" width="250px"  headerClassName="text-center fw-bold"/>
        <GridColumn
          field="invNo"
          title="InvNo"
          width="150px"
          headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>Total</td>
            ),
          }}
        />

        <GridColumn
          field="litres"
          title="Litres"
          width="150px"
          headerClassName="text-center fw-bold"
          format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.litres.toFixed(1)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="fat"
          title="Fat"
          width="150px"
           headerClassName="text-center fw-bold"
          format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.fat.toFixed(1)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="snf"
          title="Snf"
          width="150px"
           headerClassName="text-center fw-bold"
          format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right'}}>
                {totals.snf.toFixed(1)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="mbrt"
          title="Mbrt"
          width="150px"
           headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right'}}>
                {totals.mbrt.toFixed(2)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="ts"
          title="TS"
          width="150px"
           headerClassName="text-center fw-bold"
          format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.ts.toFixed(1)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="kg"
          title="KG"
          width="150px"
           headerClassName="text-center fw-bold"
          format="{0:n2}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.kg.toFixed(2)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="rate"
          title="Rate"
          width="150px"
           headerClassName="text-center fw-bold"
          format="{0:n2}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.rate.toFixed(2)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="amount"
          title="Amount"
          width="150px"
           headerClassName="text-center fw-bold"
          format="{0:n2}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.amount.toFixed(2)}
              </td>
            ),
          }}
        />
      </Grid>

      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0, width: '1000px' }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A4"
            landscape={false}
            margin={PDF_HEADER_MARGIN}
            scale={0.55}
            keepTogether=".pdf-keep-together"
            pageTemplate={PageTemplate}
            fileName={`DayWiseHonorarium_${fromDateString}_${toDateString}.pdf`}
          >
            {pdfBmcGroups.map((group, index) => {
            const groupTotals = calculateGroupTotals(group.rows)

            return (
              <div
                key={group.bmc}
                className="pdf-keep-together"
                style={{
                  pageBreakBefore: index > 0 ? 'always' : 'auto',
                  breakBefore: index > 0 ? 'page' : 'auto',
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

                <Grid
                  data={group.rows}
                  sortable={false}
                  scrollable="none"
                  className="dayWiseHonoGrid"
                  style={{ width: '970px' }}
                >
                  <GridColumn field="date" title="Date" width="90px" headerClassName="text-center fw-bold" />
                   <GridColumn field="bmc" title="Bmc" width="230px"  headerClassName="text-center fw-bold"/>
                  <GridColumn
                    field="invNo"
                    title="InvNo"
                    width="90px"
                    headerClassName="text-center fw-bold"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>Total</td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="litres"
                    title="Litres"
                    width="70px"
                    headerClassName="text-center fw-bold"
                    format="{0:n1}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {groupTotals.litres.toFixed(1)}
                        </td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="fat"
                    title="Fat"
                    width="70px"
                    headerClassName="text-center fw-bold"
                    format="{0:n1}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {groupTotals.fat.toFixed(1)}
                        </td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="snf"
                    title="Snf"
                    width="70px"
                    headerClassName="text-center fw-bold"
                    format="{0:n1}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {groupTotals.snf.toFixed(1)}
                        </td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="mbrt"
                    title="Mbrt"
                    width="70px"
                    headerClassName="text-center fw-bold"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {groupTotals.mbrt.toFixed(2)}
                        </td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="ts"
                    title="TS"
                    width="70px"
                    headerClassName="text-center fw-bold"
                    format="{0:n1}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {groupTotals.ts.toFixed(1)}
                        </td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="kg"
                    title="KG"
                    width="70px"
                    headerClassName="text-center fw-bold"
                    format="{0:n2}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {groupTotals.kg.toFixed(2)}
                        </td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="rate"
                    title="Rate"
                    width="70px"
                    headerClassName="text-center fw-bold"
                    format="{0:n2}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {groupTotals.rate.toFixed(2)}
                        </td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="amount"
                    title="Amount"
                    width="70px"
                    headerClassName="text-center fw-bold"
                    format="{0:n2}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {groupTotals.amount.toFixed(2)}
                        </td>
                      ),
                    }}
                  />
                </Grid>
              </div>
            )
          })}
          </PDFExport>
        </div>
      )}

      {/* Excel export — explicit columns matching the export row shape */}
      {/* <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`DayWiseHonorarium_${fromDateString}_${toDateString}.xlsx`}
      >
        <ExcelExportColumn field="date" title="Date" width={100} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn field="invNo" title="InvNo" width={150} />
        <ExcelExportColumn field="litres" title="Litres" width={150} />
        <ExcelExportColumn field="fat" title="Fat" width={150} />
        <ExcelExportColumn field="snf" title="Snf" width={150} />
        <ExcelExportColumn field="mbrt" title="Mbrt" width={150} />
        <ExcelExportColumn field="ts" title="TS" width={150} />
        <ExcelExportColumn field="kg" title="KG" width={150} />
        <ExcelExportColumn field="rate" title="Rate" width={150} />
        <ExcelExportColumn field="amount" title="Amount" width={150} />
      </ExcelExport> */}
    </div>
  )
}
