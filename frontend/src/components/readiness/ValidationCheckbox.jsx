"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

export function ValidationCheckbox({ field, label, value, onChange, onValidationChange }) {
  const [open, setOpen] = useState(false)
  const [validation, setValidation] = useState({
    tko: false,
    ot: false,
    ot_op: false,
    is: false,
    sop: false,
    ok_nok: "NOK",
    comments: "",
    who: "",
    when: new Date(),
    validation_check: false,
  })

  const handleValidationChange = (key, val) => {
    const newValidation = { ...validation, [key]: val }
    setValidation(newValidation)
    if (onValidationChange) {
      onValidationChange(field, newValidation)
    }
  }

  const handleSaveValidation = () => {
    // Update validation_check to true when saving
    const updatedValidation = { ...validation, validation_check: true }
    setValidation(updatedValidation)
    if (onValidationChange) {
      onValidationChange(field, updatedValidation)
    }
    setOpen(false)
  }

  return (
    <div className="flex items-center mb-4 space-x-2">
      <Checkbox id={field} checked={value} onCheckedChange={(checked) => onChange(field, checked)} />
      <Label
        htmlFor={field}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </Label>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="ml-auto">
            {validation.validation_check ? "Edit Validation" : "Add Validation"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Validation Details for {label}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${field}-tko`}
                  checked={validation.tko}
                  onCheckedChange={(checked) => handleValidationChange("tko", checked)}
                />
                <Label htmlFor={`${field}-tko`}>TKO</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${field}-ot`}
                  checked={validation.ot}
                  onCheckedChange={(checked) => handleValidationChange("ot", checked)}
                />
                <Label htmlFor={`${field}-ot`}>OT</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${field}-ot_op`}
                  checked={validation.ot_op}
                  onCheckedChange={(checked) => handleValidationChange("ot_op", checked)}
                />
                <Label htmlFor={`${field}-ot_op`}>OT OP</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${field}-is`}
                  checked={validation.is}
                  onCheckedChange={(checked) => handleValidationChange("is", checked)}
                />
                <Label htmlFor={`${field}-is`}>IS</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${field}-sop`}
                  checked={validation.sop}
                  onCheckedChange={(checked) => handleValidationChange("sop", checked)}
                />
                <Label htmlFor={`${field}-sop`}>SOP</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${field}-ok_nok`}>Status</Label>
                <select
                  id={`${field}-ok_nok`}
                  className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background"
                  value={validation.ok_nok}
                  onChange={(e) => handleValidationChange("ok_nok", e.target.value)}
                >
                  <option value="OK">OK</option>
                  <option value="NOK">NOK</option>
                </select>
              </div>

              <div>
                <Label htmlFor={`${field}-who`}>Who</Label>
                <input
                  id={`${field}-who`}
                  className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background ring-offset-background"
                  value={validation.who}
                  onChange={(e) => handleValidationChange("who", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`${field}-comments`}>Comments</Label>
              <Textarea
                id={`${field}-comments`}
                className="min-h-[80px]"
                value={validation.comments}
                onChange={(e) => handleValidationChange("comments", e.target.value)}
              />
            </div>

            <div>
              <Label>Date</Label>
              <div className="p-2 mt-1 border rounded-md">
                <Calendar
                  mode="single"
                  selected={validation.when}
                  onSelect={(date) => handleValidationChange("when", date)}
                  className="border rounded-md"
                />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Selected: {validation.when ? format(validation.when, "PPP") : "None"}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleSaveValidation}>
              Save Validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

