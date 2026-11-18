import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { DesWiseTankerList } from '../../models/Report/DesWiseTankerList'

export const useGetDesWiseTankerList = createQuery<
  DesWiseTankerList[],
  { date: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportDesWiseTankerList'],
  fetcher: ({ date, destinationId }) =>
    unwrap<DesWiseTankerList[]>(
      reportApiClient.get(`/Report/GetDesWiseTankerList/${date}/${destinationId ?? 0}`)
    ),
})
