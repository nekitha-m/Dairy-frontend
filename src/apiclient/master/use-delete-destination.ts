import type { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { apiClient, unwrap } from '../../api/httpClient'

type DeleteDestinationParams = {
  destinationId?: number
}

export const useDeleteDestination = () =>
  useMutation<number, AxiosError, DeleteDestinationParams>({
    mutationFn: (params) => unwrap<number>(apiClient.delete(`/Destination/DeleteDestination/${params.destinationId}`)),
  })
