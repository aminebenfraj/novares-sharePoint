"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Calendar,
  Clock,
  Users,
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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
}

export default function SharePointCard({ sharePoint, currentUser, onViewDetail, onDelete }) {
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
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      layout
      className="cursor-pointer"
      onClick={() => onViewDetail(sharePoint._id)}
    >
      <Card className="h-full transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">{sharePoint.title}</CardTitle>
              <CardDescription className="text-sm">by {sharePoint.createdBy?.username}</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onViewDetail(sharePoint._id)
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
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
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getStatusColor(sharePoint.status)}>
              {getStatusIcon(sharePoint.status)}
              <span className="ml-1">{sharePoint.status.replace("_", " ").toUpperCase()}</span>
            </Badge>
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                <Timer className="w-3 h-3 mr-1" />
                Expired
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Deadline</p>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span className={isExpired ? "text-red-600 font-medium" : ""}>
                  {new Date(sharePoint.deadline).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Signers</p>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>
                  {sharePoint.usersToSign?.filter((u) => u.hasSigned).length || 0}/{sharePoint.usersToSign?.length || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {sharePoint.usersToSign?.slice(0, 3).map((signer, index) => (
                <TooltipProvider key={signer.user._id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="w-6 h-6 border-2 border-white">
                        <AvatarImage src={signer.user.image || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {signer.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{signer.user.username}</p>
                      <p className="text-xs">{signer.hasSigned ? "Signed" : "Pending"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {sharePoint.usersToSign?.length > 3 && (
                <div className="flex items-center justify-center w-6 h-6 bg-gray-100 border-2 border-white rounded-full">
                  <span className="text-xs text-gray-600">+{sharePoint.usersToSign.length - 3}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetail(sharePoint._id)
              }}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>
            <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
              <a href={sharePoint.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
