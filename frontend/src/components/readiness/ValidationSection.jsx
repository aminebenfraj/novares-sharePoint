"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { formatFieldName } from "../../components/readiness/readinessUtils"

export const ValidationSection = ({ title, fields, data, setData }) => {
  const [activeField, setActiveField] = useState(fields[0])

  const handleValueChange = (field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
      },
    }))
  }

  const handleValidationChange = (field, validationField, value) => {
    setData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        validation: {
          ...prev[field]?.validation,
          [validationField]: value,
        },
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{title.charAt(0).toUpperCase() + title.slice(1)} Fields</CardTitle>
            <CardDescription>Select a field to edit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              {fields.map((field) => (
                <Button
                  key={field}
                  type="button" // Add this line to prevent form submission
                  variant={activeField === field ? "default" : "outline"}
                  className="relative justify-start text-left pl-9"
                  onClick={() => setActiveField(field)}
                >
                  <span className="absolute left-2">
                    {data[field]?.value ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </span>
                  {formatFieldName(field)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{formatFieldName(activeField)}</CardTitle>
            <CardDescription>Configure validation details for this field</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="status" className="w-full">
              <TabsList>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="validation">Validation Details</TabsTrigger>
              </TabsList>
              <TabsContent value="status" className="pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${activeField}-value`}
                    checked={data[activeField]?.value || false}
                    onCheckedChange={(checked) => handleValueChange(activeField, checked === true)}
                  />
                  <Label htmlFor={`${activeField}-value`}>Mark as completed</Label>
                </div>
              </TabsContent>
              <TabsContent value="validation" className="pt-4 space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${activeField}-tko`}>TKO</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${activeField}-tko`}
                          checked={data[activeField]?.validation?.tko || false}
                          onCheckedChange={(checked) => handleValidationChange(activeField, "tko", checked === true)}
                        />
                        <Label htmlFor={`${activeField}-tko`}>Completed</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${activeField}-ot`}>OT</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${activeField}-ot`}
                          checked={data[activeField]?.validation?.ot || false}
                          onCheckedChange={(checked) => handleValidationChange(activeField, "ot", checked === true)}
                        />
                        <Label htmlFor={`${activeField}-ot`}>Completed</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${activeField}-ot_op`}>OT OP</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${activeField}-ot_op`}
                          checked={data[activeField]?.validation?.ot_op || false}
                          onCheckedChange={(checked) => handleValidationChange(activeField, "ot_op", checked === true)}
                        />
                        <Label htmlFor={`${activeField}-ot_op`}>Completed</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${activeField}-is`}>IS</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${activeField}-is`}
                          checked={data[activeField]?.validation?.is || false}
                          onCheckedChange={(checked) => handleValidationChange(activeField, "is", checked === true)}
                        />
                        <Label htmlFor={`${activeField}-is`}>Completed</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${activeField}-sop`}>SOP</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${activeField}-sop`}
                          checked={data[activeField]?.validation?.sop || false}
                          onCheckedChange={(checked) => handleValidationChange(activeField, "sop", checked === true)}
                        />
                        <Label htmlFor={`${activeField}-sop`}>Completed</Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${activeField}-validation_check`}>Validation Check</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${activeField}-validation_check`}
                          checked={data[activeField]?.validation?.validation_check || false}
                          onCheckedChange={(checked) =>
                            handleValidationChange(activeField, "validation_check", checked === true)
                          }
                        />
                        <Label htmlFor={`${activeField}-validation_check`}>Completed</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${activeField}-ok_nok`}>Status</Label>
                      <RadioGroup
                        value={data[activeField]?.validation?.ok_nok || ""}
                        onValueChange={(value) => handleValidationChange(activeField, "ok_nok", value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="OK" id={`${activeField}-ok`} />
                          <Label htmlFor={`${activeField}-ok`}>OK</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="NOK" id={`${activeField}-nok`} />
                          <Label htmlFor={`${activeField}-nok`}>NOK</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="" id={`${activeField}-none`} />
                          <Label htmlFor={`${activeField}-none`}>Not Set</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${activeField}-who`}>Responsible Person</Label>
                        <Input
                          id={`${activeField}-who`}
                          value={data[activeField]?.validation?.who || ""}
                          onChange={(e) => handleValidationChange(activeField, "who", e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${activeField}-when`}>Date</Label>
                        <Input
                          id={`${activeField}-when`}
                          value={data[activeField]?.validation?.when || ""}
                          onChange={(e) => handleValidationChange(activeField, "when", e.target.value)}
                          placeholder="YYYY-MM-DD"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${activeField}-comment`}>Comments</Label>
                      <Textarea
                        id={`${activeField}-comment`}
                        value={data[activeField]?.validation?.comment || ""}
                        onChange={(e) => handleValidationChange(activeField, "comment", e.target.value)}
                        placeholder="Add any additional comments here"
                        rows={4}
                      />
                    </div>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

