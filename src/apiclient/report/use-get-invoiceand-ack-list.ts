import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { InvoiceAndAckList } from '../../models/Report/InvoiceAndAckList'


export const useGetInvoiceandAckList = createQuery<
  InvoiceAndAckList[],
  { fromDate: string; toDate: string; destinationId?: number },
  AxiosError
>({
  queryKey: ['keyReportInvoiceandAckList'],
  fetcher: ({ fromDate, toDate, destinationId }) =>
    unwrap<InvoiceAndAckList[]>(
      reportApiClient.get(
        `/Report/GetInvoiceandAckList/${fromDate}/${toDate}/${destinationId ?? 0}`
      )
    ),
})
