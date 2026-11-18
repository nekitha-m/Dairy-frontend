/*  6. Invoice-Acknowledgement Abstract */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Grid, GridColumn, GridDataStateChangeEvent } from '@progress/kendo-react-grid'
import { process, State } from '@progress/kendo-data-query'
import { ExcelExport, ExcelExportColumn } from '@progress/kendo-react-excel-export'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DropDownList } from '@progress/kendo-react-dropdowns'
import { useGetInvoiceandAckList } from '../../apiclient/report/use-get-invoiceand-ack-list'
import { useGetDestinations } from '../../apiclient/master/use-get-destinations'
import type { InvoiceAndAckList } from '../../models/Report/InvoiceAndAckList'
import type Destination from '../../models/masters/Destination'
import { safePercent } from '../../utils/safePercent'

interface InvoiceAndAckGridRow {
  serialNo: number
  date: string
  despatchNoteNo: string
  bmc: string
  tankerNo: number | string
  invQtyLtr: number
  invQtyKg: number
  invFatP: number
  invSnfP: number
  dGravity: number
  invFatKg: number
  invSnfKg: number
  invTs: number
  actQtyLtr: number
  actQtyKg: number
  actFatP: number
  actSnfP: number
  aGravity: number
  actFatKg: number
  actSnfKg: number
  actTs: number
  diffLtr: number
  destination: string
  fMbrt: number
  mMbrt: number
  rMbrt: number
}

