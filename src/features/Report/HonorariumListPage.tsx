/*  7. Honorarium List */
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { PDFExport } from '@progress/kendo-react-pdf'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetHonorariumList } from '../../apiclient/report/use-get-honorarium-list'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type { Honorarium } from '../../models/Report/Honorarium'
import type Bmc from '../../models/masters/Bmc'

interface HonorariumGridRow {
  serialNo: number
  bmc: string
  fatSnf: string
  litre: number
  ts: number
  rate: number
  amount: number
  mbrt: number
  type: string
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

const getQualityRangeTitle = (type: string): string => {
  switch (type) {
    case '1':
      return 'I.QUALITY RANGE MBRT 2.0Hrs & BELOW'
    case '2':
      return 'II.QUALITY RANGE MBRT 2.0 to 3.0Hrs'
    case '3':
      return 'III.QUALITY RANGE MBRT ABOVE 3.0Hrs'
    default:
      return ''
  }
}

const pdfThStyle: CSSProperties = {
  border: '1px solid #000',
  padding: '3px 5px',
  fontSize: '11px',
  fontWeight: 'bold',
  background: '#f0f0f0', 
}

const pdfTdStyle: CSSProperties = {
  border: '1px solid #000',
  padding: '3px 5px',
  fontSize: '11px',
}


const calculateRow = (item: Honorarium, serialNo: number): HonorariumGridRow => {
  return {
    serialNo,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    fatSnf: item.description ?? '',
    litre: Number(Number(item.litre ?? 0).toFixed(1)),
    ts: Number(Number(item.ts ?? 0).toFixed(1)),
    rate: Number(Number(item.rate ?? 0).toFixed(2)),
    amount: Number(Number(item.amount ?? 0).toFixed(2)),
    mbrt: Number(item.mbrt ?? 0),
    type: item.typ ?? '',
  }
}
export function HonorariumListPage() {
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

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <div>
      <PdfPageHeader
        top={25}
        title="7. Honorarium List"
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
    </div>
  )
  const [isPdf, setIsPdf] = useState(false)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)
  const { data: bmcList = [] } = useGetBmcs()
  const bmcs = useMemo(() => [ALL_BMC, ...bmcList], [bmcList])

  const {
    data: result = [],
    isLoading,
    error,
  } = useGetHonorariumList({
    variables: committedFilters ?? { fromDate: '', toDate: '', bmcId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<HonorariumGridRow[]>(() => {
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

        return total
      },
      {
        litre: 0,
        ts: 0,
        rate: 0,
        amount: 0,
      }
    )
  }, [gridData])

  const pdfBmcGroups = useMemo(() => {
    const bmcGroups = new Map<string, HonorariumGridRow[]>()

    gridData.forEach((row) => {
      const bmc = row.bmc || '-'

      if (!bmcGroups.has(bmc)) {
        bmcGroups.set(bmc, [])
      }

      bmcGroups.get(bmc)!.push(row)
    })

      const sortedBmcs = Array.from(bmcGroups.entries()).sort((a, b) => {
      const codeA = Number.parseInt(a[0].split('-')[0], 10)
      const codeB = Number.parseInt(b[0].split('-')[0], 10)

      if (Number.isNaN(codeA) && Number.isNaN(codeB)) {
        return a[0].localeCompare(b[0])
      }

      if (Number.isNaN(codeA)) {
        return 1
      }

      if (Number.isNaN(codeB)) {
        return -1
      }

      return codeA - codeB
    })

    return sortedBmcs.map(([bmc, rows]) => {
      const typeGroups = new Map<string, HonorariumGridRow[]>()

      rows.forEach((row) => {
        const type = row.type || '-'

        if (!typeGroups.has(type)) {
          typeGroups.set(type, [])
        }

        typeGroups.get(type)!.push(row)
      })

      const types = Array.from(typeGroups.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([type, typeRows]) => ({
          key: type,
          rows: typeRows,
          totalLitre: typeRows.reduce((sum, row) => sum + row.litre, 0),
          totalAmount: typeRows.reduce((sum, row) => sum + row.amount, 0),
        }))

      return {
        bmc,
        types,
        grandLitre: types.reduce((sum, type) => sum + type.totalLitre, 0),
        grandAmount: types.reduce((sum, type) => sum + type.totalAmount, 0),
      }
    })
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

  const handlePDFExport =() => {
    if (pdfExportRef.current) {
      setIsPdf(true)

      setTimeout(() => {
        pdfExportRef.current?.save()
        setIsPdf(false)
      }, 100)
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
        7. Honorarium List
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
              className="honorariumListBmc"
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
      </div>

      {/* Loading */}
      {isLoading && <div style={{marginBottom: '10px'}}>Loading...</div>}

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
        onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
        sortable
        pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
        className="honorariumListGrid"
        style={{
          width: '100%',
        }}
      >
        <GridColumn field="serialNo" title="S.No" width="80px"  headerClassName="text-center fw-bold" />
        <GridColumn field="bmc" title="BmcId" width="250px"  headerClassName="text-center fw-bold"/>
        <GridColumn field="fatSnf"title="Fat & Snf"width="150px" headerClassName="text-center fw-bold"
          cells={{
            footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
          }}
        />
        <GridColumn field="litre"title="Litres"width="100px"headerClassName="text-center fw-bold"format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.litre.toFixed(1)}
              </td>
            ),
          }}
        />
        <GridColumn field="ts" title="TS %" width="90px" headerClassName="text-center fw-bold" format="{0:n1}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.ts.toFixed(1)}
              </td>
            ),
          }}
        />
        <GridColumn field="rate" title="Rate" width="90px" headerClassName="text-center fw-bold"
          format="{0:n2}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.rate.toFixed(2)}
              </td>
            ),
          }}
        />

        <GridColumn field="amount" title="Amt" width="100px" headerClassName="text-center fw-bold" format="{0:n2}"
          cells={{
            footerCell: () => (
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                {totals.amount.toFixed(2)}
              </td>
            ),
          }}
        />

        <GridColumn field="mbrt" title="Mbrt" width="90px"  headerClassName="text-center fw-bold"/>
      </Grid>

      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
      <PDFExport
        ref={pdfExportRef}
        paperSize="A4"
        landscape={false}
        margin={{ ...PDF_HEADER_MARGIN, top: '3cm' }}
        scale={0.9}
        forcePageBreak=".pdfBmcPageBreak"
        keepTogether=".pdf-keep-together"
        pageTemplate={PageTemplate}
        fileName={`HonorariumList_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
      >
        {isPdf && (
          pdfBmcGroups.map((group, index) => (
           <div
  key={group.bmc}
  className={index > 0 ? 'pdfBmcPageBreak' : undefined}
  style={{ textAlign: 'center' }}
>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '2px', marginBottom: '12px' }}>
                {`BMC NAME : ${group.bmc}`}
              </div>

              {group.types.map((type) => (
                <div key={type.key} className="pdf-keep-together" style={{ marginBottom: '14px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>
                    {getQualityRangeTitle(type.key)}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={pdfThStyle}>S.No</th>
                        <th style={pdfThStyle}>Fat &amp; Snf</th>
                        <th style={pdfThStyle}>Litres</th>
                        <th style={pdfThStyle}>TS %</th>
                        <th style={pdfThStyle}>Rate</th>
                        <th style={pdfThStyle}>Amount</th>
                        <th style={pdfThStyle}>Mbrt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {type.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td style={pdfTdStyle}>{rowIndex + 1}</td>
                          <td style={pdfTdStyle}>{row.fatSnf}</td>
                          <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{row.litre.toFixed(1)}</td>
                          <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{row.ts.toFixed(1)}</td>
                          <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{row.rate.toFixed(2)}</td>
                          <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{row.amount.toFixed(2)}</td>
                          <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{row.mbrt}</td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: 'bold', background: '#e6e6e6' }}>
                        <td style={pdfTdStyle} colSpan={2}>
                          Total :
                        </td>
                        <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{type.totalLitre.toFixed(1)}</td>
                        <td style={pdfTdStyle}></td>
                        <td style={pdfTdStyle}></td>
                        <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{type.totalAmount.toFixed(2)}</td>
                        <td style={pdfTdStyle}></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <tbody>
                  <tr style={{ fontWeight: 'bold', background: '#d9d9d9' }}>
                    <td style={pdfTdStyle} colSpan={2}>
                      Grand Total :
                    </td>
                    <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{group.grandLitre.toFixed(1)}</td>
                    <td style={pdfTdStyle}></td>
                    <td style={pdfTdStyle}></td>
                    <td style={{ ...pdfTdStyle, textAlign: 'right' }}>{group.grandAmount.toFixed(2)}</td>
                    <td style={pdfTdStyle}></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                <div>
                  1.Certified that total Quantity received  mentioned above for the period
                  <br />
                  {`from ${formatPdfHeaderDate(selectedFromDate) || '-'}  to  ${formatPdfHeaderDate(selectedToDate) || '-'} is verified and correct.`}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 40px 6px 20px', fontWeight: 'bold' }}>
                  <span>AGM (Dairy)</span>
                  <span>DGM (Production)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 40px 16px 20px' }}>
                  <span style={{ borderTop: '1px solid #000', width: '220px' }}>&nbsp;</span>
                  <span style={{ borderTop: '1px solid #000', width: '220px' }}>&nbsp;</span>
                </div>
                <div>
                  2.Certified that  Fat%,SNF% and MBRT of milk received for the period
                  <br />
                  {`from ${formatPdfHeaderDate(selectedFromDate) || '-'}  to  ${formatPdfHeaderDate(selectedToDate) || '-'} is verified and correct.`}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 40px 6px 20px', fontWeight: 'bold' }}>
                  <span>MANAGER (QC)</span>
                  <span>AGM (QC)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 40px 16px 20px' }}>
                  <span style={{ borderTop: '1px solid #000', width: '220px' }}>&nbsp;</span>
                  <span style={{ borderTop: '1px solid #000', width: '220px' }}>&nbsp;</span>
                </div>

                <div>
                  3.Certified that necessary entries were made in the BMC Honorarium Register
                  <br />
                  at Page No.__________ maintained at P&amp;I section.
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 40px 6px 20px', fontWeight: 'bold' }}>
                  <span>AGM (P&amp;I)</span>
                  <span>DGM (P&amp;I)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 40px 16px 20px' }}>
                  <span style={{ borderTop: '1px solid #000', width: '220px' }}>&nbsp;</span>
                  <span style={{ borderTop: '1px solid #000', width: '220px' }}>&nbsp;</span>
                </div>

                <div>
                  {`4.Certified that Honorarium Rs.${group.grandAmount.toFixed(0)} settled as  per commissioner order`}
                  <br />
                  {`Ref: R.C.No.6641/V2/2018 Dt.14.03.2024 for the period  from ${formatPdfHeaderDate(selectedFromDate) || '-'}  to  ${formatPdfHeaderDate(selectedToDate) || '-'}.`}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 40px 6px 20px', fontWeight: 'bold' }}>
                  <span>MANAGER (ACCTS)</span>
                  <span>DGM (FINANCE)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 40px 0 20px' }}>
                  <span style={{ borderTop: '1px solid #000', width: '220px' }}>&nbsp;</span>
                  <span style={{ borderTop: '1px solid #000', width: '220px' }}>&nbsp;</span>
                </div>
              </div>
            </div>
          ))
        )}
      </PDFExport>
        </div>
      )}
    </div>
  )
}
