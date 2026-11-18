import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { BmcWiseAckreg } from '../../models/Report/BmcWiseAckreg'

export const useGetBmcWiseAckreg = createQuery<
  BmcWiseAckreg[],
  { fromDate: string; toDate: string; bmcId?: number },
  AxiosError
>({
  queryKey: ['keyReportBmcWiseAckreg'],
  fetcher: ({ fromDate, toDate, bmcId }) =>
    unwrap<BmcWiseAckreg[]>(
      reportApiClient.get(`/Report/GetBmcWiseAckreg/${fromDate}/${toDate}/${bmcId ?? 0}`)
    ),
})
