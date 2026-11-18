import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { apiClient, unwrap } from '../../api/httpClient'
import type Society from '../../models/masters/Society'

export const useGetSocieties = createQuery<Society[], void, AxiosError>({
  queryKey: ['keySocietylist'],
  fetcher: () => unwrap<Society[]>(apiClient.get('/Society/GetSoc')),
})
