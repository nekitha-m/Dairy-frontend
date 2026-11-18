import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { DesWiseAckList } from '../../models/Report/DesWiseAckList'

export const useGetDesWiseAckList = createQuery<
  DesWiseAckList[],
  { date: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportDesWiseAckList'],
  fetcher: ({ date, destinationId }) =>
    unwrap<DesWiseAckList[]>(
      reportApiClient.get(`/Report/GetDesWiseAckList/${date}/${destinationId ?? 0}`)
    ),
})
