import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, Shield, UserCheck, AlertCircle } from "lucide-react"

export default function WorkflowStatusIndicator({ sharePoint }) {
  if (!sharePoint) return null

  const { status, managerApproved } = sharePoint
  const allSigned = sharePoint.usersToSign?.every((signer) => signer.hasSigned) || false
  const signedCount = sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0
  const totalSigners = sharePoint.usersToSign?.length || 0

  // Calculate the current step (1-4)
  let currentStep = 1 // Default: Document Created
  if (managerApproved) {
    currentStep = 2 // Manager Approved
    if (signedCount > 0) {
      currentStep = 3 // Signing In Progress
      if (allSigned) {
        currentStep = 4 // All Signed
      }
    }
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-blue-600" />
          Document Workflow Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="relative">
            {/* Progress bar */}
            <div className="absolute top-3 left-3 w-[calc(100%-24px)] h-1 bg-gray-200 rounded-full">
              <div className="h-1 bg-blue-600 rounded-full" style={{ width: `${(currentStep - 1) * 33.33}%` }}></div>
            </div>

            {/* Steps */}
            <div className="flex justify-between pt-6">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    currentStep >= 1 ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="mt-1 text-xs">Created</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    currentStep >= 2 ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="mt-1 text-xs">Approved</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    currentStep >= 3 ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <Clock className="w-3 h-3 text-white" />
                </div>
                <span className="mt-1 text-xs">Signing</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    currentStep >= 4 ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <UserCheck className="w-3 h-3 text-white" />
                </div>
                <span className="mt-1 text-xs">Completed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 mt-2 text-sm border rounded-md bg-gray-50">
            <span>Current Status:</span>
            <Badge
              className={
                status === "completed"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : status === "in_progress"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : status === "pending"
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                      : status === "pending_approval"
                        ? "bg-orange-100 text-orange-800 border-orange-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
              }
            >
              {status === "completed" ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : status === "in_progress" ? (
                <Clock className="w-3 h-3 mr-1" />
              ) : status === "pending" ? (
                <AlertCircle className="w-3 h-3 mr-1" />
              ) : status === "pending_approval" ? (
                <Shield className="w-3 h-3 mr-1" />
              ) : (
                <AlertCircle className="w-3 h-3 mr-1" />
              )}
              <span className="ml-1">{status?.replace("_", " ").toUpperCase()}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between p-2 text-sm border rounded-md bg-gray-50">
            <span>Signatures:</span>
            <span className="font-medium">
              {signedCount} of {totalSigners} ({Math.round((signedCount / totalSigners) * 100) || 0}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
