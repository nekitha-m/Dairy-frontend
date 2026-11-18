import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { CheckAckList } from '../../models/Report/CheckAckList'

export const useGetCheckAckList = createQuery<
  CheckAckList[],
  { fromDate: string; toDate: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportCheckAckList'],
  fetcher: ({ fromDate, toDate, destinationId }) =>
    unwrap<CheckAckList[]>(
      reportApiClient.get(`/Report/GetCheckAckList/${fromDate}/${toDate}/${destinationId ?? 0}`)
    ),
})
