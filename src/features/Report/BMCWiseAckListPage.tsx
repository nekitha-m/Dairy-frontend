/* 1. DesWise Acknowledgement Register */
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import { useEffect, useMemo, useRef, useState } from 'react'
import {Grid,GridColumn} from '@progress/kendo-react-grid'
import type {GridDataStateChangeEvent,} from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import {ExcelExport, ExcelExportColumn} from '@progress/kendo-react-excel-export'
import { PDFExport } from "@progress/kendo-react-pdf";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetDesWiseAckList } from '../../apiclient/report/use-get-des-wise-ack-list'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type { DesWiseAckList } from '../../models/Report/DesWiseAckList'
import type Destination from '../../models/masters/Destination'

interface DesWiseAckGridRow {
  serialNo: number
  bmc: string
  litres: number
  fat: number
  snf: number
  mbrt: number
}

const toNum = (value: unknown): number => {
  const num = Number(value ?? 0)
  return Number.isFinite(num) ? num : 0
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
  item: DesWiseAckList,
  serialNo: number
): DesWiseAckGridRow => {
  const afLitre = toNum(item.afLitre)
  const amLitre = toNum(item.amLitre)
  const arLitre = toNum(item.arLitre)
  const afLitFat = toNum(item.afLitFat)
  const amLitFat = toNum(item.amLitFat)
  const arLitFat = toNum(item.arLitFat)
  const afLitSnf = toNum(item.afLitSnf)
  const amLitSnf = toNum(item.amLitSnf)
  const arLitSnf = toNum(item.arLitSnf)
  const fMbrt = toNum(item.fMbrt)
  const mMbrt = toNum(item.mMbrt)
  const rMbrt = toNum(item.rMbrt)
  const litres = afLitre + arLitre+amLitre
  const totalLitFat = afLitFat + arLitFat+amLitFat
  const fat =litres > 0? (totalLitFat / litres) * 100: 0
  const totalLitSnf = afLitSnf + arLitSnf+amLitSnf
  const snf =litres > 0? (totalLitSnf / litres) * 100: 0
  const totalMbrt = fMbrt + rMbrt+mMbrt
  const mbrt =totalMbrt < 2? totalMbrt: totalMbrt / 2

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    litres: Number(litres.toFixed(1)),
    fat: Number(fat.toFixed(1)),
    snf: Number(snf.toFixed(1)),
    mbrt: Number(mbrt.toFixed(2)),
  }
}


const calculateExportRow = (
  item: DesWiseAckList,
  serialNo: number
): DesWiseAckGridRow => {
  const afLitre = toNum(item.afLitre)
  const amLitre = toNum(item.amLitre)
  const arLitre = toNum(item.arLitre)
  const afFat = toNum(item.afFat)
  const amFat = toNum(item.amFat)
  const arFat = toNum(item.arFat)
  const afSnf = toNum(item.afSnf)
  const amSnf = toNum(item.amSnf)
  const arSnf = toNum(item.arSnf)
  const fMbrt = toNum(item.fMbrt)
  const mMbrt = toNum(item.mMbrt)
  const rMbrt = toNum(item.rMbrt)
  const litres = afLitre + arLitre+amLitre
  const rawFat = afFat + arFat+amFat
  const rawSnf = afSnf + arSnf+amSnf
  const totalMbrt = fMbrt + rMbrt+mMbrt
  const fat = rawFat < 5 ? rawFat : rawFat / 2
  const snf = rawSnf < 10 ? rawSnf : rawSnf / 2
  const mbrt = totalMbrt

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    litres: Number(litres.toFixed(1)),
    fat: Number(fat.toFixed(1)),
    snf: Number(snf.toFixed(1)),
    mbrt: Number(mbrt.toFixed(2)),
  }
}

export default function DesWiseAcknowledgementRegisterPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    new Date()
  )

  const [selectedDestination, setSelectedDestination] =useState<Destination>(ALL_DESTINATION)
  const [generate, setGenerate] = useState(false)
  const pdfExportRef = useRef<PDFExport | null>(null);
  const excelExportRef = useRef<ExcelExport | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)
  const dateString = formatDate(selectedDate)
  const { data: destinationList = [] } = useGetDestinations()
  const destinations = useMemo(
    () => [ALL_DESTINATION, ...destinationList],
    [destinationList]
  )

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetDesWiseAckList({
    variables: {
      date: dateString,
      destinationId: selectedDestination?.destinationId ?? 0,
    },
    enabled: generate && dateString !== '',
  })

  const gridData = useMemo<DesWiseAckGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) =>
      calculateRow(item, index + 1)
    )
  }, [result])

  
  
  const exportData = useMemo<DesWiseAckGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) =>
      calculateExportRow(item, index + 1)
    )
  }, [result])

  const [dataState, setDataState] = useState<State>({
    skip: 0,
    take: 10,
    sort: [{ field: 'serialNo', dir: 'asc' }],
  })

  useEffect(() => {
    setDataState((prev) => (prev.skip === 0 ? prev : { ...prev, skip: 0 }))
  }, [gridData.length])

  useEffect(() => {
    if (generate && !isLoading && !error && gridData.length === 0) {
      setShowNoDataDialog(true)
    }
  }, [generate, isLoading, error, gridData])

  const pagedResult = process(gridData, dataState)

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.litres += row.litres
        total.fat += row.fat
        total.snf += row.snf
        total.mbrt += row.mbrt

        return total
      },
      {
        litres: 0,
        fat: 0,
        snf: 0,
        mbrt: 0,
      }
    )
  }, [gridData])

  const handleGenerate = () => {
    if (!selectedDate) {
      window.alert('Please Select Date')
      return
    }

    setGenerate(true)
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

    excelExportRef.current.save(options)
  }
}

const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
  <>
  <PdfPageHeader
    title="1. DesWise Acknowledgement Register"
    subtitle={`BMC REGISTER FOR THE PERIOD ${formatPdfHeaderDate(selectedDate) || '-'}`}
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
        1. DesWise Acknowledgement Register
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
              Date *
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

          <div style={{ flexShrink: 0, width: '290px' }}>
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
              onChange={(event) =>
                setSelectedDestination(event.value)
              }
              className="bmcWiseAckDestination"
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
      {isLoading && (
        <div style={{ marginBottom: '10px' }}>
          Loading...
        </div>
      )}

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
        pageable={{ buttonCount: 5, pageSizes: [10, 25, 50, 100], info: true }}
        className="bmcWiseAckGrid"
        style={{ width: '100%' }}
      >
        <GridColumn
          field="serialNo"
          title="S.No"
          width="90px"
          headerClassName="text-center fw-bold"
        />

        <GridColumn
          field="bmc"
          title="BMC"
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
          field="fat"
          title="Fat"
          width="120px"
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
          title="SNF"
          width="120px"
            headerClassName="text-center fw-bold"
          format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.snf.toFixed(1)}
              </td>
            ),
          }}
        />

        <GridColumn
          field="mbrt"
          title="MBRT"
          width="120px"
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
            scale={0.50}
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`DesWiseAcknowledgement_${dateString}.pdf`}
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
                    Acknowledgement Type : {selectedDestination?.name ?? '-'}
                  </div>

                  <Grid
                    data={gridData}
                    groupable={false}
                    sortable={false}
                    scrollable="none"
                    className="bmcWiseAckGrid"
                    style={{ width: '850px', margin: '0 auto' }}
                  >
                    <GridColumn
                      field="serialNo"
                      title="S.No"
                      width="90px"
                      headerClassName="text-center fw-bold"
                    />

                    <GridColumn
                      field="bmc"
                      title="BMC"
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
                      field="fat"
                      title="Fat"
                      width="120px"
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
                      title="SNF"
                      width="120px"
                        headerClassName="text-center fw-bold"
                      format="{0:n1}"
                      cells={{
                        footerCell: () => (
                          <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                            {totals.snf.toFixed(1)}
                          </td>
                        ),
                      }}
                    />

                    <GridColumn
                      field="mbrt"
                      title="MBRT"
                      width="120px"
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
      <ExcelExport
        ref={excelExportRef}
        data={exportData}
        fileName={`BMCWiseAck_${dateString}.xlsx`}
      >
        <ExcelExportColumn field="serialNo" title="S.No" width={90} />
        <ExcelExportColumn field="bmc" title="BMC" width={250} />
        <ExcelExportColumn field="litres" title="Litres" width={150} cellOptions={{ format: '0.0' }} />
        <ExcelExportColumn field="fat" title="Fat" width={120} cellOptions={{ format: '0.0' }} />
        <ExcelExportColumn field="snf" title="SNF" width={120} cellOptions={{ format: '0.0' }} />
        <ExcelExportColumn field="mbrt" title="MBRT" width={120} cellOptions={{ format: '0.00' }} />
      </ExcelExport>
    </div>
  )
}