/* 17. Back Abstract Register */
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn } from '@progress/kendo-react-grid'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import { DatePicker } from '@progress/kendo-react-dateinputs'
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetDesWiseBMCTankerList } from '../../apiclient/report/use-get-des-wise-bmc-tanker-list'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type { DesWiseBMCTanker } from '../../models/Report/DesWiseBMCTanker'
import type Destination from '../../models/masters/Destination'
import { safePercent } from '../../utils/safePercent'

interface BackAbstractGridRow {
  serialNo: number
  bmc: string
  tankerNo: number | string
  fat: number
  snf: number
}

interface BackAbstractExportRow {
  serialNo: number
  bmc: string
  invLitre: number
  invLitFat: number
  invLitSnf: number
  invLitTs: number
  ackLitre: number
  ackLitFat: number
  ackLitSnf: number
  ackLitTs: number
  diffLitre: number
  diffLitFat: number
  diffLitSnf: number
  diffLitFatP: number
  diffLitSnfP: number
  diffLitTs: number
  diffLitTsP: number
}
const ALL_DESTINATION: Destination =
 {
  destinationId: 0,
  name: '-All-',
}
const formatDate = (date: Date | null): string => 
  {
  if (!date) {
    return ''
  }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${year}-${month}-${day}`
}
const calculateRow = (
  item: DesWiseBMCTanker,
  serialNo: number
): BackAbstractGridRow => {
  const afLitre = Number(item.afLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const afLitFat = Number(item.afLitFat ?? 0)
  const amLitFat = Number(item.amLitFat ?? 0)
  const arLitFat = Number(item.arLitFat ?? 0)
  const afLitSnf = Number(item.afLitSnf ?? 0)
  const amLitSnf = Number(item.amLitSnf ?? 0)
  const arLitSnf = Number(item.arLitSnf ?? 0)
  const totalALtrs = Number((afLitre + arLitre+amLitre).toFixed(1))
  const ttlALitFat = Number((afLitFat + arLitFat+amLitFat).toFixed(3))
  const ttlALitSnf = Number((afLitSnf + arLitSnf+amLitSnf).toFixed(3))
  const fat = safePercent(ttlALitFat, totalALtrs)
  const snf = safePercent(ttlALitSnf, totalALtrs)
  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    tankerNo: item.tankerNo ?? '',
    fat,
    snf,
  }
}

const calculateExportRow = (
  item: DesWiseBMCTanker,
  serialNo: number
): BackAbstractExportRow => {
  const fLitre = Number(item.fLitre ?? 0)
   const mLitre = Number(item.mLitre ?? 0)
  const rLitre = Number(item.rLitre ?? 0)
  const fLitFat = Number(item.fLitFat ?? 0)
  const mLitFat = Number(item.mLitFat ?? 0)
  const rLitFat = Number(item.rLitFat ?? 0)
  const fLitSnf = Number(item.fLitSnf ?? 0)
  const mLitSnf = Number(item.mLitSnf ?? 0)
  const rLitSnf = Number(item.rLitSnf ?? 0)
  const afLitre = Number(item.afLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const afLitFat = Number(item.afLitFat ?? 0)
  const amLitFat = Number(item.amLitFat ?? 0)
  const arLitFat = Number(item.arLitFat ?? 0)
  const afLitSnf = Number(item.afLitSnf ?? 0)
  const amLitSnf = Number(item.amLitSnf ?? 0)
  const arLitSnf = Number(item.arLitSnf ?? 0)
  const invLitre = fLitre + rLitre+mLitre
  const invLitFat = fLitFat + rLitFat+mLitFat
  const invLitSnf = fLitSnf + rLitSnf+mLitSnf
  const invLitTs = invLitFat + invLitSnf
  const ackLitre = afLitre + arLitre+amLitre
  const ackLitFat = afLitFat + arLitFat+amLitFat
  const ackLitSnf = afLitSnf + arLitSnf+amLitSnf
  const ackLitTs = ackLitFat + ackLitSnf
  const diffLitre = ackLitre - invLitre
  const diffLitFat = ackLitFat - invLitFat
  const diffLitSnf = ackLitSnf - invLitSnf
  const diffLitFatP = safePercent(diffLitFat, invLitFat)
  const diffLitSnfP = safePercent(diffLitSnf, invLitSnf)
  const diffLitTs = diffLitFat + diffLitFatP
  const diffLitTsP = diffLitFatP + diffLitSnfP

  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    invLitre: Number(invLitre.toFixed(1)),
    invLitFat: Number(invLitFat.toFixed(3)), 
    invLitSnf: Number(invLitSnf.toFixed(3)),
    invLitTs: Number(invLitTs.toFixed(3)),
    ackLitre: Number(ackLitre.toFixed(1)),
    ackLitFat: Number(ackLitFat.toFixed(3)),
    ackLitSnf: Number(ackLitSnf.toFixed(3)),
    ackLitTs: Number(ackLitTs.toFixed(3)),
    diffLitre: Number(diffLitre.toFixed(1)),
    diffLitFat: Number(diffLitFat.toFixed(3)),
    diffLitSnf: Number(diffLitSnf.toFixed(3)),
    diffLitFatP: Number(diffLitFatP.toFixed(3)),
    diffLitSnfP: Number(diffLitSnfP.toFixed(3)),
    diffLitTs: Number(diffLitTs.toFixed(3)),
    diffLitTsP: Number(diffLitTsP.toFixed(3)),
  }
}

export function BackAbstractListPage() {
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(new Date())
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(new Date())
  const [selectedDestination, setSelectedDestination] =useState<Destination>(ALL_DESTINATION)
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
  const destinations = useMemo(() => [ALL_DESTINATION, ...destinationList],[destinationList])

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetDesWiseBMCTankerList({
    variables: committedFilters ?? { fromDate: '', toDate: '', destinationId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<BackAbstractGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateRow(item, index + 1))
  }, [result])

  const exportData = useMemo<BackAbstractExportRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item, index) => calculateExportRow(item, index + 1))
  }, [result])

  useEffect(() => {
    if (committedFilters && !isLoading && !error && gridData.length === 0) {
      setShowNoDataDialog(true)
    }
  }, [committedFilters, isLoading, error, gridData])

  const totals = useMemo(() => {
    return gridData.reduce(
      (total, row) => {
        total.fat += row.fat
        total.snf += row.snf

        return total
      },
      {
        fat: 0,
        snf: 0,
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
        const columnCount = sheet.columns?.length ?? 1

        sheet.rows = [
          {
            cells: [
              {
                value: '17. Back Abstract Register',
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
                value: `From: ${committedFilters?.fromDate ?? '-'}    To: ${committedFilters?.toDate ?? '-'}    Destination: ${selectedDestination?.name ?? '-'}`,
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

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <>
      <PdfPageHeader
        title="17. Back Abstract Register"
        subtitle={`From: ${committedFilters?.fromDate ?? '-'} | To: ${committedFilters?.toDate ?? '-'} | Destination: ${selectedDestination?.name ?? '-'}`}
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
        17. Back Abstract Register
      </h3>

      <div
        style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '5px',
          background: '#f5f5f5',
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
              value={selectedFromDate}
              format="dd/MM/yyyy"
              onChange={(event) => setSelectedFromDate(event.value)}
              style={{
                width: '100%',
              }}
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
              value={selectedToDate}
              format="dd/MM/yyyy"
              onChange={(event) => setSelectedToDate(event.value)}
              style={{
                width: '100%',
              }}
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
              Destination *<label htmlFor=""></label>
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
      {/* On-screen grid */}
      <Grid
        data={gridData}
        className="backAbstractGrid"
        style={{
          height: 'auto',
          width: '100%',
        }}
      >
        <GridColumn field="serialNo" title="S.No" width="80px" />

        <GridColumn
          field="bmc"
          title="Bmc"
          width="200px"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold' }}>Total</td>
            ),
          }}
        />

        <GridColumn field="tankerNo" title="TankerNo" width="110px" />

        <GridColumn
          field="fat"
          title="Fat"
          width="110px"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.fat}
              </td>
            ),
          }}
        />

        <GridColumn
          field="snf"
          title="Snf"
          width="110px"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.snf}
              </td>
            ),
          }}
        />
      </Grid>

      {/* PDF layout: Invoiced / Acknowledged / Difference per BMC, rendered off-screen and only while exporting */}
      {exportData.length > 0 && (
        // fixed (not absolute) so the off-screen PDF content never adds to the page's scrollable size while exporting
        <div style={{ position: 'fixed', left: '-10000px', top: 0, pointerEvents: 'none' }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A4"
            landscape
            margin={PDF_HEADER_MARGIN}
            scale={0.62}
            pageTemplate={PageTemplate}
            repeatHeaders
            keepTogether="tr"
            fileName={`BackAbstractRegister_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
          >
            {isPdf && (
              // Usable page width at scale 0.62 estimated from the rendered PDF (~1480 layout px); the 1290px table is centred inside it
              <div style={{ width: '1312px', fontFamily: '"Times New Roman", Times, serif', color: '#000' }}>
                <div style={{ width: '1290px', margin: '0 auto' }}>
                  <table
                    style={{
                      width: '1290px',
                      borderCollapse: 'collapse',
                      tableLayout: 'fixed',
                      fontSize: '15px',
                      fontWeight: 'bold',
                    }}
                  >
                    <colgroup>
                      <col style={{ width: '45px' }} />
                      <col style={{ width: '215px' }} />
                      {Array.from({ length: 15 }).map((_, i) => (
                        <col key={i} style={{ width: '70px' }} />
                      ))}
                    </colgroup>
                    <thead>
                      <tr style={{ borderTop: '1px solid #000' }}>
                        <th rowSpan={2} style={{ textAlign: 'left', padding: '4px', verticalAlign: 'bottom', borderBottom: '1px solid #000' }}>
                          S<br />No
                        </th>
                        <th rowSpan={2} style={{ textAlign: 'center', padding: '4px', verticalAlign: 'bottom', borderBottom: '1px solid #000' }}>
                          BmcName
                        </th>
                        <th colSpan={4} style={{ textAlign: 'center', padding: '4px', borderLeft: '1px solid #000' }}>Invoiced</th>
                        <th colSpan={4} style={{ textAlign: 'center', padding: '4px', borderLeft: '1px solid #000' }}>Acknowledged</th>
                        <th colSpan={7} style={{ textAlign: 'center', padding: '4px', borderLeft: '1px solid #000' }}>Difference</th>
                      </tr>
                      <tr>
                        {[
                          'Litre', 'LitFat', 'LitSnf', 'LitTs',
                          'Litre', 'LitFat', 'LitSnf', 'LitTs',
                          'Litre', 'LitFat', 'LitFat%', 'LitSnf', 'LitSnf%', 'LitTs', 'LitTs%',
                        ].map((title, i) => (
                          <th
                            key={`${title}-${i}`}
                            style={{
                              textAlign: 'center',
                              padding: '4px',
                              borderBottom: '1px solid #000',
                              borderLeft: i === 0 || i === 4 || i === 8 ? '1px solid #000' : undefined,
                            }}
                          >
                            {title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.map((row) => (
                        <tr key={row.serialNo}>
                          <td style={{ padding: '3px 4px' }}>{row.serialNo}</td>
                          <td style={{ padding: '3px 4px', whiteSpace: 'nowrap' }}>{row.bmc}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.invLitre.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.invLitFat.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.invLitSnf.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.invLitTs.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.ackLitre.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.ackLitFat.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.ackLitSnf.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.ackLitTs.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.diffLitre.toFixed(1)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.diffLitFat.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.diffLitFatP.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.diffLitSnf.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.diffLitSnfP.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.diffLitTs.toFixed(3)}</td>
                          <td style={{ textAlign: 'right', padding: '3px 4px' }}>{row.diffLitTsP.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </PDFExport>
        </div>
      )}
      <ExcelExport
        ref={excelExportRef}
        data={exportData}
        fileName={`BMCWiseTanker3-${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="serialNo" title="S.No" width={80} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn title="Invoice">
          <ExcelExportColumn field="invLitre" title="Litre" />
          <ExcelExportColumn field="invLitFat" title="LitFat" />
          <ExcelExportColumn field="invLitSnf" title="LitSnf" />
          <ExcelExportColumn field="invLitTs" title="LitTs" />
        </ExcelExportColumn>
        <ExcelExportColumn title="Acknowledgement">
          <ExcelExportColumn field="ackLitre" title="Litre" />
          <ExcelExportColumn field="ackLitFat" title="LitFat" />
          <ExcelExportColumn field="ackLitSnf" title="LitSnf" />
          <ExcelExportColumn field="ackLitTs" title="LitTs" />
        </ExcelExportColumn>
        <ExcelExportColumn title="Difference">
          <ExcelExportColumn field="diffLitre" title="Litre" />
          <ExcelExportColumn field="diffLitFat" title="LitFat" />
          <ExcelExportColumn field="diffLitSnf" title="LitSnf" />
          <ExcelExportColumn field="diffLitFatP" title="LitFat%" />
          <ExcelExportColumn field="diffLitSnfP" title="LitSnf%" />
          <ExcelExportColumn field="diffLitTs" title="LitTs" />
          <ExcelExportColumn field="diffLitTsP" title="LitTs%" />
        </ExcelExportColumn>
      </ExcelExport>
    </div>
  )
}
