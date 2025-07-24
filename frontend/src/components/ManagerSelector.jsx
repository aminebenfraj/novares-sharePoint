// components/ManagerSelector.jsx
"use client"

import { Search, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export const ManagerSelector = ({
  managers,
  selectedManager,
  onManagerSelect,
  searchTerm,
  setSearchTerm,
}) => {
  const [filteredManagers, setFilteredManagers] = useState(managers)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearchTerm])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredManagers(managers)
      return
    }

    const searchTermLower = searchTerm.toLowerCase()
    const filtered = managers.filter(
      (manager) =>
        manager.username?.toLowerCase().includes(searchTermLower) ||
        manager.email?.toLowerCase().includes(searchTermLower) ||
        manager.roles?.some((role) => role.toLowerCase().includes(searchTermLower))
    )
    setFilteredManagers(filtered)
  }, [searchTerm, managers])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search managers by name, email, or role..."
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Available Managers ({filteredManagers.length})</h4>
            <div className="text-sm text-muted-foreground">{selectedManager ? "1 selected" : "None selected"}</div>
          </div>
        </div>

        <ScrollArea className="h-64">
          <div className="p-2">
            {filteredManagers.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No managers found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredManagers.map((manager) => {
                  const isSelected = selectedManager?._id === manager._id
                  return (
                    <div
                      key={manager._id}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                      )}
                      onClick={() => onManagerSelect(manager)}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center",
                          isSelected ? "bg-primary" : "bg-transparent"
                        )}
                      >
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                            <Shield className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{manager.username}</p>
                            <p className="text-xs truncate text-muted-foreground">{manager.email}</p>
                          </div>
                        </div>
                        {manager.roles && manager.roles.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {manager.roles.slice(0, 2).map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                            {manager.roles.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{manager.roles.length - 2}
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