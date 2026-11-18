import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { BMCAckRegVm } from '../../models/Report/BMCAckRegVm'

export const useGetBmcWiseAck = createQuery<
  BMCAckRegVm[],
  { date: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportBmcWiseAck'],
  fetcher: ({ date, destinationId }) =>
    unwrap<BMCAckRegVm[]>(reportApiClient.get(`/Report/GetBmcWiseAck/${date}/${destinationId ?? 0}`)),
})
