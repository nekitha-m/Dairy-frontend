import { transactionApiClient, unwrap } from '../../api/httpClient'

export interface DespatchMainInv {
  despatchMainId: number
  despatchDate?: string
  invoiceNumber?: string
  despatchToId?: number
  tankerId?: string
}


export const getDespatchMainForInv = (desdate: string) =>
  unwrap<DespatchMainInv[]>(
    transactionApiClient.get(`/DesAck/GetDespatchMainForInv%20/${encodeURIComponent(desdate)}`)
  )
