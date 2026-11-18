import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { transactionApiClient, unwrap } from '../../api/httpClient'
import type { DespatchLine } from '../../models/Transaction/Despatch'

export const useGetDespatchLines = createQuery<DespatchLine[], { despatchMainId: number }, AxiosError>({
  queryKey: ['keyDespatchLines'],
  fetcher: ({ despatchMainId }) =>
    unwrap<DespatchLine[]>(transactionApiClient.get(`/DespatchLine/GetDespatchLine/${despatchMainId}`)),
})
