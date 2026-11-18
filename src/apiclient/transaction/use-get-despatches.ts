import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { transactionApiClient, unwrap } from '../../api/httpClient'
import type Despatch from '../../models/Transaction/Despatch'

export const useGetDespatches = createQuery<Despatch[], void, AxiosError>({
  queryKey: ['keyDespatchlist'],
  fetcher: async () => {
    const result = await unwrap<Despatch[]>(
      transactionApiClient.get('/DespatchMain/GetDespatchMain', { params: { pageNumber: 1, pageSize: 1000 } })
    )
 
    return result.map((row) => ({
      ...row,
      tankerId: row.tankerId != null ? Number(row.tankerId) : undefined,
    }))
  },
})
