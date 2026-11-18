import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { HonorariumVm } from '../../models/Report/HonorariumVm'
export const useGetDayWiseHonoList = createQuery<
  HonorariumVm[],
  { fromDate: string; toDate: string; bmcId?: number },
  AxiosError
>({
  queryKey: ['keyReportDayWiseHonoList'],
  fetcher: ({ fromDate, toDate, bmcId }) =>
    unwrap<HonorariumVm[]>(reportApiClient.get(`/Report/GetDayWiseHonoList/${fromDate}/${toDate}/${bmcId ?? 0}`)),
})
