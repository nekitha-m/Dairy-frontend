import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { DesAckAbnrml } from '../../models/Report/DesAckAbnrml'

export const useGetDesAckAbnrmlList = createQuery<
  DesAckAbnrml[],
  { fromDate: string; toDate: string },
  AxiosError
>({
  queryKey: ['keyReportDesAckAbnrmlList'],
  fetcher: ({ fromDate, toDate }) =>
    unwrap<DesAckAbnrml[]>(
      reportApiClient.get(`/Report/GetDesAckAbnrmlList/${fromDate}/${toDate}`)
    ),
})
