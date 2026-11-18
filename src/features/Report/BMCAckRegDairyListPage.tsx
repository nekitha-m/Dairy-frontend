
/*  10.Ack.Register2(Abstract) */
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

interface BMCAckRegDairyGridRow {
  date: string
  bmc: string
  advNo: string
  fLitre: number
  fLitFat: number
  fLitSnf: number
  mLitre: number
  mLitFat: number
  mLitSnf: number
  rLitre: number
  rLitFat: number
  rLitSnf: number
  invLitre: number
  afLitre: number
  amLitre: number
  arLitre: number
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

const computeTotals = (rows: BMCAckRegDairyGridRow[]) =>
  rows.reduce(
    (total, row) => {
      total.fLitre += row.fLitre
      total.fLitFat += row.fLitFat
      total.fLitSnf += row.fLitSnf
      total.mLitre += row.mLitre
      total.mLitFat += row.mLitFat
      total.mLitSnf += row.mLitSnf
      total.rLitre += row.rLitre
      total.rLitFat += row.rLitFat
      total.rLitSnf += row.rLitSnf
      total.invLitre += row.invLitre
      total.afLitre += row.afLitre
      total.amLitre += row.amLitre
      total.arLitre += row.arLitre
      total.totalAckLitre += row.totalAckLitre
      total.diffLitre += row.diffLitre
      return total
    },
    {
      fLitre: 0,
      fLitFat: 0,
      fLitSnf: 0,
      mLitre: 0,
      mLitFat: 0,
      mLitSnf: 0,
      rLitre: 0,
      rLitFat: 0,
      rLitSnf: 0,
      invLitre: 0,
      afLitre: 0,
      amLitre: 0,
      arLitre: 0,
      totalAckLitre: 0,
      diffLitre: 0,
    }
  )
const calculateRow = (item: BMCAckRegDiff): BMCAckRegDairyGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  const fLitre = Number(item.fLitre ?? 0)
  const fLitFat = Number(item.fLitFat ?? 0)
  const fLitSnf = Number(item.fLitSnf ?? 0)
  const mLitre = Number(item.mLitre ?? 0)
  const mLitFat = Number(item.mLitFat ?? 0)
  const mLitSnf = Number(item.mLitSnf ?? 0)
  const rLitre = Number(item.rLitre ?? 0)
  const rLitFat = Number(item.rLitFat ?? 0)
  const rLitSnf = Number(item.rLitSnf ?? 0)
  const afLitre = Number(item.afLitre ?? 0)
  const amLitre = Number(item.amLitre ?? 0)
  const arLitre = Number(item.arLitre ?? 0)
  const invLitre = fLitre + rLitre + mLitre
  const totalAckLitre = afLitre + arLitre + amLitre
  const diffLitre = totalAckLitre - invLitre

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    advNo: item.advNo ?? '',
    fLitre: Number(fLitre.toFixed(2)),
    fLitFat: Number(fLitFat.toFixed(2)),
    fLitSnf: Number(fLitSnf.toFixed(2)),
    mLitre: Number(mLitre.toFixed(2)),
    mLitFat: Number(mLitFat.toFixed(2)),
    mLitSnf: Number(mLitSnf.toFixed(2)),
    rLitre: Number(rLitre.toFixed(2)),
    rLitFat: Number(rLitFat.toFixed(2)),
    rLitSnf: Number(rLitSnf.toFixed(2)),
    invLitre: Number(invLitre.toFixed(1)),
    afLitre: Number(afLitre.toFixed(2)),
    amLitre: Number(amLitre.toFixed(2)),
    arLitre: Number(arLitre.toFixed(2)),
    totalAckLitre: Number(totalAckLitre.toFixed(1)),
    diffLitre: Number(diffLitre.toFixed(1)),
  }
}
export function BMCAckRegDairyListPage() {
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

  const gridData = useMemo<BMCAckRegDairyGridRow[]>(() => {
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
  const totals = useMemo(() => computeTotals(gridData), [gridData])

  const bmcGroups = useMemo(() => {
    const map = new Map<string, BMCAckRegDairyGridRow[]>()

    gridData.forEach((row) => {
      if (!map.has(row.bmc)) {
        map.set(row.bmc, [])
      }

      map.get(row.bmc)!.push(row)
    })

    return Array.from(map.entries()).map(([bmc, rows]) => ({
      bmc,
      rows,
      totals: computeTotals(rows),
    }))
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

  const reportTitle = `Ack.Register2(Abstract)${
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
          title="10.Ack.Register2(Abstract)"
          subtitle={`BMC-ACKNOWLEDGEMENT REGISTER FOR THE PERIOD ${formatPdfHeaderDate(selectedFromDate) || '-'}  --  ${formatPdfHeaderDate(selectedToDate) || '-'}`}
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
          {/*   {new Date().toLocaleString('en-IN', {
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
         style={{position: 'absolute',bottom: '10px',width: 'auto',textAlign: 'right',fontSize: '12px',paddingRight: '20px',boxSizing: 'border-box',
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
       10.Ack.Register2(Abstract)
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
              className="bmcAckRegDairyBmc"
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

      <Grid
            data={pagedResult}
            {...dataState}
            onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
            sortable
            pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
            className="bmcAckRegDairyGrid"
            style={{
              width: '100%',
            }}
          >
            <GridColumn field="date" title="Date" width="120px"  headerClassName="text-center fw-bold"/>
            <GridColumn field="bmc" title="Bmc" width="250px"  headerClassName="text-center fw-bold"/>
            <GridColumn field="advNo" title="Adv No" width="100px" headerClassName="text-center fw-bold"
              cells={{
                footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
              }}
            />

            <GridColumn
              field="invLitre"
              title="Inv Litre"
              width="130px"
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

            <GridColumn
              field="totalAckLitre"
              title="Total Ack Litre"
              width="150px"
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

            <GridColumn
              field="diffLitre"
              title="Diff Litre"
              width="130px"
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

      {/* Excel export — explicit columns matching the export row shape */}
      <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`AckRegister2Abstract_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="date" title="Date" width={120} />
        <ExcelExportColumn field="bmc" title="Bmc" width={200} />
        <ExcelExportColumn field="advNo" title="Adv No" width={100} />
        <ExcelExportColumn title="Front">
          <ExcelExportColumn field="fLitre" title="Litre" width={90} />
          <ExcelExportColumn field="fLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="fLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>
        <ExcelExportColumn title="Middle">
          <ExcelExportColumn field="mLitre" title="Litre" width={90} />
          <ExcelExportColumn field="mLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="mLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>
        <ExcelExportColumn title="Rear">
          <ExcelExportColumn field="rLitre" title="Litre" width={90} />
          <ExcelExportColumn field="rLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="rLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn field="invLitre" title="Inv Litre" width={100} />

        <ExcelExportColumn title="Ack Front">
          <ExcelExportColumn field="afLitre" title="Litre" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Ack Middle">
          <ExcelExportColumn field="amLitre" title="Litre" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Ack Rear">
          <ExcelExportColumn field="arLitre" title="Litre" width={90} />
        </ExcelExportColumn>
        <ExcelExportColumn field="totalAckLitre" title="Total Ack Litre" width={130} />
        <ExcelExportColumn field="diffLitre" title="Diff Litre" width={110} />
      </ExcelExport>


      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A4"
            landscape={false}
            margin={{ ...PDF_HEADER_MARGIN, top: '3cm' }}
            scale={0.80}
            keepTogether=".pdf-keep-together"
            pageTemplate={PageTemplate}
            fileName={`AckRegister2Abstract_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
          >
            {isPdf && (
              <>
                {bmcGroups.map((group) => (
                  <div key={group.bmc} className="pdf-keep-together" style={{ marginBottom: '15px', width: '630px', margin: '0 auto 15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '5px', textAlign: 'center' }}>
                      BmcName: {group.bmc}
                    </div>

                    <Grid data={group.rows} groupable={false} sortable={false} scrollable="none">
                      <GridColumn field="date" title="Date" width="120px"  headerClassName="text-center fw-bold"/>

                      <GridColumn
                        field="advNo"
                        title="Adv No"
                        width="100px"
                         headerClassName="text-center fw-bold"
                        cells={{
                          footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
                        }}
                      />

                      <GridColumn
                        field="invLitre"
                        title="Inv Litre"
                        width="130px"
                         headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {group.totals.invLitre.toFixed(1)}
                            </td>
                          ),
                        }}
                      />

                      <GridColumn
                        field="totalAckLitre"
                        title="Total Ack Litre"
                        width="150px"
                         headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {group.totals.totalAckLitre.toFixed(1)}
                            </td>
                          ),
                        }}
                      />

                      <GridColumn
                        field="diffLitre"
                        title="Diff Litre"
                        width="130px"
                         headerClassName="text-center fw-bold"
                        format="{0:n1}"
                        cells={{
                          footerCell: () => (
                            <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                              {group.totals.diffLitre.toFixed(1)}
                            </td>
                          ),
                        }}
                      />
                    </Grid>
                  </div>
                ))}
              </>
            )}
          </PDFExport>
        </div>
      )}
    </div>
  )
}
