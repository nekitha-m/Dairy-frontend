import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { apiClient, unwrap } from '../../api/httpClient'
import type Destination from '../../models/masters/Destination'

export const useGetDestinations = createQuery<Destination[], void, AxiosError>({
  queryKey: ['keyDestinationlist'],
  fetcher: () => unwrap<Destination[]>(apiClient.get('/Destination/GetDestinationList')),
})
