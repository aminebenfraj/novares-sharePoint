"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Shield, Users, CheckCircle2, Clock, UserCheck } from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function WorkflowStatusIndicator({ sharePoint }) {
  const { user } = useAuth()

  const getWorkflowStep = () => {
    if (!sharePoint.managerApproved) return 1
    if (sharePoint.managerApproved && !sharePoint.allUsersSigned) return 2
    if (sharePoint.allUsersSigned) return 3
    return 1
  }

  const currentStep = getWorkflowStep()
  const progress = (currentStep / 3) * 100

  const isUserAssigned = sharePoint?.usersToSign?.some((signer) => signer.user._id === user?._id)
  const hasUserSigned = sharePoint?.usersToSign?.some((signer) => signer.user._id === user?._id && signer.hasSigned)
  const canUserSign = sharePoint?.managerApproved && isUserAssigned && !hasUserSigned

  const steps = [
    {
      id: 1,
      title: "Created",
      description: "Document created and awaiting manager approval",
      icon: FileText,
      status: currentStep >= 1 ? "completed" : "pending",
    },
    {
      id: 2,
      title: "Manager Approved",
      description: "Manager approved, ready for user signatures",
      icon: Shield,
      status: currentStep >= 2 ? "completed" : currentStep === 1 ? "pending" : "upcoming",
    },
    {
      id: 3,
      title: "Completed",
      description: "All assigned users have signed",
      icon: CheckCircle2,
      status: currentStep >= 3 ? "completed" : "upcoming",
    },
  ]

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Workflow Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Workflow Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = step.status === "completed"

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${
                    isCompleted
                      ? "bg-green-100 border-green-500 text-green-600"
                      : isActive
                        ? "bg-blue-100 border-blue-500 text-blue-600"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                  }
                `}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${isActive ? "text-blue-600" : ""}`}>{step.title}</h4>
                    <Badge variant={isCompleted ? "default" : isActive ? "secondary" : "outline"}>
                      {isCompleted ? "Done" : isActive ? "Current" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* User-specific status */}
        {isUserAssigned && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium">Your Status</h4>
              {hasUserSigned ? (
                <div className="flex items-center gap-2 p-3 border border-green-200 rounded-lg bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">You have signed this document</span>
                </div>
              ) : canUserSign ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Ready for your signature</span>
                  </div>
                  <p className="px-3 text-xs text-muted-foreground">
                    The manager has approved this document. You can now sign it.
                  </p>
                </div>
              ) : sharePoint?.managerApproved ? (
                <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Document approved, but you're not assigned to sign
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Waiting for manager approval</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manager approval status */}
        {user?.roles?.includes("Admin") && !sharePoint.managerApproved && sharePoint.status === "pending_approval" && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium">Admin Action Required</h4>
              <div className="flex items-center gap-2 p-3 border rounded-lg border-amber-200 bg-amber-50">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">This document requires your approval</span>
              </div>
            </div>
          </div>
        )}

        {/* Document Statistics */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Signed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {(sharePoint.usersToSign?.length || 0) -
                  (sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
