import { Check, X } from "lucide-react"

export function StepperNav({ steps, currentStep }) {
  // Determine step status
  const getStepStatus = (step) => {
    if (currentStep === step) return "stepper-active"
    if (currentStep > step) return "stepper-completed"
    return ""
  }

  return (
    <ul className="relative flex flex-col gap-y-2">
      {steps.map((title, index) => (
        <li
          key={index}
          className="flex flex-col items-center flex-1 group"
          data-stepper-nav-item={`{ "index": ${index + 1} }`}
        >
          <span className="min-h-7.5 group inline-flex flex-col items-center gap-2 align-middle text-sm">
            <span
              className={`${getStepStatus(
                index + 1,
              )} stepper-active:bg-primary stepper-active:shadow stepper-active:text-primary-content stepper-success:bg-primary stepper-success:shadow stepper-success:text-primary-content stepper-error:bg-error stepper-error:text-error-content stepper-completed:bg-success stepper-completed:group-focus:bg-success bg-base-200/50 text-base-content group-focus:bg-base-content/20 size-7.5 flex flex-shrink-0 items-center justify-center rounded-full font-medium transition-all duration-200`}
            >
              <span className="text-sm stepper-success:hidden stepper-error:hidden stepper-completed:hidden">
                {index + 1}
              </span>
              <Check className="flex-shrink-0 hidden stepper-success:block size-4" />
              <X className="flex-shrink-0 hidden stepper-error:block size-4" />
            </span>
            <span className="font-medium text-base-content text-nowrap">{title}</span>
          </span>
          <div className="w-px h-8 mt-2 transition-colors duration-200 stepper-success:bg-primary stepper-completed:bg-success bg-base-content/20 group-last:hidden"></div>
        </li>
      ))}
    </ul>
  )
}

