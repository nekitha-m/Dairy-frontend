import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { apiClient, unwrap } from '../../api/httpClient'
import type Bmc from '../../models/masters/Bmc'

export const useGetBmcs = createQuery<Bmc[], void, AxiosError>({
  queryKey: ['keyBmclist'],
  fetcher: () => unwrap<Bmc[]>(apiClient.get('/Bmc/GetBmc')),
})
