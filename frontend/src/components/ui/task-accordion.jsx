"use client"

import { useState } from "react"
import { Checkbox } from "../ui/checkbox"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { motion } from "framer-motion"

export function TaskAccordion({ items, values, onChange }) {
  const [expandedItem, setExpandedItem] = useState(null)

  const formatLabel = (label) => {
    return label
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      value={expandedItem || undefined}
      onValueChange={(value) => setExpandedItem(value)}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <AccordionItem value={`item-${index}`} className="mb-2 overflow-hidden border rounded-md">
            <AccordionTrigger className="px-4 py-3 text-lg font-semibold transition-colors hover:bg-muted/50">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={values[item.id] || false}
                  onCheckedChange={(checked) => onChange(item.id, checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5"
                />
                <Label className="text-left cursor-pointer">{formatLabel(item.label)}</Label>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-1 gap-4 mt-2 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Responsible</Label>
                  <Input type="text" placeholder="Enter responsible person" />
                </div>
                <div className="space-y-2">
                  <Label>Planned Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Completion Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Comments</Label>
                  <Textarea placeholder="Add any comments here" />
                </div>
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <Input type="file" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </motion.div>
      ))}
    </Accordion>
  )
}

