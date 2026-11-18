import type { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { transactionApiClient, unwrap } from '../../api/httpClient'

type DeleteDespatchParams = {
  despatchMainId?: number
}

export const useDeleteDespatch = () =>
  useMutation<number, AxiosError, DeleteDespatchParams>({
    mutationFn: (params) =>
      unwrap<number>(transactionApiClient.delete(`/DespatchMain/DeleteDespatch/${params.despatchMainId}`)),
  })
