import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { Honorarium } from '../../models/Report/Honorarium'

export const useGetHonorariumList = createQuery<
  Honorarium[],
  { fromDate: string; toDate: string; bmcId?: number },
  AxiosError
>({
  queryKey: ['keyReportHonorariumList'],
  fetcher: ({ fromDate, toDate, bmcId }) =>
    unwrap<Honorarium[]>(
      reportApiClient.get(
        `/Report/GetHonorariumList/${fromDate}/${toDate}/${bmcId ?? 0}`
      )
    ),
})
