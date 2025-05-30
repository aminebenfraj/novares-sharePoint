"use client"

import { useState } from "react"
import { useField } from "formik"
import DatePicker from "react-datepicker"
import { format } from "date-fns"
import "react-datepicker/dist/react-datepicker.css"

const DatePickerField = ({ ...props }) => {
  const [field, meta, helpers] = useField(props)
  const [startDate, setStartDate] = useState(null)

  const handleChange = (date) => {
    setStartDate(date)
  }

  return (
    <div>
      <DatePicker
        selected={startDate}
        onChange={handleChange}
        dateFormat="yyyy-MM-dd"
        name={field.name}
        onBlur={field.onBlur}
        onSelect={(date) => {
          if (date) {
            // Add one day to fix timezone issue
            const adjustedDate = new Date(date)
            adjustedDate.setDate(adjustedDate.getDate() + 1)
            field.onChange(adjustedDate ? format(adjustedDate, "yyyy-MM-dd") : "")
          } else {
            field.onChange("")
          }
        }}
        {...props}
      />
      {meta.touched && meta.error ? <div className="error">{meta.error}</div> : null}
    </div>
  )
}

export default DatePickerField
