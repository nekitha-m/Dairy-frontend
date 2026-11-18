import type { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { apiClient, unwrap } from '../../api/httpClient'

type DeleteRouteParams = {
  routeId?: number
}

export const useDeleteRoute = () =>
  useMutation<number, AxiosError, DeleteRouteParams>({
    mutationFn: (params) => unwrap<number>(apiClient.delete(`/Route/DeleteRoute/${params.routeId}`)),
  })
