import type { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { apiClient, unwrap } from '../../api/httpClient'

type DeleteSocietyParams = {
  societyId?: number
}

export const useDeleteSociety = () =>
  useMutation<number, AxiosError, DeleteSocietyParams>({
    mutationFn: (params) => unwrap<number>(apiClient.delete(`/Society/DeleteSociety/${params.societyId}`)),
  })
