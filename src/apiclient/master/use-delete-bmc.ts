import type { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { apiClient, unwrap } from '../../api/httpClient'

type DeleteBmcParams = {
  bmcId?: number
}

export const useDeleteBmc = () =>
  useMutation<number, AxiosError, DeleteBmcParams>({
    mutationFn: (params) => unwrap<number>(apiClient.delete(`/Bmc/DeleteBmc/${params.bmcId}`)),
  })
