import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { transactionApiClient, unwrap } from '../../api/httpClient'
import type Acknowledgement from '../../models/Transaction/Acknowledgement'
const MAX_PAGE_SIZE = 1000

export const useGetAcknowledgements = createQuery<Acknowledgement[], void, AxiosError>({
  queryKey: ['keyAcknowledgementlist'],
  fetcher: async () => {
    const all: Acknowledgement[] = []
    let pageNumber = 1

    while (true) {
      const page = await unwrap<Acknowledgement[]>(
        transactionApiClient.get('/Acknowledgment/GetAcknowledgeList', {
          params: { pageNumber, pageSize: MAX_PAGE_SIZE },
        })
      )
      all.push(...page)
      if (page.length < MAX_PAGE_SIZE) break
      pageNumber += 1
    }

    return all.sort(
      (a, b) =>
        (b.despatchDate ?? '').localeCompare(a.despatchDate ?? '') ||
        (b.despatchMainId ?? 0) - (a.despatchMainId ?? 0)
    )
  },
})
