import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { apiClient, unwrap } from '../../api/httpClient'
import type Route from '../../models/masters/Route'

export const useGetRoutes = createQuery<Route[], void, AxiosError>({
  queryKey: ['keyRoutelist'],
  fetcher: () => unwrap<Route[]>(apiClient.get('/Route/GetRoutes')),
})
