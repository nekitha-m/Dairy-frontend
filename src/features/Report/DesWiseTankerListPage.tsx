/*   12. DesWiseTankerAcknowledgement Register */
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
import { useGetDesWiseTankerList } from '../../apiclient/report/use-get-des-wise-tanker-list'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type { DesWiseTankerList } from '../../models/Report/DesWiseTankerList'
import type Destination from '../../models/masters/Destination'
import { safePercent } from '../../utils/safePercent'

interface DesWiseTankerGridRow {
  serialNo: number
  bmc: string
  tankerNo: number | string
  invNo: string
  litres: number
  kg: number
  kgFat: number
  kgSnf: number
  kgTs: number
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
  item: DesWiseTankerList,
  serialNo: number
): DesWiseTankerGridRow => {
  const afLitre = Number(item.afLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const afLitFat = Number(item.afLitFat ?? 0)
  const arLitFat = Number(item.arLitFat ?? 0)
  const amLitFat = Number(item.amLitFat ?? 0)
  const afLitSnf = Number(item.afLitSnf ?? 0)
  const arLitSnf = Number(item.arLitSnf ?? 0)
  const amLitSnf = Number(item.amLitSnf ?? 0)
  const gravity = Number(item.gravity ?? 0)
  const kg = Number(item.kg ?? 0)
  const litres = afLitre + arLitre + amLitre
  const litFat = afLitFat + arLitFat + amLitFat
  const litSnf = afLitSnf + arLitSnf + amLitSnf
  const fat = safePercent(litFat, litres)
  const snf = safePercent(litSnf, litres)
  const kgLtrs = litres * gravity
  const kgFat = (kgLtrs * fat) / 100
  const kgSnf = (kgLtrs * snf) / 100
  const kgTs = kgFat + kgSnf

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    tankerNo: item.tankerNo ?? '',
    invNo: item.invoiceNo ?? '',
    litres: Number(litres.toFixed(1)),
    kg: Number(kg.toFixed(1)),
    kgFat: Number(kgFat.toFixed(1)),
    kgSnf: Number(kgSnf.toFixed(1)),
    kgTs: Number(kgTs.toFixed(1)),
  }
}
const calculateExportRow = (
  item: DesWiseTankerList,
  serialNo: number
): DesWiseTankerGridRow => {
  const afLitre = Number(item.afLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const afFat = Number(item.afFat ?? 0)
  const arFat = Number(item.arFat ?? 0)
  const amFat = Number(item.amFat ?? 0)
  const afSnf = Number(item.afSnf ?? 0)
  const arSnf = Number(item.arSnf ?? 0)
  const amSnf = Number(item.amSnf ?? 0)
  const gravity = Number(item.gravity ?? 0)
  const kg = Number(item.kg ?? 0)
  const litres = afLitre + arLitre + amLitre
  const rawFat = afFat + arFat + amFat
  const rawSnf = afSnf + arSnf + amSnf
  const fat = rawFat < 5 ? rawFat : rawFat / 2
  const snf = rawSnf < 10 ? rawSnf : rawSnf / 2
  const kgLtrs = Number((litres * gravity).toFixed(1))
  const kgFat = (kgLtrs * fat) / 100
  const kgSnf = (kgLtrs * snf) / 100
  const kgTs = kgFat + kgSnf

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    tankerNo: item.tankerNo ?? '',
    invNo: item.invoiceNo ?? '',
    litres: Number(litres.toFixed(1)),
    kg: Number(kg.toFixed(1)),
    kgFat: Number(kgFat.toFixed(1)),
    kgSnf: Number(kgSnf.toFixed(1)),
    kgTs: Number(kgTs.toFixed(1)),
  }
}
export function DesWiseTankerListPage() {
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
  } = useGetDesWiseTankerList({
    variables: committedFilters ?? { date: '', destinationId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<DesWiseTankerGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateRow(item, index + 1))
  }, [result])

  
  const exportData = useMemo<DesWiseTankerGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateExportRow(item, index + 1))
  }, [result])

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.litres += row.litres
        total.kg += row.kg
        total.kgFat += row.kgFat
        total.kgSnf += row.kgSnf
        total.kgTs += row.kgTs
        return total
      },
      {
        litres: 0,
        kg: 0,
        kgFat: 0,
        kgSnf: 0,
        kgTs: 0,
      }
    )
  }, [gridData])

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
    <div>
      <PdfPageHeader
        title="12. DesWiseTankerAcknowledgement Register"
        subtitle={
          <>
            <div>{`TANKER ARRIVALS FROM BMC TO FBD(ERODE) DAIRY  for  : ${formatPdfHeaderDate(selectedDate) || '-'}`}</div>
            <div>
              {`Acknowledgement  Type                  : ${
                selectedDestination?.destinationId ? selectedDestination.name ?? '-' : 'ALL'
              }`}
            </div>
          </>
        }
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

  return (
    <div style={{ padding: '20px' }}>
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '25px',
        }}
      >
        12. DesWiseTankerAcknowledgement Register
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
              className="desWiseTankerDestination"
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
        className="desWiseTankerGrid"
        style={{
          width: '100%',
        }}
      >
        <Column field="serialNo" title="S.No" width="80px"  headerClassName="text-center fw-bold"/>
        <Column field="bmc" title="Bmc" width="250px"  headerClassName="text-center fw-bold"/>
        <Column field="tankerNo" title="Tanker No" width="120px"  headerClassName="text-center fw-bold"/>
        <Column
          field="invNo"
          title="Inv No"
          width="110px"
           headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
          }}
        />

      {/*   <Column title="Acknowledgement" headerClassName="text-center fw-bold"> */}
          <Column
            field="litres"
            title="Litres"
            width="110px"
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

          <Column
            field="kg"
            title="Kgs"
            width="100px"
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

          <Column
            field="kgFat"
            title="Kg.Fat"
            width="100px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.kgFat.toFixed(1)}
                </td>
              ),
            }}
          />

          <Column
            field="kgSnf"
            title="Kg.Snf"
            width="100px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.kgSnf.toFixed(1)}
                </td>
              ),
            }}
          />

          <Column
            field="kgTs"
            title="Kg.Ts"
            width="100px"
             headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.kgTs.toFixed(1)}
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
            scale={0.51}
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`DesWiseTanker_${committedFilters?.date ?? ''}.pdf`}
          >
              {isPdf && (
                <>
                  <Grid
                    data={gridData}
                    groupable={false}
                    sortable={false}
                    scrollable="none"
                    className="desWiseTankerGrid"
                    style={{
                      width: '100%',
                    }}
                  >
                    <Column field="serialNo" title="S.No" width="80px"  headerClassName="text-center fw-bold"/>

                    <Column field="bmc" title="Bmc" width="250px"  headerClassName="text-center fw-bold"/>

                    <Column field="tankerNo" title="Tanker No" width="120px"  headerClassName="text-center fw-bold"/>

                    <Column
                      field="invNo"
                      title="Inv No"
                      width="110px"
                       headerClassName="text-center fw-bold"
                      cells={{
                        footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                      }}
                    />

                    <Column title="Acknowledgement" headerClassName="text-center fw-bold">
                      <Column
                        field="litres"
                        title="Litres"
                        width="110px"
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

                      <Column
                        field="kg"
                        title="Kgs"
                        width="100px"
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

                      <Column
                        field="kgFat"
                        title="Kg.Fat"
                        width="100px"
                         headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.kgFat.toFixed(1)}
                            </td>
                          ),
                        }}
                      />

                      <Column
                        field="kgSnf"
                        title="Kg.Snf"
                        width="100px"
                         headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.kgSnf.toFixed(1)}
                            </td>
                          ),
                        }}
                      />

                      <Column
                        field="kgTs"
                        title="Kg.Ts"
                        width="100px"
                         headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {totals.kgTs.toFixed(1)}
                            </td>
                          ),
                        }}
                      />
                    </Column>
                  </Grid>
                </>
              )}
          </PDFExport>
        </div>
      )}

      {/* Excel export — explicit columns matching the export row shape */}
      <ExcelExport
        ref={excelExportRef}
        data={exportData}
        fileName={`DesWiseTanker_${committedFilters?.date ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="serialNo" title="S.No" width={80} />
        <ExcelExportColumn field="bmc" title="Bmc" width={180} />
        <ExcelExportColumn field="tankerNo" title="Tanker No" width={110} />
        <ExcelExportColumn field="invNo" title="Inv No" width={110} />
        <ExcelExportColumn field="litres" title="Litres" width={110} />
        <ExcelExportColumn field="kg" title="Kgs" width={100} />
        <ExcelExportColumn field="kgFat" title="Kg.Fat" width={100} />
        <ExcelExportColumn field="kgSnf" title="Kg.Snf" width={100} />
        <ExcelExportColumn field="kgTs" title="Kg.Ts" width={100} />
      </ExcelExport>
    </div>
  )
}
