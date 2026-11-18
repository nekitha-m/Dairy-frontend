import { useFormikContext } from 'formik'
import entryStyles from '../components/common/EntryCard.module.scss'

export interface SelectFieldOption {
  value: number
  label: string
}

interface SelectFieldProps {
  label: string
  name: string
  options: SelectFieldOption[]
}


export function SelectField({ label, name, options }: SelectFieldProps) {
  const { values, setFieldValue } = useFormikContext<Record<string, unknown>>()
  const value = (values[name] as number | null ) ?? 0

  return (
    <div className={entryStyles.field}>
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => setFieldValue(name, Number(e.target.value) || null)}
      >
        <option value={0}>-Select-</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