const ALL_DESTINATION: Destination = {
  destinationId: 0,
  name: '-ALL-',
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

const DESPATCH_SPECIFIC_GRAVITY = 1.0275

const calculateRow = (
  item: InvoiceAndAckList,
  serialNo: number
): InvoiceAndAckGridRow => {
  const despatchDate = item.despatchDate ? new Date(item.despatchDate) : null
  const date = despatchDate
    ? `${despatchDate.getDate()}-${despatchDate.getMonth() + 1}-${despatchDate.getFullYear()}`
    : ''

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
  const aGravity = Number(item.gravity ?? 0)
  const invQtyLtr = Math.round(fLitre + rLitre + mLitre)
  const invQtyKg = Math.round(invQtyLtr * DESPATCH_SPECIFIC_GRAVITY)
  const invLitFat = fLitFat + rLitFat + mLitFat
  const invFatP = safePercent(invLitFat, invQtyLtr)
  const invLitSnf = fLitSnf + rLitSnf + mLitSnf
  const invSnfP = safePercent(invLitSnf, invQtyLtr)
  const invFatKg = (invQtyKg * invFatP) / 100
  const invSnfKg = (invQtyKg * invSnfP) / 100
  const invTs = invFatKg + invSnfKg
  const actQtyLtr = Math.round(afLitre + arLitre + amLitre)
  const actQtyKg = Math.round(actQtyLtr * aGravity)
  const actLitFat = afLitFat + arLitFat + amLitFat
  const actFatP = safePercent(actLitFat, actQtyLtr)
  const actLitSnf = afLitSnf + arLitSnf + amLitSnf
  const actSnfP = safePercent(actLitSnf, actQtyLtr)
  const actFatKg = (actQtyKg * actFatP) / 100
  const actSnfKg = (actQtyKg * actSnfP) / 100
  const actTs = actFatKg + actSnfKg

  const diffLtr = actQtyLtr - invQtyLtr

  return {
    serialNo,
    date,
    despatchNoteNo: item.invoiceNumber ?? '',
    bmc: `${item.bmcCode ?? ''}-${item.bmcName ?? ''}`,
    tankerNo: item.tankerId ?? '',
    invQtyLtr,
    invQtyKg,
    invFatP: Number(invFatP.toFixed(1)),
    invSnfP: Number(invSnfP.toFixed(1)),
    dGravity: Number(DESPATCH_SPECIFIC_GRAVITY.toFixed(4)),
    invFatKg: Number(invFatKg.toFixed(3)),
    invSnfKg: Number(invSnfKg.toFixed(3)),
    invTs: Number(invTs.toFixed(3)),
    actQtyLtr,
    actQtyKg,
    actFatP: Number(actFatP.toFixed(1)),
    actSnfP: Number(actSnfP.toFixed(1)),
    aGravity: Number(aGravity.toFixed(4)),
    actFatKg: Number(actFatKg.toFixed(2)),
    actSnfKg: Number(actSnfKg.toFixed(2)),
    actTs: Number(actTs.toFixed(2)),
    diffLtr: Number(diffLtr.toFixed(1)),
    destination: item.destinationName ?? '',
    fMbrt: Number(item.fMbrt ?? 0),
    mMbrt: Number(item.mMbrt ?? 0),
    rMbrt: Number(item.rMbrt ?? 0),
  }
}
export function InvoiceAndAckListPage() {
  const [selectedFromDate, setSelectedFromDate] = useState<Date | null>(
    new Date()
  )
  const [selectedToDate, setSelectedToDate] = useState<Date | null>(
    new Date()
  )

  const [selectedDestination, setSelectedDestination] =
    useState<Destination>(ALL_DESTINATION)

  
  const [committedFilters, setCommittedFilters] = useState<{
    fromDate: string
    toDate: string
    destinationId: number
  } | null>(null)

  const excelExportRef = useRef<ExcelExport>(null)
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
  } = useGetInvoiceandAckList({
    variables: committedFilters ?? { fromDate: '', toDate: '', destinationId: 0 },
    enabled: committedFilters !== null,
  })

  const gridData = useMemo<InvoiceAndAckGridRow[]>(() => {
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
        total.invQtyLtr += row.invQtyLtr
        total.invQtyKg += row.invQtyKg
        total.invFatP += row.invFatP
        total.invSnfP += row.invSnfP
        total.dGravity += row.dGravity
        total.invFatKg += row.invFatKg
        total.invSnfKg += row.invSnfKg
        total.invTs += row.invTs
        total.actQtyLtr += row.actQtyLtr
        total.actQtyKg += row.actQtyKg
        total.actFatP += row.actFatP
        total.actSnfP += row.actSnfP
        total.aGravity += row.aGravity
        total.actFatKg += row.actFatKg
        total.actSnfKg += row.actSnfKg
        total.actTs += row.actTs
        total.diffLtr += row.diffLtr

        return total
      },
      {
        invQtyLtr: 0,
        invQtyKg: 0,
        invFatP: 0,
        invSnfP: 0,
        dGravity: 0,
        invFatKg: 0,
        invSnfKg: 0,
        invTs: 0,
        actQtyLtr: 0,
        actQtyKg: 0,
        actFatP: 0,
        actSnfP: 0,
        aGravity: 0,
        actFatKg: 0,
        actSnfKg: 0,
        actTs: 0,
        diffLtr: 0,
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

  return (
    <div style={{ padding: '20px' }}>
      <h3
        style={{
          textAlign: 'center',
          marginBottom: '25px',
        }}
      >
        6. Invoice-Acknowledgement Abstract
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

          {/* Destination */}
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
          className="invoiceAndAckGrid"
          style={{
            width: '100%',
          }}
        >
          <GridColumn field="serialNo" title="S.No" width="70px"  headerClassName="text-center fw-bold" />
          <GridColumn field="date" title="Date" width="100px"  headerClassName="text-center fw-bold"/>

          <GridColumn
            field="despatchNoteNo"
            title="Despatch Note No"
            width="150px"
             headerClassName="text-center fw-bold"
          />

          <GridColumn field="bmc" title="BmcName" width="250px"  headerClassName="text-center fw-bold"/>

          <GridColumn
            field="tankerNo"
            title="Tanker No"
            width="200px"
             headerClassName="text-center fw-bold"
            cells={{
              footerCell: () => <td style={{ fontWeight: 'bold' }}>Total</td>,
            }}
          />

          <GridColumn title="InvoiceDetails"  headerClassName="text-center fw-bold">
            <GridColumn
              field="invQtyLtr"
              title="Invoice Qty in Ltr"
              width="180px"
               headerClassName="text-center fw-bold"
              format="{0:n0}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.invQtyLtr.toFixed(0)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="invQtyKg"
              title="Invoice Qty in Kgs"
              width="180px"
               headerClassName="text-center fw-bold"
              format="{0:n0}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.invQtyKg.toFixed(0)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="invFatP"
              title="Fat %"
              width="80px"
               headerClassName="text-center fw-bold"
              format="{0:n1}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.invFatP.toFixed(1)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="invSnfP"
              title="Snf %"
              width="80px"
               headerClassName="text-center fw-bold"
              format="{0:n1}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.invSnfP.toFixed(1)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="dGravity"
              title="Sp.Gravity"
              width="110px"
               headerClassName="text-center fw-bold"
              format="{0:n4}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.dGravity.toFixed(4)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="invFatKg"
              title="Fat(KG)"
              width="90px"
               headerClassName="text-center fw-bold"
              format="{0:n3}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.invFatKg.toFixed(3)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="invSnfKg"
              title="Snf(KG)"
              width="90px"
               headerClassName="text-center fw-bold"
              format="{0:n3}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.invSnfKg.toFixed(3)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="invTs"
              title="Ts"
              width="90px"
               headerClassName="text-center fw-bold"
              format="{0:n3}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.invTs.toFixed(3)}
                  </td>
                ),
              }}
            />
          </GridColumn>

          <GridColumn title="Acknowledgement"  headerClassName="text-center fw-bold">
            <GridColumn
              field="actQtyLtr"
              title="Actual Qty in Lit"
              width="150px"
               headerClassName="text-center fw-bold"
              format="{0:n0}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.actQtyLtr.toFixed(0)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="actQtyKg"
              title="Actual Qty in Kgs"
              width="180px"
              headerClassName="text-center fw-bold"
              format="{0:n0}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.actQtyKg.toFixed(0)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="actFatP"
              title="Fat"
              width="80px"
              headerClassName="text-center fw-bold"
              format="{0:n1}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.actFatP.toFixed(1)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="actSnfP"
              title="Snf"
              width="80px"
              headerClassName="text-center fw-bold"
              format="{0:n1}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.actSnfP.toFixed(1)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="aGravity"
              title="Sp.Gravity"
              width="120px"
              headerClassName="text-center fw-bold"
              format="{0:n4}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.aGravity.toFixed(4)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="actFatKg"
              title="Fat(KG)"
              width="90px"
              headerClassName="text-center fw-bold"
              format="{0:n2}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.actFatKg.toFixed(2)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="actSnfKg"
              title="Snf(KG)"
              width="90px"
              headerClassName="text-center fw-bold"
              format="{0:n2}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.actSnfKg.toFixed(2)}
                  </td>
                ),
              }}
            />
            <GridColumn
              field="actTs"
              title="Ts"
              width="90px"
              headerClassName="text-center fw-bold"
              format="{0:n2}"
              cells={{
                footerCell: () => (
                  <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {totals.actTs.toFixed(2)}
                  </td>
                ),
              }}
            />
          </GridColumn>

          <GridColumn
            field="diffLtr"
            title="Variation in LTR"
            width="180px"
            headerClassName="text-center fw-bold"
            format="{0:n1}"
            cells={{
              footerCell: () => (
                <td style={{ fontWeight: 'bold', textAlign: 'right' }}>
                  {totals.diffLtr.toFixed(1)}
                </td>
              ),
            }}
          />

          <GridColumn field="destination" title="Destination" width="120px"  headerClassName="text-center fw-bold" />
          <GridColumn field="fMbrt" title="FMbrt" width="80px"  headerClassName="text-center fw-bold"/>
          <GridColumn field="mMbrt" title="MMbrt" width="80px"  headerClassName="text-center fw-bold"/>
          <GridColumn field="rMbrt" title="RMbrt" width="80px"  headerClassName="text-center fw-bold"/>
        </Grid>

      {/* Excel export — explicit columns matching the export row shape */}
      <ExcelExport
        ref={excelExportRef}
        data={gridData}
        fileName={`TirupurDairyMilk_${committedFilters?.fromDate ?? ''}_${committedFilters?.toDate ?? ''}.xlsx`}
      >
        <ExcelExportColumn field="serialNo" title="S.No" width={70} />
        <ExcelExportColumn field="date" title="Date" width={100} />
        <ExcelExportColumn field="despatchNoteNo" title="Despatch Note No" width={130} />
        <ExcelExportColumn field="bmc" title="BmcName" width={160} />
        <ExcelExportColumn field="tankerNo" title="Tanker No" width={100} />
        <ExcelExportColumn title="InvoiceDetails">
          <ExcelExportColumn field="invQtyLtr" title="Invoice Qty in Ltr" width={110} />
          <ExcelExportColumn field="invQtyKg" title="Invoice Qty in Kgs" width={110} />
          <ExcelExportColumn field="invFatP" title="Fat %" width={80} />
          <ExcelExportColumn field="invSnfP" title="Snf %" width={80} />
          <ExcelExportColumn field="dGravity" title="Sp.Gravity" width={90} />
          <ExcelExportColumn field="invFatKg" title="Fat(KG)" width={90} />
          <ExcelExportColumn field="invSnfKg" title="Snf(KG)" width={90} />
          <ExcelExportColumn field="invTs" title="Ts" width={90} />
        </ExcelExportColumn>
        <ExcelExportColumn title="Acknowledgement">
          <ExcelExportColumn field="actQtyLtr" title="Actual Qty in Lit" width={110} />
          <ExcelExportColumn field="actQtyKg" title="Actual Qty in Kgs" width={110} />
          <ExcelExportColumn field="actFatP" title="Fat" width={80} />
          <ExcelExportColumn field="actSnfP" title="Snf" width={80} />
          <ExcelExportColumn field="aGravity" title="Sp.Gravity" width={90} />
          <ExcelExportColumn field="actFatKg" title="Fat(KG)" width={90} />
          <ExcelExportColumn field="actSnfKg" title="Snf(KG)" width={90} />
          <ExcelExportColumn field="actTs" title="Ts" width={90} />
        </ExcelExportColumn>
        <ExcelExportColumn field="diffLtr" title="Variation in LTR" width={110} />
        <ExcelExportColumn field="destination" title="Destination" width={120} />
        <ExcelExportColumn field="fMbrt" title="FMbrt" width={80} />
        <ExcelExportColumn field="mMbrt" title="MMbrt" width={80} />
        <ExcelExportColumn field="rMbrt" title="RMbrt" width={80} />
      </ExcelExport>
    </div>
  )
}
