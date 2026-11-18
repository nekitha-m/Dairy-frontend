/*  5. BMCWiseAckReg(Daily Abstract) */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { PDFExport } from '@progress/kendo-react-pdf'
import { PdfPageHeader, PDF_HEADER_MARGIN } from '../../components/common/PdfPageHeader'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import { useGetDailyAckList } from '../../apiclient/report/use-get-daily-ack-list'
import { useGetBmcs } from '../../apiclient/master/use-get-bmcs'
import type { DailyAckList } from '../../models/Report/DailyAckList'
import type Bmc from '../../models/masters/Bmc'

interface DailyAckGridRow {
  advNo: string
  bmc: string
  fLitre: number
  fFat: number
  fSnf: number
  fLitFat: number
  fLitSnf: number
  mLitre: number
  mFat: number
  mSnf: number
  mLitFat: number
  mLitSnf: number
  rLitre: number
  rFat: number
  rSnf: number
  rLitFat: number
  rLitSnf: number
}

const ALL_BMC: Bmc = {
  bmcId: 0,
  name: 'All',
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

const calculateRow = (item: DailyAckList): DailyAckGridRow => {
  return {
    advNo: item.advNo ?? '',
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    fLitre: Number(Number(item.afLitre ?? 0).toFixed(1)),
    fFat: Number(Number(item.afFat ?? 0).toFixed(1)),
    fSnf: Number(Number(item.afSnf ?? 0).toFixed(1)),
    fLitFat: Number(Number(item.afLitFat ?? 0).toFixed(3)),
    fLitSnf: Number(Number(item.afLitSnf ?? 0).toFixed(3)),
    mLitre: Number(Number(item.amLitre ?? 0).toFixed(1)),
    mFat: Number(Number(item.amFat ?? 0).toFixed(1)),
    mSnf: Number(Number(item.amSnf ?? 0).toFixed(1)),
    mLitFat: Number(Number(item.amLitFat ?? 0).toFixed(3)),
    mLitSnf: Number(Number(item.amLitSnf ?? 0).toFixed(3)),
    rLitre: Number(Number(item.arLitre ?? 0).toFixed(1)),
    rFat: Number(Number(item.arFat ?? 0).toFixed(1)),
    rSnf: Number(Number(item.arSnf ?? 0).toFixed(1)),
    rLitFat: Number(Number(item.arLitFat ?? 0).toFixed(3)),
    rLitSnf: Number(Number(item.arLitSnf ?? 0).toFixed(3)),
  }
}
export function DailyAckListPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [selectedBmc, setSelectedBmc] = useState<Bmc>(ALL_BMC)
  const [committedFilters, setCommittedFilters] = useState<{
    date: string
    bmcId: number
    bmcName: string
  } | null>(null)

  const pdfExportRef = useRef<PDFExport>(null)
  const excelExportRef = useRef<ExcelExport>(null)
  const [showNoDataDialog, setShowNoDataDialog] = useState(false)
  const { data: bmcList = [] } = useGetBmcs()
  const bmcs = useMemo(() => [ALL_BMC, ...bmcList], [bmcList])
  const {
    data: result = [],
    isLoading,
    error,
  } = useGetDailyAckList({
    variables: committedFilters
      ? { date: committedFilters.date, bmcName: committedFilters.bmcId ? committedFilters.bmcName : '0' }
      : { date: '', bmcName: '0' },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<DailyAckGridRow[]>(() => {
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
        total.fLitre += row.fLitre
        total.fFat += row.fFat
        total.fSnf += row.fSnf
        total.fLitFat += row.fLitFat
        total.fLitSnf += row.fLitSnf
        total.mLitre += row.mLitre
        total.mFat += row.mFat
        total.mSnf += row.mSnf
        total.mLitFat += row.mLitFat
        total.mLitSnf += row.mLitSnf
        total.rLitre += row.rLitre
        total.rFat += row.rFat
        total.rSnf += row.rSnf
        total.rLitFat += row.rLitFat
        total.rLitSnf += row.rLitSnf

        return total
      },
      {
        fLitre: 0,
        fFat: 0,
        fSnf: 0,
        fLitFat: 0,
        fLitSnf: 0,
        mLitre: 0,
        mFat: 0,
        mSnf: 0,
        mLitFat: 0,
        mLitSnf: 0,
        rLitre: 0,
        rFat: 0,
        rSnf: 0,
        rLitFat: 0,
        rLitSnf: 0,
      }
    )
  }, [gridData])

  const handleGenerate = () => {
    if (!selectedDate) {
      window.alert('Please Select Date')
      return
    }

    setCommittedFilters({
      date: formatDate(selectedDate),
      bmcId: selectedBmc?.bmcId ?? 0,
      bmcName: selectedBmc?.name ?? 'All',
    })
  }

  const [isPdf, setIsPdf] = useState(false)
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

  const formatDisplayDate = (date: Date | null): string =>
    date
      ? date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'numeric',
          year: 'numeric',
        })
      : ''

  const reportTitle = `BMCWiseAckReg(Daily Abstract)${
    committedFilters ? ` - ${formatDisplayDate(selectedDate)}` : ''
  }`

  const PageTemplate = (props: { pageNum: number; totalPages: number }) => (
    <>
    <PdfPageHeader
      title="5. BMCWiseAckReg(Daily Abstract)"
      subtitle={`BMC ACKNOWLEDGEMENT REGISTER FOR THE PERIOD ${committedFilters?.date ?? '-'}`}
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
        5. BMCWiseAckReg(Daily Abstract)
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
          {/* Date */}
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
        onDataStateChange={(event: GridDataStateChangeEvent) => setDataState(event.dataState)}
        sortable
        pageable={{ buttonCount: 5, pageSizes: [10, 20, 50], info: true }}
        className="dailyAckGrid"
        style={{
          width: '100%',
        }}
      >
            <GridColumn field="advNo" title="Adv No" width="100px" 
 headerClassName="text-center fw-bold" />

            <GridColumn
              field="bmc"
              title="Bmc"
              width="250px"
              
 headerClassName="text-center fw-bold"
              cells={{
                footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
              }}
            />

            <GridColumn title="Front" 
 headerClassName="text-center fw-bold">
              <GridColumn
                field="fLitre"
                title="Litre"
                width="90px"
                
 headerClassName="text-center fw-bold"
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
                
 headerClassName="text-center fw-bold"
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
                
 headerClassName="text-center fw-bold"
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
                
 headerClassName="text-center fw-bold"
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
                
 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.fLitSnf.toFixed(3)}
                    </td>
                  ),
                }}
              />
            </GridColumn>

            <GridColumn title="Middle" 
 headerClassName="text-center fw-bold">
              <GridColumn
                field="mLitre"
                title="Litre"
                width="90px"
                
 headerClassName="text-center fw-bold"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.mLitre.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="mFat"
                title="Fat"
                width="80px"
                
 headerClassName="text-center fw-bold"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.mFat.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="mSnf"
                title="Snf"
                width="80px"
                
 headerClassName="text-center fw-bold"
                format="{0:n1}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.mSnf.toFixed(1)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="mLitFat"
                title="LitFat"
                width="90px"
                
 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.mLitFat.toFixed(3)}
                    </td>
                  ),
                }}
              />
              <GridColumn
                field="mLitSnf"
                title="LitSnf"
                width="90px"  
 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.mLitSnf.toFixed(3)}
                    </td>
                  ),
                }}
              />
            </GridColumn>

            <GridColumn title="Rear" 
 headerClassName="text-center fw-bold">
              <GridColumn
                field="rLitre"
                title="Litre"
                width="90px"
                
 headerClassName="text-center fw-bold"
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
                
 headerClassName="text-center fw-bold"
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
                
 headerClassName="text-center fw-bold"
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
                
 headerClassName="text-center fw-bold"
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
                
 headerClassName="text-center fw-bold"
                format="{0:n3}"
                cells={{
                  footerCell: () => (
                    <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                      {totals.rLitSnf.toFixed(3)}
                    </td>
                  ),
                }}
              />
            </GridColumn>
      </Grid>

      {gridData.length > 0 && (
        <div style={{ position: 'absolute', left: '-10000px', top: 0 }}>
          <PDFExport
            ref={pdfExportRef}
            paperSize="A3"
            landscape={false}
            margin={PDF_HEADER_MARGIN}
            scale={0.5}
            keepTogether="tr"
            pageTemplate={PageTemplate}
            fileName={`BMCWiseAckRegDailyAbstract_${committedFilters?.date ?? ''}.pdf`}
          >
            {isPdf && (
              <>
                <div style={{ width: '1640px' }}>
                  {/* Group header band — one cell per group, widths match the grid columns below */}
                  <div style={{ display: 'flex', width: '1640px', boxSizing: 'border-box', fontWeight: 'bold', textAlign: 'center', border: '1px solid #dee2e6', borderBottom: 'none', background: '#f8f9fa' }}>
                    <div style={{ width: '350px', flexShrink: 0, padding: '6px 0' }}>&nbsp;</div>
                    <div style={{ width: '430px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Front</div>
                    <div style={{ width: '430px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Middle</div>
                    <div style={{ width: '430px', flexShrink: 0, padding: '6px 0', borderLeft: '1px solid #dee2e6' }}>Rear</div>
                  </div>
                <Grid
                  data={gridData}
                  groupable={false}
                  sortable={false}
                  scrollable="none"
                  className="dailyAckGrid"
                  style={{ width: '1640px' }}
                >
                  <GridColumn field="advNo" title="Adv No" width="100px" headerClassName="text-center fw-bold" />
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
                    field="fLitre"
                    title="Litre"
                    width="90px"
                    headerClassName="text-center fw-bold"
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
                    headerClassName="text-center fw-bold"
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
                    headerClassName="text-center fw-bold"
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
                    headerClassName="text-center fw-bold"
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
                    headerClassName="text-center fw-bold"
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
                    field="mLitre"
                    title="Litre"
                    width="90px"
                    headerClassName="text-center fw-bold"
                    format="{0:n1}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.mLitre.toFixed(1)}
                        </td>
                      ),
                    }}
                  />
                  <GridColumn
                    field="mFat"
                    title="Fat"
                    width="80px"
                    headerClassName="text-center fw-bold"
                    format="{0:n1}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.mFat.toFixed(1)}
                        </td>
                      ),
                    }}
                  />
                  <GridColumn
                    field="mSnf"
                    title="Snf"
                    width="80px"
                    headerClassName="text-center fw-bold"
                    format="{0:n1}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.mSnf.toFixed(1)}
                        </td>
                      ),
                    }}
                  />
                  <GridColumn
                    field="mLitFat"
                    title="LitFat"
                    width="90px"
                    headerClassName="text-center fw-bold"
                    format="{0:n3}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.mLitFat.toFixed(3)}
                        </td>
                      ),
                    }}
                  />
                  <GridColumn
                    field="mLitSnf"
                    title="LitSnf"
                    width="90px"
                    headerClassName="text-center fw-bold"
                    format="{0:n3}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.mLitSnf.toFixed(3)}
                        </td>
                      ),
                    }}
                  />
                  <GridColumn
                    field="rLitre"
                    title="Litre"
                    width="90px"
                    headerClassName="text-center fw-bold"
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
                    headerClassName="text-center fw-bold"
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
                    headerClassName="text-center fw-bold"
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
                    headerClassName="text-center fw-bold"
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
                    headerClassName="text-center fw-bold"
                    format="{0:n3}"
                    cells={{
                      footerCell: () => (
                        <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                          {totals.rLitSnf.toFixed(3)}
                        </td>
                      ),
                    }}
                  />
                </Grid>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '300px',
                    marginTop: '4px',
                    fontWeight: 'bold',
                    fontSize: '20px',
                  }}
                >
                  <div>Net :</div>
                  <div>
                    {`Total Litres: ${(totals.fLitre + totals.mLitre + totals.rLitre).toFixed(1)}`}
                  </div>
                  <div>
                    {`Total Lt.Fat: ${(totals.fLitFat + totals.mLitFat + totals.rLitFat).toFixed(3)}`}
                  </div>
                  <div>
                    {`Total Lt.Snf: ${(totals.fLitSnf + totals.mLitSnf + totals.rLitSnf).toFixed(3)}`}
                  </div>
                </div>
              </>
            )}
          </PDFExport>
        </div>
      )}

      {/* Excel export — explicit columns matching the export row shape */}
      <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`AckRegisterDailyAbstract_${committedFilters?.date ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="advNo" title="Adv No" width={100} />
        <ExcelExportColumn field="bmc" title="Bmc" width={180} />

        <ExcelExportColumn title="Front">
          <ExcelExportColumn field="fLitre" title="Litre" width={90} />
          <ExcelExportColumn field="fFat" title="Fat" width={80} />
          <ExcelExportColumn field="fSnf" title="Snf" width={80} />
          <ExcelExportColumn field="fLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="fLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Middle">
          <ExcelExportColumn field="mLitre" title="Litre" width={90} />
          <ExcelExportColumn field="mFat" title="Fat" width={80} />
          <ExcelExportColumn field="mSnf" title="Snf" width={80} />
          <ExcelExportColumn field="mLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="mLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>

        <ExcelExportColumn title="Rear">
          <ExcelExportColumn field="rLitre" title="Litre" width={90} />
          <ExcelExportColumn field="rFat" title="Fat" width={80} />
          <ExcelExportColumn field="rSnf" title="Snf" width={80} />
          <ExcelExportColumn field="rLitFat" title="LitFat" width={90} />
          <ExcelExportColumn field="rLitSnf" title="LitSnf" width={90} />
        </ExcelExportColumn>
      </ExcelExport>
    </div>
  )
}
