import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { apiClient, unwrap } from '../../api/httpClient'
import type Tanker from '../../models/masters/Tanker'

export const useGetTankers = createQuery<Tanker[], void, AxiosError>({
  queryKey: ['keyTankerlist'],
  fetcher: () => unwrap<Tanker[]>(apiClient.get('/Tanker/GetTankers')),
})
