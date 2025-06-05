"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Clock,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  ExternalLink,
} from "lucide-react"

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
}

export default function SharePointListItem({ sharePoint, currentUser, onViewDetail, onDelete }) {
  const isExpired = new Date(sharePoint.deadline) < new Date()
  const completionPercentage = sharePoint.completionPercentage || 0
  const canEdit = sharePoint.createdBy?._id === currentUser?._id || currentUser?.roles?.includes("Admin")

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "expired":
        return "bg-red-100 text-red-800 border-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-3 h-3" />
      case "in_progress":
        return <Clock className="w-3 h-3" />
      case "expired":
        return <Timer className="w-3 h-3" />
      case "cancelled":
        return <XCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (typeof onDelete === "function") {
      onDelete(sharePoint._id)
    }
  }

  return (
    <motion.div variants={itemVariants}>
      <Card
        className="transition-all duration-200 border-0 shadow-sm cursor-pointer bg-white/80 backdrop-blur-sm hover:shadow-md"
        onClick={() => onViewDetail(sharePoint._id)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0 gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{sharePoint.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {sharePoint.createdBy?.username} • {new Date(sharePoint.creationDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm font-medium">{completionPercentage}%</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>

              <div className="text-center">
                <div className="text-sm font-medium">
                  {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/{sharePoint.usersToSign?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Signed</div>
              </div>

              <div className="text-center min-w-[80px]">
                <div className={`text-sm font-medium ${isExpired ? "text-red-600" : ""}`}>
                  {new Date(sharePoint.deadline).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">Deadline</div>
              </div>

              <Badge className={getStatusColor(sharePoint.status)}>
                {getStatusIcon(sharePoint.status)}
                <span className="ml-1">{sharePoint.status.replace("_", " ").toUpperCase()}</span>
              </Badge>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetail(sharePoint._id)
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem asChild>
                      <a href={sharePoint.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Document
                      </a>
                    </DropdownMenuItem>
                    {canEdit && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
