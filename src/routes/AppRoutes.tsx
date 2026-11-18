import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { HomePage } from '../features/home/HomePage'
import { RouteListPage } from '../features/routes/RouteListPage'
import { SocietyListPage } from '../features/society/SocietyListPage'
import { BmcListPage } from '../features/bmc/BmcListPage'
import { DestinationListPage } from '../features/destination/DestinationListPage'
import { TankerListPage } from '../features/tanker/TankerListPage'
import { DespatchListPage } from '../features/Transaction/despatch/DespatchListPage'
import { AcknowledgementListPage } from '../features/Transaction/acknowledgement/AcknowledgementListPage'
import { DesAndAckListPage } from '../features/Transaction/desandack/DesAndAckListPage'
import { BMCWiseInvAckLtrListPage } from '../features/Report/BMCWiseInvAckLtrListPage'
import { DesWiseBMCTankerListPage } from '../features/Report/DesWiseBMCTankerListPage'
import { BMCAckRegListPage } from '../features/Report/BMCAckRegListPage'
import { DailyDesWiseTankerPage } from '../features/Report/DailyDesWiseTankerPage'
import BMCWiseAckListPage from '../features/Report/BMCWiseAckListPage'
import { DesWiseTankerListPage } from '../features/Report/DesWiseTankerListPage'
import { BMCAckRegDairyListPage } from '../features/Report/BMCAckRegDairyListPage'
import { BMCWiseInvAckDiffListPage } from '../features/Report/BMCWiseInvAckDiffListPage'
import { BmcWiseTankerarvalsListPage } from '../features/Report/BmcWiseTankerarvalsListPage'
import { DailyAckListPage } from '../features/Report/DailyAckListPage'
import { CheckAckListPage } from '../features/Report/CheckAckListPage'
//import { InvoiceAckListPage } from '../features/Report/InvoiceAckListPage'
import { InvoiceAndAckListPage } from '../features/Report/InvoiceAndAckListPage'
import { HonorariumListPage } from '../features/Report/HonorariumListPage'
import { DayWiseHonorariumListPage } from '../features/Report/DayWiseHonorariumListPage'
import { ConfiscatedMilkListPage } from '../features/Report/ConfiscatedMilkListPage'
import { BMCWiseAckAbsListPage } from '../features/Report/BMCWiseAckAbsListPage'
import { DesAckAbnormalListPage } from '../features/Report/DesAckAbnormalListPage'
import { BmcWiseTankerListPage } from '../features/Report/BmcWiseTankerListPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/routes" element={<RouteListPage />} />

          <Route path="/societies" element={<SocietyListPage />} />

          <Route path="/bmcs" element={<BmcListPage />} />

          <Route path="/destinations" element={<DestinationListPage />} />

          <Route path="/tankers" element={<TankerListPage />} />

          <Route path="/despatches" element={<DespatchListPage />} />

          <Route path="/acknowledgements" element={<AcknowledgementListPage />} />

          <Route path="/desandacks" element={<DesAndAckListPage />} />

          <Route path="/reports/bmc-ack-reg-dairy-list" element={<BMCAckRegDairyListPage />} />
          <Route path="/reports/bmc-ack-reg-list" element={<BMCAckRegListPage />} />
          <Route path="/reports/bmc-wise-ack-abs-list" element={<BMCWiseAckAbsListPage />} />
          <Route path="/reports/bmc-wise-ack-list" element={<BMCWiseAckListPage />} />
          <Route path="/reports/bmc-wise-inv-ack-diff-list" element={<BMCWiseInvAckDiffListPage />} />
          <Route path="/reports/bmc-wise-inv-ack-ltr-list" element={<BMCWiseInvAckLtrListPage />} />
          <Route path="/reports/bmc-wise-tanker-arvals-list" element={<BmcWiseTankerarvalsListPage />} />
          <Route path="/reports/bmc-wise-tanker-list" element={<BmcWiseTankerListPage />} />
          <Route path="/reports/check-ack-list" element={<CheckAckListPage />} />
          <Route path="/reports/confiscated-milk-list" element={<ConfiscatedMilkListPage />} />
          <Route path="/reports/daily-ack-list" element={<DailyAckListPage />} />
          <Route path="/reports/daily-des-wise-tanker" element={<DailyDesWiseTankerPage />} />
          <Route path="/reports/day-wise-honorarium-list" element={<DayWiseHonorariumListPage />} />
          <Route path="/reports/des-ack-abnormal-list" element={<DesAckAbnormalListPage />} />
          <Route path="/reports/des-wise-bmc-tanker-list" element={<DesWiseBMCTankerListPage />} />
          <Route path="/reports/des-wise-tanker-list" element={<DesWiseTankerListPage />} />
          <Route path="/reports/honorarium-list" element={<HonorariumListPage />} />
         {/*  //<Route path="/reports/invoice-ack-list" element={<InvoiceAckListPage />} /> */}
          <Route path="/reports/invoice-and-ack-list" element={<InvoiceAndAckListPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
