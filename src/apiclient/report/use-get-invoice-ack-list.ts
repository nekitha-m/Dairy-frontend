import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { InvoiceAckList } from '../../models/Report/InvoiceAckList'

export const useGetInvoiceAckList = createQuery<
  InvoiceAckList[],
  { fromDate: string; toDate: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportInvoiceAckList'],
  fetcher: ({ fromDate, toDate, destinationId }) =>
    unwrap<InvoiceAckList[]>(
      reportApiClient.get(`/Report/GetInvoiceAckList/${fromDate}/${toDate}/${destinationId ?? 0}`)
    ),
})
