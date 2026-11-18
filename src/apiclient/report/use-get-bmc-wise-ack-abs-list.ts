import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { BmcWiseAckAbs } from '../../models/Report/BmcWiseAckAbs'

export const useGetBmcWiseAckAbsList = createQuery<
  BmcWiseAckAbs[],
  { fromDate: string; toDate: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportBmcWiseAckAbsList'],
  fetcher: ({ fromDate, toDate, destinationId }) =>
    unwrap<BmcWiseAckAbs[]>(
      reportApiClient.get(
        `/Report/GetBmcWiseAckAbsList/${fromDate}/${toDate}/${destinationId ?? 0}`
      )
    ),
})
