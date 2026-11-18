/*   8. ConfiscatedMilk Details */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Grid,
  GridColumn as Column,
} from "@progress/kendo-react-grid"
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetConfiscatedMilkList } from '../../apiclient/report/use-get-confiscated-milk-list'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type { ConfiscatedMilk } from '../../models/Report/ConfiscatedMilk'
import type Bmc from '../../models/masters/Bmc'

interface ConfiscatedMilkGridRow {
  date: string
  bmc: string
  invNo: string
  tankerNo:  string
  litre: number
  ts: number
  rate: number
  amount: number
  mbrt: number
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


const calculateRow = (item: ConfiscatedMilk): ConfiscatedMilkGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    invNo: item.invoiceNumber ?? '',
    tankerNo: item.tankerId ?? '',
    litre: Number(Number(item.litre ?? 0).toFixed(2)),
    ts: Number(Number(item.ts ?? 0).toFixed(1)),
    rate: Number(Number(item.rate ?? 0).toFixed(2)),
    amount: Number(Number(item.amount ?? 0).toFixed(2)),
    mbrt: Number(Number(item.mbrt ?? 0).toFixed(2)),
  }
}
export function ConfiscatedMilkListPage() {
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
  const excelExportRef = useRef<ExcelExport>(null)
  const [isPdf, setIsPdf] = useState(false)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)

  const { data: bmcList = [] } = useGetBmcs()
  const bmcs = useMemo(() => [ALL_BMC, ...bmcList], [bmcList])

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetConfiscatedMilkList({
    variables: committedFilters ?? { fromDate: '', toDate: '', bmcId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<ConfiscatedMilkGridRow[]>(() => {
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
        total.litre += row.litre
        total.ts += row.ts
        total.rate += row.rate
        total.amount += row.amount
        total.mbrt += row.mbrt

        return total
      },
      {
        litre: 0,
        ts: 0,
        rate: 0,
        amount: 0,
        mbrt: 0,
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

const handleExcelExport = () => {
  if (excelExportRef.current) {
    const options = excelExportRef.current.workbookOptions()
    const sheet = options.sheets?.[0]

    if (sheet) {
      sheet.rows = [...(sheet.rows ?? [])]
    }

    excelExportRef.current.save(options)
  }
}

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <>
    <PdfPageHeader
      title="8. ConfiscatedMilk Details"
      subtitle={`ConfiscatedMilk Details from ${formatPdfHeaderDate(selectedFromDate) || '-'} to ${formatPdfHeaderDate(selectedToDate) || '-'}`}
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
        8. ConfiscatedMilk Details
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
              className="confiscatedMilkBmc"
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
        onDataStateChange={(event: any) => setDataState(event.dataState)}
        sortable
        pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
        className="confiscatedMilkGrid"
        style={{
          width: '100%',
        }}
      >
        <Column field="date" title="Date" width="100px"   headerClassName="text-center fw-bold"/>

        <Column field="bmc" title="BmcName" width="250px" headerClassName="text-center fw-bold" />

        <Column field="invNo" title="Inv No" width="100px"headerClassName="text-center fw-bold"/>

        <Column
          field="tankerNo"
          title="TankerNo"
          width="100px"
          headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
          }}
        />

        <Column
          field="litre"
          title="Litre"
          width="100px"
          headerClassName="text-center fw-bold"
          format="{0:n2}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.litre.toFixed(2)}
              </td>
            ),
          }}
        />

        <Column
          field="ts"
          title="TS"
          width="90px"
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

        <Column
          field="rate"
          title="Rate"
          width="90px"
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

        <Column
          field="amount"
          title="Amount"
          width="100px"
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

        <Column
          field="mbrt"
          title="MBRT"
          width="90px"
          headerClassName="text-center fw-bold"
          format="{0:n2}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.mbrt.toFixed(2)}
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
            scale={0.55}
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`ConfiscatedMilkDetails_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
          >
              {isPdf && (
                <>
                  <Grid
                    data={gridData}
                    groupable={false}
                    sortable={false}
                    scrollable="none"
                    className="confiscatedMilkGrid"
                    style={{
                      width: '100%',
                    }}
                  >
                    <Column field="date" title="Date" width="100px"   headerClassName="text-center fw-bold"/>

                    <Column field="bmc" title="BmcName" width="250px" headerClassName="text-center fw-bold" />

                    <Column field="invNo" title="Inv No" width="100px"headerClassName="text-center fw-bold"/>

                    <Column
                      field="tankerNo"
                      title="TankerNo"
                      width="100px"
                      headerClassName="text-center fw-bold"
                      cells={{
                        footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                      }}
                    />

                    <Column
                      field="litre"
                      title="Litre"
                      width="100px"
                      headerClassName="text-center fw-bold"
                      format="{0:n2}"
                      cells={{
                        footerCell: () => (
                          <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                            {totals.litre.toFixed(2)}
                          </td>
                        ),
                      }}
                    />

                    <Column
                      field="ts"
                      title="TS"
                      width="90px"
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

                    <Column
                      field="rate"
                      title="Rate"
                      width="90px"
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

                    <Column
                      field="amount"
                      title="Amount"
                      width="100px"
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

                    <Column
                      field="mbrt"
                      title="MBRT"
                      width="90px"
                      headerClassName="text-center fw-bold"
                      format="{0:n2}"
                      cells={{
                        footerCell: () => (
                          <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                            {totals.mbrt.toFixed(2)}
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
        fileName={`ConfiscatedMilkDetails_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="date" title="Date" width={100} />
        <ExcelExportColumn field="bmc" title="BmcName" width={180} />
        <ExcelExportColumn field="invNo" title="Inv No" width={100} />
        <ExcelExportColumn field="tankerNo" title="TankerNo" width={100} />
        <ExcelExportColumn field="litre" title="Litre" width={100} />
        <ExcelExportColumn field="ts" title="TS" width={90} />
        <ExcelExportColumn field="rate" title="Rate" width={90} />
        <ExcelExportColumn field="amount" title="Amount" width={100} />
        <ExcelExportColumn field="mbrt" title="MBRT" width={90} />
      </ExcelExport>
    </div>
  )
}
