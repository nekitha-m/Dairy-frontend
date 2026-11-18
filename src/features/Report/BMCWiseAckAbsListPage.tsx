/* 3. Total Litres(DMR2)Register */
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
import { useGetBmcWiseAckAbsList } from '../../apiclient/report/use-get-bmc-wise-ack-abs-list'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type { BmcWiseAckAbs } from '../../models/Report/BmcWiseAckAbs'
import type Destination from '../../models/masters/Destination'

interface BMCWiseAckAbsGridRow {
  serialNo: number
  bmc: string
  litres: number
  litFat: number
  litSnf: number
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
const calculateRow = (
  item: BmcWiseAckAbs,
  serialNo: number
): BMCWiseAckAbsGridRow => {
  const afLitre = Number(item.afLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const afLitFat = Number(item.afLitFat ?? 0)
  const amLitFat = Number(item.amLitFat ?? 0)
  const arLitFat = Number(item.arLitFat ?? 0)
  const afLitSnf = Number(item.afLitSnf ?? 0)
  const amLitSnf = Number(item.amLitSnf ?? 0)
  const arLitSnf = Number(item.arLitSnf ?? 0)
  const litres = afLitre + arLitre+amLitre
  const litFat = afLitFat + arLitFat+amLitFat
  const litSnf = afLitSnf + arLitSnf+amLitSnf

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    litres: Number(litres.toFixed(1)),
    litFat: Number(litFat.toFixed(3)),
    litSnf: Number(litSnf.toFixed(3)),
  }
}
export function BMCWiseAckAbsListPage() {
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(
    new Date()
  )
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(
    new Date()
  )

  const [selectedDestination, setSelectedDestination] =useState<Destination>(ALL_DESTINATION)

  const [committedFilters, setCommittedFilters] = useState<{
    fromDate: string
    toDate: string
    destinationId: number
  } | null>(null)

  const pdfExportRef = useRef<PDFExport>(null)
  const excelExportRef = useRef<ExcelExport>(null)
  const { data: destinationList = [] } = useGetDestinations()
  const destinations = useMemo(
    () => [ALL_DESTINATION, ...destinationList],
    [destinationList]
  )

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetBmcWiseAckAbsList({
    variables: committedFilters ?? { fromDate: '', toDate: '', destinationId: 0 },
    enabled: committedFilters !== null,
  })
  const gridData = useMemo<BMCWiseAckAbsGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateRow(item, index + 1))
  }, [result])

  const [dataState, setDataState] = useState<State>({ skip: 0, take: 10 })
  useEffect(() => {
    setDataState((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }))
  }, [gridData.length])

  const pagedResult = process(gridData, dataState)
  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.litres += row.litres
        total.litFat += row.litFat
        total.litSnf += row.litSnf

        return total
      },
      {
        litres: 0,
        litFat: 0,
        litSnf: 0,
      }
    )
  }, [gridData])

  const handleGenerate = () => {
    if (!selectedFromDate) {
      window.alert('Please Select Date')
      return
    }

    setCommittedFilters({
      fromDate: formatDate(selectedFromDate),
      toDate: formatDate(selectedToDate),
      destinationId: selectedDestination?.destinationId ?? 0,
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

  const reportTitle = `Total Litres(DMR2)Register${
    committedFilters
      ? ` - ${formatDisplayDate(selectedFromDate)} to ${formatDisplayDate(selectedToDate)}`
      : ''
  }`

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <>
    <PdfPageHeader
      title="3. Total Litres(DMR2)Register"
      subtitle={`BMC Wise Acknowledgement Abstract From ${formatPdfHeaderDate(selectedFromDate) || '-'}  --  ${formatPdfHeaderDate(selectedToDate) || '-'}`}
    />
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
      }}
    >
      page-{props.pageNum}
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
        3. Total Litres(DMR2)Register
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
         
          <div style={{ flexShrink: 0, width: '250px' }}>
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

        
          <div style={{ flexShrink: 0, width: '250px' }}>
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
              style={{
                width: '100%',
              }}
            />
          </div>

         
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
        className="bmcWiseAckAbsGrid"
        style={{ width: '100%' }}
      >
        <GridColumn field="serialNo" title="S.No" width="80px" />
        <GridColumn
          field="bmc"
          title="Bmc"
          width="250px"
          headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
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
          field="litFat"
          title="LitFat"
          width="150px"
          headerClassName="text-center fw-bold"
          format="{0:n3}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.litFat.toFixed(3)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="litSnf"
          title="LitSnf"
          width="150px"
          headerClassName="text-center fw-bold"
          format="{0:n3}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.litSnf.toFixed(3)}
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
            scale={0.65}
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`TotalLitresDMR2_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
          >
            {isPdf && (
              <>
                <div
                  style={{
                    textAlign: 'left',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}
                >
                  Acknowledgement  Type            : {selectedDestination?.name ?? '-'}
                </div>

                <Grid
                  data={gridData}
                  groupable={false}
                  sortable={false}
                  scrollable="none"
                  className="bmcWiseAckAbsGrid"
                  style={{ width: '780px', margin: '0 auto' }}
                >
                  <GridColumn field="serialNo" title="S.No" width="80px" />

                  <GridColumn
                    field="bmc"
                    title="Bmc"
                    width="250px"
                    headerClassName="text-center fw-bold"
                    cells={{
                      footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
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
                    field="litFat"
                    title="LitFat"
                    width="150px"
                    headerClassName="text-center fw-bold"
                    format="{0:n3}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.litFat.toFixed(3)}
                        </td>
                      ),
                    }}
                  />

                  <GridColumn
                    field="litSnf"
                    title="LitSnf"
                    width="150px"
                    headerClassName="text-center fw-bold"
                    format="{0:n3}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.litSnf.toFixed(3)}
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
      <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`TotalLitresDMR2_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="serialNo" title="S.No" width={80} />
        <ExcelExportColumn field="bmc" title="Bmc" width={250} />
        <ExcelExportColumn field="litres" title="Litres" width={150} />
        <ExcelExportColumn field="litFat" title="LitFat" width={150} />
        <ExcelExportColumn field="litSnf" title="LitSnf" width={150} />
      </ExcelExport>
    </div>
  )
}
