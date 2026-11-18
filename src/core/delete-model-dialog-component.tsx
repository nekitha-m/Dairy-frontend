import { useState, type ReactNode } from 'react'
import type { AxiosInstance } from 'axios'
import { Dialog, DialogActionsBar } from '@progress/kendo-react-dialogs'
import '@progress/kendo-theme-default/dist/all.css'
import { apiClient, unwrap } from '../api/httpClient'
import { Button } from '../components/common/Button'

export interface DeletePostDataInfo {
  data: any
  route: string
  client?: AxiosInstance
}

export enum DeleteStatus {
  Completed,
  Cancel,
  Confirmed,
}

interface DeleteModelDialogProps {
  children: ReactNode
  deleteData?: DeletePostDataInfo
  title: string
  onClose?: (status: DeleteStatus, data: any) => any
}


export function DeleteModelDialog({ children, deleteData, title, onClose }: DeleteModelDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(false)

  if (!deleteData) return null

  const submitDelete = async () => {
    setIsSubmitting(true)
    setError(false)
    try {
      const http = deleteData.client ?? apiClient
      await unwrap(http.delete(deleteData.route))
      onClose?.(DeleteStatus.Completed, deleteData.data)
    } catch {
      setError(true)
      setIsSubmitting(false)
    }
  }

  const onCancel = () => onClose?.(DeleteStatus.Cancel, null)

  return (
    <Dialog title={title} onClose={onCancel}>
      {error && <div className="field-error">Could not delete. Check the value and try again.</div>}
      {children}
      <DialogActionsBar>
        <Button variant="secondary" small onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button small onClick={submitDelete} disabled={isSubmitting}>
          {isSubmitting ? 'Deleting...' : 'OK'}
        </Button>
      </DialogActionsBar>
    </Dialog>
  )
}
