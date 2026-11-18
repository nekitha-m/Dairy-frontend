import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { BMCAckRegDiff } from '../../models/Report/BMCAckRegDiff'

export const useGetBmcWiseAckregDiff = createQuery<
  BMCAckRegDiff[],
  { fromDate: string; toDate: string; bmcId?: number },
  AxiosError
>({
  queryKey: ['keyReportBmcWiseAckregDiff'],
  fetcher: ({ fromDate, toDate, bmcId }) =>
    unwrap<BMCAckRegDiff[]>(
      reportApiClient.get(`/Report/GetBmcWiseAckregDiff/${fromDate}/${toDate}/${bmcId ?? 0}`)
    ),
})
