"use client"

import { motion } from "framer-motion"
import { FileText, Calendar, Users, CheckCircle, Clock, AlertTriangle, MoreHorizontal, PenTool } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  hover: {
    y: -5,
    transition: { duration: 0.2 },
  },
}

export default function DocumentCard({ document, onSign, onView, onEdit, onDelete }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: "secondary", icon: Clock, color: "text-yellow-600" },
      in_progress: { variant: "default", icon: Users, color: "text-blue-600" },
      completed: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      expired: { variant: "destructive", icon: AlertTriangle, color: "text-red-600" },
      cancelled: { variant: "outline", icon: AlertTriangle, color: "text-gray-600" },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isDeadlineNear = (deadline) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= 0
  }

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{document.title}</CardTitle>
                <CardDescription className="text-sm">Created {formatDate(document.creationDate)}</CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onView(document)}>View Details</DropdownMenuItem>
                {document.usersToSign?.some((user) => !user.hasSigned) && (
                  <DropdownMenuItem onClick={() => onSign(document)}>
                    <PenTool className="w-4 h-4 mr-2" />
                    Sign Document
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onEdit(document)}>Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => onDelete(document)}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            {getStatusBadge(document.status)}
            {isDeadlineNear(document.deadline) && document.status !== "completed" && (
              <Badge variant="outline" className="text-orange-600">
                <Clock className="w-3 h-3 mr-1" />
                Due Soon
              </Badge>
            )}
          </div>

          {document.comment && <p className="text-sm text-muted-foreground line-clamp-2">{document.comment}</p>}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{document.completionPercentage || 0}%</span>
            </div>
            <Progress value={document.completionPercentage || 0} className="h-2" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span
                className={`${
                  isDeadlineNear(document.deadline) && document.status !== "completed"
                    ? "text-orange-600 font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {formatDate(document.deadline)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{document.usersToSign?.length || 0} signers</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Avatar className="w-6 h-6">
              <AvatarImage
                src={document.createdBy?.image || "/placeholder.svg?height=24&width=24"}
                alt={document.createdBy?.username}
              />
              <AvatarFallback className="text-xs">
                {document.createdBy?.username?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">by {document.createdBy?.username || "Unknown"}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
