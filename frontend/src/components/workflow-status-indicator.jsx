"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  FileText,
  Shield,
  Users,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Mail,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"

export default function WorkflowStatusIndicator({ sharePoint, onRelaunch }) {
  const { user } = useAuth()

  const getWorkflowStep = () => {
    // If any user disapproved, document is canceled
    if (sharePoint.status === "disapproved" || sharePoint.status === "cancelled") return "cancelled"
    // If manager rejected, document is closed
    if (sharePoint.status === "rejected") return "rejected"
    // Step 1: Document created, waiting for manager approval
    if (!sharePoint.managerApproved) return 1
    // Step 2: Manager approved, waiting for user approvals
    if (sharePoint.managerApproved && !sharePoint.allUsersSigned) return 2
    // Step 3: All users approved, document completed
    if (sharePoint.allUsersSigned) return 3
    return 1
  }

  const currentStep = getWorkflowStep()
  const progress = typeof currentStep === "number" ? (currentStep / 3) * 100 : 0

  // Enhanced user matching logic
  const currentUserLicense = user?.license
  const currentUserUsername = user?.username
  const currentUserId = user?._id

  // Check if current user is assigned to approve this document
  const userSigner = sharePoint?.usersToSign?.find((signer) => {
    if (!signer?.user) return false
    if (currentUserUsername && signer.user.username === currentUserUsername) return true
    if (currentUserId && signer.user._id === currentUserId) return true
    if (currentUserLicense && signer.user.license === currentUserLicense) return true
    return false
  })

  // Check if current user is a selected manager for this document
  const isSelectedManager = sharePoint?.managersToApprove?.some((managerId) => {
    return managerId === currentUserId || managerId === currentUserLicense
  })

  const isUserAssigned = !!userSigner
  const hasUserApproved = userSigner?.hasSigned || false
  const hasUserDisapproved = userSigner?.hasDisapproved || false

  // User can approve only if manager approved and user hasn't acted yet
  const canUserApprove = sharePoint?.managerApproved && isUserAssigned && !hasUserApproved && !hasUserDisapproved

  // Check if user is the creator and can relaunch
  const isCreator = sharePoint?.createdBy?._id === user?._id || sharePoint?.createdBy?.username === user?.username
  const canRelaunch =
    isCreator &&
    (sharePoint.status === "disapproved" || sharePoint.status === "rejected" || sharePoint.status === "cancelled")

  // Manager can approve only if they are selected for this document and haven't approved yet
  const canManagerApprove = isSelectedManager && sharePoint.status === "pending_approval" && !sharePoint.managerApproved

  const steps = [
    {
      id: 1,
      title: "Document Created",
      description: "Document created and sent to selected managers for approval",
      icon: FileText,
      status: currentStep >= 1 ? "completed" : "pending",
    },
    {
      id: 2,
      title: "Manager Approval",
      description: sharePoint.managerApproved
        ? `Approved by ${sharePoint.approvedBy?.username || "Manager"}`
        : "Awaiting manager approval",
      icon: Shield,
      status: currentStep >= 2 ? "completed" : currentStep === 1 ? "pending" : "upcoming",
    },
    {
      id: 3,
      title: "User Approvals",
      description: sharePoint.allUsersSigned
        ? "All users have approved"
        : `${sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/${sharePoint.usersToSign?.length || 0} approvals collected`,
      icon: Users,
      status: currentStep >= 3 ? "completed" : currentStep === 2 ? "pending" : "upcoming",
    },
    {
      id: 4,
      title: "Completed",
      description: "All approvals collected - document workflow completed",
      icon: CheckCircle2,
      status: sharePoint.status === "completed" ? "completed" : "upcoming",
    },
  ]

  // Handle cancelled/disapproved state
  if (currentStep === "cancelled" || currentStep === "rejected") {
    const isManagerRejection = currentStep === "rejected"
    const title = isManagerRejection ? "Manager Rejected Document" : "Document Cancelled"
    const description = isManagerRejection
      ? "This document has been rejected by the manager."
      : "This document has been cancelled due to user disapproval."

    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Workflow Status - {isManagerRejection ? "Rejected" : "Cancelled"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-700">{title}</span>
            </div>
            <p className="text-sm text-red-600">{description}</p>
            {sharePoint.disapprovalNote && (
              <div className="p-2 mt-2 bg-red-100 border border-red-200 rounded">
                <p className="text-xs font-medium text-red-700">Reason:</p>
                <p className="text-sm text-red-600">{sharePoint.disapprovalNote}</p>
              </div>
            )}
          </div>

          {canRelaunch && (
            <div className="space-y-2">
              <h4 className="font-medium">Available Actions</h4>
              <Button onClick={onRelaunch} variant="outline" className="w-full" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Relaunch Document
              </Button>
              <p className="text-xs text-muted-foreground">
                Relaunching will reset all approvals and send the document back to managers for re-approval. History
                will be preserved.
              </p>
            </div>
          )}

          {/* Show rejection/disapproval details */}
          <div className="pt-4 border-t">
            <h4 className="mb-2 font-medium">{isManagerRejection ? "Rejection" : "Disapproval"} Details</h4>
            <div className="space-y-2">
              {isManagerRejection && sharePoint.approvedBy && (
                <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">
                      Manager: {sharePoint.approvedBy.username || "Unknown Manager"}
                    </span>
                  </div>
                  {sharePoint.disapprovalNote && <p className="text-xs text-red-600">{sharePoint.disapprovalNote}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Rejected on {new Date(sharePoint.approvedAt || sharePoint.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {!isManagerRejection &&
                sharePoint.usersToSign
                  ?.filter((u) => u?.hasDisapproved && u?.user)
                  .map((signer) => (
                    <div key={signer.user._id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          {signer.user?.username || "Unknown User"}
                        </span>
                      </div>
                      {signer.disapprovalNote && <p className="text-xs text-red-600">{signer.disapprovalNote}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Disapproved on {new Date(signer.disapprovedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

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

        {/* Manager-specific status */}
        {isSelectedManager && !sharePoint.managerApproved && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium">Manager Action Required</h4>
              <div className="flex items-center gap-2 p-3 border rounded-lg border-amber-200 bg-amber-50">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">You are selected to approve this document</span>
              </div>
              <p className="px-3 text-xs text-muted-foreground">
                As a selected manager, you can approve or reject this document. If rejected, the creator can relaunch
                it.
              </p>
            </div>
          </div>
        )}

        {/* User-specific status */}
        {isUserAssigned && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium">Your Status</h4>
              {hasUserApproved ? (
                <div className="flex items-center gap-2 p-3 border border-green-200 rounded-lg bg-green-50">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">You have approved this document</span>
                </div>
              ) : hasUserDisapproved ? (
                <div className="flex items-center gap-2 p-3 border border-red-200 rounded-lg bg-red-50">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">You have disapproved this document</span>
                </div>
              ) : canUserApprove ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border border-blue-200 rounded-lg bg-blue-50">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Ready for your approval</span>
                  </div>
                  <p className="px-3 text-xs text-muted-foreground">
                    The manager has approved this document. You can now approve or disapprove it.
                  </p>
                </div>
              ) : !sharePoint?.managerApproved ? (
                <div className="flex items-center gap-2 p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Waiting for manager approval</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Document approved, waiting for other users</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* External users info */}
        {sharePoint.usersToSign?.some((u) => u.isExternal) && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium">External Users</h4>
              <div className="flex items-center gap-2 p-3 border border-blue-200 rounded-lg bg-blue-50">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {sharePoint.usersToSign?.filter((u) => u.isExternal).length} external user(s) invited
                </span>
              </div>
              <p className="px-3 text-xs text-muted-foreground">
                External users will receive email invitations to register and approve after manager approval.
              </p>
            </div>
          </div>
        )}

        {/* Document Statistics */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {sharePoint.usersToSign?.filter((u) => u.hasDisapproved).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Disapproved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {(sharePoint.usersToSign?.length || 0) -
                  (sharePoint.usersToSign?.filter((u) => u.hasSigned || u.hasDisapproved).length || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
