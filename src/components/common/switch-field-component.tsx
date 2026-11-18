import { useField } from "formik";
import { Switch } from "antd";
import React from "react";

interface SwitchFieldProps {
  name: string;
  label: string;
  disabled?: boolean;
  prefix?: string;
  sufix?: string;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  name,
  label,
  disabled,
  prefix,
  sufix,
}) => {
  const [field, , helpers] = useField<boolean>(name);

  return (
    <div className="d-flex align-items-center mb-2">
      {label && <label className="me-3 fw-medium">{label} : </label>}
      {prefix && (
        <span
          className={`me-2 small ${
            field.value ? "text-muted" : "text-success fw-semibold"
          }`}
        >
          {prefix}
        </span>
      )}
      <Switch
        checked={field.value}
        onChange={(checked) => helpers.setValue(checked)}
        disabled={disabled}
      />
      {sufix && (
        <span
          className={`ms-2 small ${
            field.value ? "text-success fw-semibold" : "text-muted"
          }`}
        >
          {sufix}
        </span>
      )}
    </div>
  );
};
