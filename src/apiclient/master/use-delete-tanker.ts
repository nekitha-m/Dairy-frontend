import type { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { apiClient, unwrap } from '../../api/httpClient'

type DeleteTankerParams = {
  tankerId?: number
}

export const useDeleteTanker = () =>
  useMutation<number, AxiosError, DeleteTankerParams>({
    mutationFn: (params) => unwrap<number>(apiClient.delete(`/Tanker/DeleteTanker/${params.tankerId}`)),
  })
