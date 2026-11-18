import type { MutableRefObject } from 'react'
import { ErrorMessage, Field, getIn, useFormikContext } from 'formik'
import entryStyles from '../common/EntryCard.module.scss'

interface InputFieldProps {
  label: string
  name: string
  type?: string
  maxLength?: number
  required?: boolean
  disabled?: boolean
  // Formats the raw input value before it's written to Formik state (e.g. digits-only for phone numbers).
  sanitize?: (value: string) => string
  // Writes the value into Formik state as a number instead of a string — for
  // fields whose DTO type is numeric (e.g. Dairy.Transaction.Api's litre/fat/snf fields).
  asNumber?: boolean
  // Exposes the underlying <input> DOM node — e.g. to autofocus the first field of an entry form.
  inputRef?: MutableRefObject<HTMLInputElement | null>
}

// Mirrors esales' InputField (src/components/form/input-field.component.tsx): label + Formik
// <Field> + <ErrorMessage>, reused by every *-entry page instead of hand-rolled input markup.
export function InputField({ label, name, type, maxLength, required, disabled, sanitize, asNumber, inputRef }: InputFieldProps) {
  const { setFieldValue, values } = useFormikContext()
  // API values can be null; a null `value` makes React treat the input as uncontrolled
  const value = getIn(values, name) ?? ''
  const overrideProps = asNumber
    ? {
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          // <input type="number"> ignores maxLength, so an explicit maxLength means "whole number of at most that many digits"
          const raw = maxLength === undefined ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, maxLength)
          // In digits mode an emptied field stays empty (so "required" can flag it); otherwise it falls back to 0
          setFieldValue(name, raw === '' ? (maxLength === undefined ? 0 : '') : Number(raw))
        },
      }
    : sanitize
    ? { onChange: (e: React.ChangeEvent<HTMLInputElement>) => setFieldValue(name, sanitize(e.target.value)) }
    : {}

  return (
    <div className={entryStyles.field}>
      <label htmlFor={name}>
        {label}
        {required && <span className="field-error"> *</span>}
      </label>
      <Field
        as="input"
        id={name}
        name={name}
        type={type || 'text'}
        maxLength={maxLength ?? 100}
        disabled={disabled}
        value={value}
        autoComplete="off"
        innerRef={(el: HTMLInputElement | null) => {
          if (inputRef) inputRef.current = el
        }}
        {...overrideProps}
      />
      <ErrorMessage name={name} component="div" className="field-error" />
    </div>
  )
}
