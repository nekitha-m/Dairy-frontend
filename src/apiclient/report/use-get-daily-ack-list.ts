import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { DailyAckList } from '../../models/Report/DailyAckList'
export const useGetDailyAckList = createQuery<
  DailyAckList[],
  { date: string; bmcName?: string },
  AxiosError
>({
  queryKey: ['keyReportDailyAckList'],
  fetcher: ({ date, bmcName }) =>
    unwrap<DailyAckList[]>(
      reportApiClient.get(`/Report/GetDailyAckList/${date}/${encodeURIComponent(bmcName ?? '0')}`)
    ),
})
