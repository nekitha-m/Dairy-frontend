import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { BmcWiseTankerDiff } from '../../models/Report/BmcWiseTankerDiff'

export const useGetBmcWiseTankerDiff = createQuery<
  BmcWiseTankerDiff[],
  { fromDate: string; toDate: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportBmcWiseTankerDiff'],
  fetcher: ({ fromDate, toDate, destinationId }) =>
    unwrap<BmcWiseTankerDiff[]>(
      reportApiClient.get(
        `/Report/GetBmcWiseTankerDiff/${fromDate}/${toDate}/${destinationId ?? 0}`
      )
    ),
})
