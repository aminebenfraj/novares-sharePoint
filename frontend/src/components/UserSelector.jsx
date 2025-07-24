// components/UserSelector.jsx
"use client"

import { Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export const UserSelector = ({
  allUsers,
  selectedUsers,
  onUserToggle,
  searchTerm,
  setSearchTerm,
}) => {
  const [filteredUsers, setFilteredUsers] = useState(allUsers)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearchTerm])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(allUsers)
      return
    }

    const searchTermLower = searchTerm.toLowerCase()
    const filtered = allUsers.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchTermLower) ||
        user.email?.toLowerCase().includes(searchTermLower) ||
        user.roles?.some((role) => role.toLowerCase().includes(searchTermLower))
    )
    setFilteredUsers(filtered)
  }, [searchTerm, allUsers])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search users by name, email, or role..."
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Available Users ({filteredUsers.length})</h4>
            <div className="text-sm text-muted-foreground">{selectedUsers.length} selected</div>
          </div>
        </div>

        <ScrollArea className="h-64">
          <div className="p-2">
            {filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.find((u) => u._id === user._id)
                  return (
                    <div
                      key={user._id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                      )}
                      onClick={() => onUserToggle(user)}
                    >
                      <Checkbox
                        checked={!!isSelected}
                        onChange={() => onUserToggle(user)}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <span className="text-sm font-medium text-primary">
                              {user.username?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.username}</p>
                            <p className="text-xs truncate text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        {user.roles && user.roles.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {user.roles.slice(0, 2).map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                            {user.roles.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{user.roles.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}