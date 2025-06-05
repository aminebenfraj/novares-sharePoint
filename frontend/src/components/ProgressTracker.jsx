"use client"

import { motion } from "framer-motion"
import { CheckCircle, Clock, Users, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stepVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  completed: { opacity: 1, scale: 1.1 },
}

export default function ProgressTracker({ document }) {
  const getWorkflowSteps = () => {
    const steps = [
      {
        id: 1,
        title: "Document Created",
        description: "Document submitted for approval",
        icon: Users,
        status: "completed",
        timestamp: document.creationDate,
      },
      {
        id: 2,
        title: "Manager Approval",
        description: "Waiting for manager to approve",
        icon: Shield,
        status: document.managerApproved ? "completed" : "pending",
        timestamp: document.managerApproved ? document.approvedAt : null,
      },
      {
        id: 3,
        title: "User Signatures",
        description: `${document.usersToSign?.filter((u) => u.hasSigned).length || 0} of ${document.usersToSign?.length || 0} signed`,
        icon: Users,
        status: document.allUsersSigned ? "completed" : document.managerApproved ? "in_progress" : "waiting",
        timestamp: null,
      },
      {
        id: 4,
        title: "Document Complete",
        description: "All signatures collected",
        icon: CheckCircle,
        status: document.status === "completed" ? "completed" : "waiting",
        timestamp: document.status === "completed" ? document.completedAt : null,
      },
    ]

    return steps
  }

  const getStepIcon = (step) => {
    const Icon = step.icon

    if (step.status === "completed") {
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
      )
    }

    if (step.status === "in_progress") {
      return (
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      )
    }

    if (step.status === "pending") {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: "default", text: "Completed", className: "bg-green-100 text-green-800" },
      in_progress: { variant: "default", text: "In Progress", className: "bg-blue-100 text-blue-800" },
      pending: { variant: "default", text: "Pending", className: "bg-amber-100 text-amber-800" },
      waiting: { variant: "secondary", text: "Waiting", className: "bg-gray-100 text-gray-600" },
    }

    const config = statusConfig[status] || statusConfig.waiting

    return <Badge className={config.className}>{config.text}</Badge>
  }

  const steps = getWorkflowSteps()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={stepVariants}
              initial="hidden"
              animate={step.status === "completed" ? "completed" : "visible"}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4"
            >
              {getStepIcon(step)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{step.title}</h4>
                  {getStatusBadge(step.status)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                {step.timestamp && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(step.timestamp).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>

              {index < steps.length - 1 && <div className="absolute w-px h-6 mt-10 left-5 bg-border" />}
            </motion.div>
          ))}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{document.completionPercentage || 0}%</span>
            </div>
            <Progress value={document.completionPercentage || 0} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
