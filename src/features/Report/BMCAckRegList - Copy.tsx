/* 2. Ack.Register1(Dairy) */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import { DatePicker } from '@progress/kendo-react-dateinputs'
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetBmcWiseAckregDiff } from '../../apiclient/report/use-get-bmc-wise-ackreg-diff'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type { BMCAckRegDiff } from '../../models/Report/BMCAckRegDiff'
import type Bmc from '../../models/masters/Bmc'

interface BMCAckRegListGridRow {
  date: string
  bmc: string
  advNo: string
  fLitre: number
  fFat: number
  fSnf: number
  fLitFat: number
  fLitSnf: number
  fMbrt: number
  rLitre: number
  rFat: number
  rSnf: number
  rLitFat: number
  rLitSnf: number
  rMbrt: number
}

interface BMCAckRegListExportRow {
  date: string
  bmc: string
  advNo: string
  fLitre: number
  fFat: number
  fSnf: number
  fMbrt: number
  rLitre: number
  rFat: number
  rSnf: number
  rMbrt: number
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
const calculateRow = (item: BMCAckRegDiff): BMCAckRegListGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    advNo: item.advNo ?? '',
    fLitre: Number(Number(item.afLitre ?? 0).toFixed(1)),
    fFat: Number(Number(item.afFat ?? 0).toFixed(1)),
    fSnf: Number(Number(item.afSnf ?? 0).toFixed(1)),
    fLitFat: Number(Number(item.afLitFat ?? 0).toFixed(3)),
    fLitSnf: Number(Number(item.afLitSnf ?? 0).toFixed(3)),
    fMbrt: Number(Number(item.fMbrt ?? 0).toFixed(2)),
    rLitre: Number(Number(item.arLitre ?? 0).toFixed(1)),
    rFat: Number(Number(item.arFat ?? 0).toFixed(1)),
    rSnf: Number(Number(item.arSnf ?? 0).toFixed(1)),
    rLitFat: Number(Number(item.arLitFat ?? 0).toFixed(3)),
    rLitSnf: Number(Number(item.arLitSnf ?? 0).toFixed(3)),
    rMbrt: Number(Number(item.rMbrt ?? 0).toFixed(2)),
  }
}
const calculateExportRow = (item: BMCAckRegDiff): BMCAckRegListExportRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

  return {
    date,
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    advNo: item.advNo ?? '',
    fLitre: Number(item.afLitre ?? 0),
    fFat: Number(item.afFat ?? 0),
    fSnf: Number(item.afSnf ?? 0),
    fMbrt: Number(item.fMbrt ?? 0),
    rLitre: Number(item.arLitre ?? 0),
    rFat: Number(item.arFat ?? 0),
    rSnf: Number(item.arSnf ?? 0),
    rMbrt: Number(item.rMbrt ?? 0),
  }
}
export function BMCAckRegListCopyPage() {
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
  } = useGetBmcWiseAckregDiff({
    variables: committedFilters ?? { fromDate: '', toDate: '', bmcId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<BMCAckRegListGridRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }
    return result.map((item) => calculateRow(item))
  }, 
  [result])

  const exportData = useMemo<BMCAckRegListExportRow[]>(() => {
    if (!result || result.length === 0) {
      return []
    }

    return result.map((item) => calculateExportRow(item))
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
        total.fLitre += row.fLitre
        total.fFat += row.fFat
        total.fSnf += row.fSnf
        total.fLitFat += row.fLitFat
        total.fLitSnf += row.fLitSnf
        total.fMbrt += row.fMbrt
        total.rLitre += row.rLitre
        total.rFat += row.rFat
        total.rSnf += row.rSnf
        total.rLitFat += row.rLitFat
        total.rLitSnf += row.rLitSnf
        total.rMbrt += row.rMbrt

        return total
      },
      {
        fLitre: 0,
        fFat: 0,
        fSnf: 0,
        fLitFat: 0,
        fLitSnf: 0,
        fMbrt: 0,
        rLitre: 0,
        rFat: 0,
        rSnf: 0,
        rLitFat: 0,
        rLitSnf: 0,
        rMbrt: 0,
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
      const previousDataState = dataState
      setIsPdf(true)
      setDataState((prev) => ({ ...prev, skip: 0, take: gridData.length || prev.take }))

      setTimeout(() => {
        pdfExportRef.current?.save()
        setIsPdf(false)
        setDataState(previousDataState)
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
                value: '2. Ack.Register1(Dairy)',
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
                value: `From: ${committedFilters?.fromDate ?? '-'}    To: ${committedFilters?.toDate ?? '-'}    BMC: ${selectedBmc?.name ?? '-'}`,
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

  return (
    <div style={{ padding: '20px' }}>
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '25px',
        }}
      >
        2. Ack.Register1(Dairy)
      </h3>

      {/* Filter section */}
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
              format="dd-MM-yyyy"
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
              format="dd-MM-yyyy"
              onChange={(event) => setSelectedToDate(event.value)}
              style={{
                width: '100%',
              }}
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

      {/* PDF export wrapper */}
      <PDFExport
        ref={pdfExportRef}
        paperSize="a3"
        landscape={false}
        margin="0.5cm"
        scale={0.75}
        keepTogether="tr"
        fileName={`AckRegister1Dairy_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.pdf`}
      >
          {isPdf && (
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                2. Ack.Register1(Dairy)
              </div>
              <div style={{ fontSize: '0.95rem', marginTop: '4px' }}>
                From: {committedFilters?.fromDate ?? '-'} &nbsp;|&nbsp; To: {committedFilters?.toDate ?? '-'} &nbsp;|&nbsp; BMC: {selectedBmc?.name ?? '-'}
              </div>
            </div>
          )}
          <Grid
            data={pagedResult}
            {...dataState}
            onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
            sortable
            pageable={{ buttonCount: 5, pageSizes: [10, 25, 50, 100], info: true }}
            className="bmcAckRegListCopyGrid"
            style={{
              width: '100%',
            }}
          >
            <GridColumn field="date" title="Date" width="100px" />

            <GridColumn field="bmc" title="Bmc" width="250px" />

            <GridColumn
              field="advNo"
              title="Adv No"
              width="100px"
              cells={{
                footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
              }}
            />

            <GridColumn title="Front">
              <GridColumn
                field="fLitre"
                title="Litre"
                width="90px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.fLitre.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="fFat"
                title="Fat"
                width="80px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.fFat.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="fSnf"
                title="Snf"
                width="80px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.fSnf.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="fLitFat"
                title="LitFat"
                width="90px"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.fLitFat.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="fLitSnf"
                title="LitSnf"
                width="90px"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.fLitSnf.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="fMbrt"
                title="MBRT"
                width="80px"
                format="{0:n2}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.fMbrt.toFixed(2)}
                    </td>
                  ),
                }}
              />
            </GridColumn>

            <GridColumn title="Rear">
              <GridColumn
                field="rLitre"
                title="Litre"
                width="90px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.rLitre.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="rFat"
                title="Fat"
                width="80px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.rFat.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="rSnf"
                title="Snf"
                width="80px"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.rSnf.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="rLitFat"
                title="LitFat"
                width="90px"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.rLitFat.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="rLitSnf"
                title="LitSnf"
                width="90px"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.rLitSnf.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="rMbrt"
                title="MBRT"
                width="80px"
                format="{0:n2}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.rMbrt.toFixed(2)}
                    </td>
                  ),
                }}
              />
            </GridColumn>
          </Grid>
      </PDFExport>

      {/* Excel export — uses calculateExportRow's narrower field
          set (no LitFat/LitSnf), matching the legacy ExportData() exactly */}
      <ExcelExport
        ref={excelExportRef}
        data={exportData}
        fileName={`AckRegister1-${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="date" title="Date" width={100} />
        <ExcelExportColumn field="bmc" title="Bmc" width={180} />
        <ExcelExportColumn field="advNo" title="Adv No" width={100} />

        <ExcelExportColumn title="Front">
          <ExcelExportColumn field="fLitre" title="Litre" width={90} />
          <ExcelExportColumn field="fFat" title="Fat" width={80} />
          <ExcelExportColumn field="fSnf" title="Snf" width={80} />
          <ExcelExportColumn field="fMbrt" title="MBRT" width={80} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Rear">
          <ExcelExportColumn field="rLitre" title="Litre" width={90} />
          <ExcelExportColumn field="rFat" title="Fat" width={80} />
          <ExcelExportColumn field="rSnf" title="Snf" width={80} />
          <ExcelExportColumn field="rMbrt" title="MBRT" width={80} />
        </ExcelExportColumn>
      </ExcelExport>
    </div>
  )
}
