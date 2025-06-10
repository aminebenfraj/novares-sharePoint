"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, FolderOpen, Copy, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ExternalLinkHandler({ link, children, className = "" }) {
  const [copied, setCopied] = useState(false)

  const isLocalPath = (url) => {
    // Enhanced detection for local paths
    const patterns = [
      /^[A-Z]:\\/i, // Windows drive paths like C:\, D:\
      /^file:\/\//i, // File protocol
      /^\\\\[^\\]+\\/i, // UNC paths like \\server\share
      /^\/[^/]/i, // Unix-style absolute paths
      /^[A-Z]:[^\\]/i, // Windows paths without backslash
    ]
    return patterns.some((pattern) => pattern.test(url))
  }

  const handleLinkClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLocalPath(link)) {
      try {
        // Convert Windows path to file URL format
        let fileUrl = link

        // Handle different path formats
        if (link.match(/^[A-Z]:\\/i)) {
          // Windows drive path: C:\Program Files -> file:///C:/Program Files
          fileUrl = `file:///${link.replace(/\\/g, "/")}`
        } else if (link.match(/^\\\\[^\\]+\\/i)) {
          // UNC path: \\server\share -> file://server/share
          fileUrl = `file:${link.replace(/\\/g, "/")}`
        } else if (!link.startsWith("file://")) {
          // Fallback for other formats
          fileUrl = `file:///${link.replace(/\\/g, "/")}`
        }

        console.log("Opening file URL:", fileUrl)

        // Try to open the file location
        const opened = window.open(fileUrl, "_blank")

        if (opened) {
          toast({
            title: "Opening File Location",
            description: "File Explorer should open to the specified location.",
            duration: 3000,
          })
        } else {
          // Fallback: copy to clipboard
          await copyPathToClipboard()
        }
      } catch (error) {
        console.error("Error opening file:", error)
        await copyPathToClipboard()
      }
    } else {
      // Regular web URL
      window.open(link, "_blank", "noopener,noreferrer")
    }
  }

  const copyPathToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Path Copied!",
        description: "File path copied to clipboard. Paste it in File Explorer address bar.",
        duration: 4000,
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy path to clipboard.",
      })
    }
  }

  const openInExplorer = () => {
    // Alternative method using Windows Explorer command
    if (isLocalPath(link)) {
      try {
        // This might work in some browsers/environments
        window.location.href = `explorer.exe "${link}"`
      } catch (error) {
        console.error("Explorer command failed:", error)
        handleLinkClick({ preventDefault: () => {}, stopPropagation: () => {} })
      }
    }
  }

  if (children) {
    return (
      <div className={className} onClick={handleLinkClick}>
        {children}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button variant="outline" size="sm" onClick={handleLinkClick}>
        {isLocalPath(link) ? (
          <>
            <FolderOpen className="w-4 h-4 mr-2" />
            Open Location
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Link
          </>
        )}
      </Button>

      {isLocalPath(link) && (
        <Button variant="ghost" size="sm" onClick={copyPathToClipboard}>
          {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </Button>
      )}
    </div>
  )
}
