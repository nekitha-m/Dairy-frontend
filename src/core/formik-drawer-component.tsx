import type { ReactNode } from 'react'
import type { ObjectSchema } from 'yup'
import type { AxiosInstance } from 'axios'
import { Formik } from 'formik'
import { apiClient, unwrap } from '../api/httpClient'
import { EntryCard } from '../components/common/EntryCard'
import { Button } from '../components/common/Button'
import entryStyles from '../components/common/EntryCard.module.scss'

export enum SubmitStatus {
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

interface FormikModelProps<T extends object> {
  initialData: T
  validationSchema: ObjectSchema<any>
  isUpDateEntityDetails?: boolean
  wide?: boolean
  grid?: boolean
  maxWidth?: number
  insertRoute?: string
  updateRoute?: string
  client?: AxiosInstance
  /** Resolve with `false` to cancel the submit without closing the form (e.g. after showing a popup) */
  onSubmitOverride?: (values: T, ctx: { isUpdate: boolean }) => Promise<void | boolean>
  onClose: (status: SubmitStatus) => void
  children: ReactNode
}

export function FormikModel<T extends object>({
  initialData,
  validationSchema,
  isUpDateEntityDetails,
  wide,
  grid,
  maxWidth,
  insertRoute,
  updateRoute,
  client,
  onSubmitOverride,
  onClose,
  children,
}: FormikModelProps<T>) {
  const http = client ?? apiClient
  return (
    <Formik
      initialValues={initialData}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={async (values, { setSubmitting, setStatus }) => {
        setStatus(null)
        try {
          if (onSubmitOverride) {
            const result = await onSubmitOverride(values, { isUpdate: !!isUpDateEntityDetails })
            if (result === false) return
          } else if (isUpDateEntityDetails) {
            await unwrap<number>(http.put(updateRoute!, values))
          } else {
            await unwrap<number>(http.post(insertRoute!, values))
          }
          onClose(SubmitStatus.Completed)
        } catch {
          setStatus('Could not save. Check the values and try again.')
        } finally {
          setSubmitting(false)
        }
      }}
    >
      {({ handleSubmit, status }) => (
        <EntryCard onSubmit={handleSubmit} message={status} wide={wide} grid={grid} maxWidth={maxWidth}>
          {children}
          <div className={entryStyles.actions}>
            <Button type="submit">{isUpDateEntityDetails ? 'Update' : 'Save'}</Button>
            <Button type="button" variant="secondary" onClick={() => onClose(SubmitStatus.Cancelled)}>
              Cancel
            </Button>
          </div>
        </EntryCard>
      )}
    </Formik>
  )
}
