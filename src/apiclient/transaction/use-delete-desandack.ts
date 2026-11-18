import type { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { transactionApiClient, unwrap } from '../../api/httpClient'

type DeleteDesAndAckParams = {
  despatchMainId?: number
}

export const useDeleteDesAndAck = () =>
  useMutation<number, AxiosError, DeleteDesAndAckParams>({
    mutationFn: (params) =>
      unwrap<number>(transactionApiClient.delete(`/DesAck/DesAckDelete/${params.despatchMainId}`)),
  })
