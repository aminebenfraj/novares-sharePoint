"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ValidationCheckbox } from "./ValidationCheckbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function ReadinessSection({ title, fields, fieldLabels, data, onDataChange, onValidationChange }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="items">
            <AccordionTrigger>View Checklist Items</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {fields.map((field) => (
                  <ValidationCheckbox
                    key={field}
                    field={field}
                    label={fieldLabels[field] || field}
                    value={data[field]?.value || false}
                    onChange={(field, checked) => {
                      onDataChange((prev) => ({
                        ...prev,
                        [field]: { ...prev[field], value: checked },
                      }))
                    }}
                    onValidationChange={(field, validation) => {
                      onValidationChange(field, validation)
                    }}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

