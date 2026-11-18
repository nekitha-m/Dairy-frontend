import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { transactionApiClient, unwrap } from '../../api/httpClient'
import type DesAndAck from '../../models/Transaction/DesAndAck'

export const useGetDesAndAckById = createQuery<DesAndAck | null, { id: number }, AxiosError>({
  queryKey: ['keyDesAckById'],
  fetcher: async ({ id }) => {
    const result = await unwrap<DesAndAck[]>(transactionApiClient.get(`/DesAck/GetByDesAckId/${id}`))
    return result?.[0] ?? null
  },
})
