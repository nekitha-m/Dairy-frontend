import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { DesWiseBMCTanker } from '../../models/Report/DesWiseBMCTanker'

export const useGetDesWiseBMCTankerList = createQuery<
  DesWiseBMCTanker[],
  { fromDate: string; toDate: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportDesWiseBMCTankerList'],
  fetcher: ({ fromDate, toDate, destinationId }) =>
    unwrap<DesWiseBMCTanker[]>(
      reportApiClient.get(
        `/Report/GetDesWiseBMCTankerList/${fromDate}/${toDate}/${destinationId ?? 0}`
      )
    ),
})
