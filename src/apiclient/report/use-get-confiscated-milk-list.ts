import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { reportApiClient, unwrap } from '../../api/httpClient'
import type { ConfiscatedMilk } from '../../models/Report/ConfiscatedMilk'


export const useGetConfiscatedMilkList = createQuery<
  ConfiscatedMilk[],
  { fromDate: string; toDate: string; bmcId?: number },
  AxiosError
>({
  queryKey: ['keyReportConfiscatedMilkList'],
  fetcher: ({ fromDate, toDate, bmcId }) =>
    unwrap<ConfiscatedMilk[]>(
      reportApiClient.get(
        `/Report/GetConfiscatedMilkList/${fromDate}/${toDate}/${bmcId ?? 0}`
      )
    ),
})
