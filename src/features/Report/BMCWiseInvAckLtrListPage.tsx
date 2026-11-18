/*   9. Invoice & Ack Litres Register */
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Grid,
  GridColumn as Column,
  GridHeaderCellProps,
  GridNoRecords,
} from "@progress/kendo-react-grid"
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetBmcWiseAckreg } from '../../apiclient/report/use-get-bmc-wise-ackreg'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type { BmcWiseAckreg } from '../../models/Report/BmcWiseAckreg'
import type Bmc from '../../models/masters/Bmc'

interface BMCWiseInvAckLtrGridRow {
  serialNo: number
  bmc: string
  advNo: string
  invLitre: number
  totalAckLitre: number
  diffLitre: number
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
  item: BmcWiseAckreg,
  serialNo: number
): BMCWiseInvAckLtrGridRow => {
  const fLitre = Number(item.fLitre ?? 0)
  const rLitre = Number(item.rLitre ?? 0)
  const afLitre = Number(item.afLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const invLitre = fLitre + rLitre
  const totalAckLitre = afLitre + arLitre
  const diffLitre = totalAckLitre - invLitre

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    advNo: item.advNo ?? '',
    invLitre: Number(invLitre.toFixed(1)),
    totalAckLitre: Number(totalAckLitre.toFixed(1)),
    diffLitre: Number(diffLitre.toFixed(1)),
  }
}
export function BMCWiseInvAckLtrListPage() {
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(new Date())
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(new Date())
  const [selectedBmc, setSelectedBmc] = useState<Bmc>(ALL_BMC)
  const [committedFilters, setCommittedFilters] = useState<{
    fromDate: string
    toDate: string
    bmcId: number
  } | null>(null)

  const pdfExportRef = useRef<PDFExport>(null)
  const excelExportRef = useRef<ExcelExport>(null)
  const { data: bmcList = [] } = useGetBmcs()
  const bmcs = useMemo(() => [ALL_BMC, ...bmcList], [bmcList])
  const {data: result = [],isLoading,error,} = useGetBmcWiseAckreg({
    variables: committedFilters ?? { fromDate: '', toDate: '', bmcId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<BMCWiseInvAckLtrGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateRow(item, index + 1))
  }, [result])

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.invLitre += row.invLitre
        total.totalAckLitre += row.totalAckLitre
        total.diffLitre += row.diffLitre

        return total
      },
      {
        invLitre: 0,
        totalAckLitre: 0,
        diffLitre: 0,
      }
    )
  }, [gridData])

  const [dataState, setDataState] = useState<State>({ skip: 0, take: 10 })

  useEffect(() => {
    setDataState((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }))
  }, [gridData.length])

  const pagedResult = process(gridData, dataState)

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

  const reportTitle = `Invoice & Ack Litres Register${
    committedFilters
      ? ` - ${formatDisplayDate(selectedFromDate)} to ${formatDisplayDate(selectedToDate)}`
      : ''
  }`

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => {
    const isLastPage = props.pageNum === props.totalPages

    return (
      <div>
        <PdfPageHeader
          top={25}
          title="9. Invoice & Ack Litres Register"
          subtitle={`BMC- INVOICED & ACKNOWLEDGEMENT LITRES REGISTER FOR THE PERIOD ${formatPdfHeaderDate(selectedFromDate) || '-'}  --  ${formatPdfHeaderDate(selectedToDate) || '-'}`}
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
        9. Invoice & Ack Litres Register
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
              className="bmcWiseInvAckLtrBmc"
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
          onDataStateChange={(event: any) => setDataState(event.dataState)}
          sortable
          pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
          className="bmcWiseInvAckLtrGrid"
          style={{
            width: '100%',
          }}
        >
          <Column field="serialNo" title="S.No" width="80px" headerClassName="text-center fw-bold" />

          <Column field="bmc" title="Bmc" width="250px"  headerClassName="text-center fw-bold"/>

          <Column
            field="advNo"
            title="Adv No"
            width="120px"
             headerClassName="text-center fw-bold"
            cells={{
              footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
            }}
          />

          <Column
            field="invLitre"
            title="Inv Litre"
            width="120px"
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

          <Column
            field="totalAckLitre"
            title="Total Ack Litre"
            width="140px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.totalAckLitre.toFixed(1)}
                </td>
              ),
            }}
          />

          <Column
            field="diffLitre"
            title="Diff Litre"
            width="120px"
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
        </Grid>
      <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`InvoiceAndAckLitres_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="serialNo" title="S.No" width={80} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn field="advNo" title="Adv No" width={120} />
        <ExcelExportColumn field="invLitre" title="Inv Litre" width={120} />
        <ExcelExportColumn field="totalAckLitre" title="Total Ack Litre" width={140} />
        <ExcelExportColumn field="diffLitre" title="Diff Litre" width={120} />
      </ExcelExport>

      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A4"
            landscape={false}
            margin={{ ...PDF_HEADER_MARGIN, top: '3cm' }}
            scale={0.75}
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`InvoiceAndAckLitres_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
          >
            {isPdf && (
              <>
                <Grid data={gridData} groupable={false} sortable={false} scrollable="none">
                  <Column field="serialNo" title="S.No" width="80px" headerClassName="text-center fw-bold" />

                  <Column field="bmc" title="Bmc" width="200px"  headerClassName="text-center fw-bold"/>

                  <Column
                    field="advNo"
                    title="Adv No"
                    width="120px"
                     headerClassName="text-center fw-bold"
                    cells={{
                      footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                    }}
                  />

                  <Column
                    field="invLitre"
                    title="Inv Litre"
                    width="120px"
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

                  <Column
                    field="totalAckLitre"
                    title="Total Ack Litre"
                    width="140px"
                     headerClassName="text-center fw-bold"
                    format="{0:n1}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.totalAckLitre.toFixed(1)}
                        </td>
                      ),
                    }}
                  />

                  <Column
                    field="diffLitre"
                    title="Diff Litre"
                    width="120px"
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
                </Grid>
              </>
            )}
          </PDFExport>
        </div>
      )}
    </div>
  )
}
