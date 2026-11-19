import type { AxiosError } from 'axios'
import { createQuery } from 'react-query-kit'
import { transactionApiClient, unwrap } from '../../api/httpClient'
import type Acknowledgement from '../../models/Transaction/Acknowledgement'
import { formatLocalDate } from '../../core/date-utils'
const MAX_PAGE_SIZE = 1000

interface AcknowledgementListVariables {
  // "YYYY-MM-DD"; the API only returns the list for one despatch date, so
  // callers that omit it get today's.
  despatchDate?: string
}

export const useGetAcknowledgements = createQuery<Acknowledgement[], AcknowledgementListVariables | void, AxiosError>({
  queryKey: ['keyAcknowledgementlist'],
  fetcher: async (variables) => {
    const despatchDate = variables?.despatchDate || formatLocalDate(new Date())
    const all: Acknowledgement[] = []
    let pageNumber = 1

    while (true) {
      const page = await unwrap<Acknowledgement[]>(
        transactionApiClient.get('/Acknowledgment/GetAcknowledgeList', {
          params: { despatchDate, pageNumber, pageSize: MAX_PAGE_SIZE },
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
