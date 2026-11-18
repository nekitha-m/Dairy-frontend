import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { HonorariumListOld } from '../../models/Report/HonorariumListOld'

export const useGetHonoListOld = createQuery<
  HonorariumListOld[],
  { fromDate: string; toDate: string; bmcId?: number },
  AxiosError
>({
  queryKey: ['keyReportHonoListOld'],
  fetcher: ({ fromDate, toDate, bmcId }) =>
    unwrap<HonorariumListOld[]>(
      reportApiClient.get(
        `/Report/GetHonoListOld/${fromDate}/${toDate}/${bmcId ?? 0}`
      )
    ),
})
