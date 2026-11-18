import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { transactionApiClient, unwrap } from '../../api/httpClient'
import type Acknowledgement from '../../models/Transaction/Acknowledgement'

export const useGetAckMainList = createQuery<
  Acknowledgement,
  number,
  AxiosError
>({
  queryKey: ['keyAckMainList'],
  fetcher: (ackId) =>
    unwrap<Acknowledgement>(
      transactionApiClient.get(
        `/Acknowledgement/GetAckMainList/${ackId}`
      )
    ),
})