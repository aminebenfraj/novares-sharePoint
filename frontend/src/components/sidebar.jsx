"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Settings,
  HelpCircle,
  ChevronDown,
  Search,
  FileText,
  ClipboardCheck,
  FileCheck,
  Shield,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"

// Navigation structure for SharePoint document management
const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    isMainPage: true,
  },
  {
    id: "sharepoint",
    label: "SharePoint Documents",
    icon: FileText,
    children: [
      {
        id: "sharepoint-list",
        label: "All Documents",
        icon: FileText,
        path: "/sharepoint",
        isMainPage: true,
      },
      {
        id: "sharepoint-create",
        label: "Create Document",
        icon: FileCheck,
        path: "/sharepoint/create",
      },
      {
        id: "my-documents",
        label: "My Documents",
        icon: User,
        path: "/sharepoint?filter=created",
      },
      {
        id: "assigned-documents",
        label: "Assigned to Me",
        icon: ClipboardCheck,
        path: "/sharepoint/assigned",
      },
    ],
  },
  {
    id: "profile",
    label: "Profile & Settings",
    icon: User,
    children: [
      {
        id: "profile",
        label: "My Profile",
        icon: User,
        path: "/profile",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        path: "/settings",
      },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: Shield,
    children: [
      {
        id: "userManagement",
        label: "User Management",
        icon: User,
        path: "/admin",
      },
      {
        id: "createUser",
        label: "Create User",
        icon: User,
        path: "/admin/create-user",
      },
    ],
  },
]

// Quick access to main pages
const mainPages = [
  {
    id: "sharepoint",
    label: "Documents",
    icon: FileText,
    path: "/sharepoint",
  },
  {
    id: "create",
    label: "Create",
    icon: FileCheck,
    path: "/sharepoint/create",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    path: "/profile",
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    path: "/admin",
  },
]

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [expandedItems, setExpandedItems] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const location = useLocation()

  // Handle expanding menu items based on current path
  useEffect(() => {
    // Create a new object to avoid direct state mutation
    const newExpandedItems = { ...expandedItems }
    let hasChanges = false

    navigationItems.forEach((item) => {
      if (item.children) {
        const shouldExpand = item.children.some(
          (child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`),
        )

        if (shouldExpand && !newExpandedItems[item.id]) {
          newExpandedItems[item.id] = true
          hasChanges = true
        }
      }
    })

    if (hasChanges) {
      setExpandedItems(newExpandedItems)
    }
  }, [location.pathname])

  // Toggle menu item expansion
  const toggleItem = useCallback((itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }, [])

  // Filter navigation items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return navigationItems

    const searchLower = searchTerm.toLowerCase()

    return navigationItems
      .map((item) => {
        if (item.label.toLowerCase().includes(searchLower)) {
          return item
        }

        if (item.children) {
          const filteredChildren = item.children.filter((child) => child.label.toLowerCase().includes(searchLower))

          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren }
          }
        }

        return null
      })
      .filter(Boolean)
  }, [searchTerm])

  // Handle navigation click - fix for the bug when clicking on pages
  const handleNavigationClick = useCallback(
    (e, path) => {
      // Only close sidebar on mobile
      if (window.innerWidth < 768) {
        toggleSidebar()
      }

      // If we're already on this path, prevent default and stop propagation
      if (location.pathname === path) {
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [location.pathname, toggleSidebar],
  )

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed md:relative h-full bg-white dark:bg-zinc-900 border-r dark:border-zinc-800 overflow-hidden ${
          isOpen ? "block" : "hidden md:block"
        } shadow-sm z-50`}
      >
        <div className="flex flex-col h-full">
          {/* Search bar */}
          <div className="px-4 py-2 border-b dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search menu..."
                className="pl-8 h-9 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Quick access to main pages */}
          {!searchTerm && (
            <div className="px-4 py-2 border-b dark:border-zinc-800">
              <h3 className="mb-2 text-xs font-medium tracking-wider uppercase text-slate-500 dark:text-zinc-400">
                Main Pages
              </h3>
              <div className="grid grid-cols-3 gap-1">
                {mainPages.map((page) => (
                  <motion.div key={page.id} whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                    <Link
                      to={page.path}
                      className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors text-center ${
                        location.pathname === page.path
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                      }`}
                      onClick={(e) => handleNavigationClick(e, page.path)}
                    >
                      <page.icon
                        className={`w-5 h-5 mb-1 ${
                          location.pathname === page.path ? "text-primary" : "text-slate-500 dark:text-zinc-400"
                        }`}
                      />
                      <span className="text-xs">{page.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Menu items */}
          <ScrollArea className="flex-1">
            <div className="px-2 py-2">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <p>No menu items found</p>
                  <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">
                    Clear search
                  </Button>
                </div>
              ) : (
                // Render actual menu items
                filteredItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <Separator className="mx-2 my-2 dark:bg-zinc-800" />}

                    {!item.children ? (
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 mx-1 my-0.5 text-sm rounded-md transition-colors ${
                          location.pathname === item.path
                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium"
                            : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                        }`}
                        onClick={(e) => handleNavigationClick(e, item.path)}
                      >
                        <item.icon
                          className={`w-5 h-5 ${
                            location.pathname === item.path
                              ? "text-slate-900 dark:text-zinc-100"
                              : "text-slate-500 dark:text-zinc-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <Collapsible
                        open={expandedItems[item.id]}
                        onOpenChange={() => toggleItem(item.id)}
                        className="mx-1 my-0.5"
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            className={`flex items-center justify-between w-full gap-3 px-3 py-2 text-sm rounded-md transition-colors 
                            ${
                              expandedItems[item.id]
                                ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium"
                                : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                className={`w-5 h-5 ${
                                  expandedItems[item.id]
                                    ? "text-slate-900 dark:text-zinc-100"
                                    : "text-slate-500 dark:text-zinc-400"
                                }`}
                              />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                expandedItems[item.id] ? "rotate-180" : ""
                              } text-slate-500 dark:text-zinc-400`}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="py-1 space-y-1">
                            {item.children.map((child) => (
                              <Link
                                key={child.id}
                                to={child.path}
                                className={`flex items-center justify-between pl-10 pr-3 py-2 text-sm rounded-md transition-colors 
                                ${
                                  location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
                                    ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-medium"
                                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                                }
                                ${child.isMainPage ? "font-medium" : ""}
                                `}
                                onClick={(e) => handleNavigationClick(e, child.path)}
                              >
                                <div className="flex items-center gap-3">
                                  <child.icon
                                    className={`w-4 h-4 ${
                                      location.pathname === child.path || location.pathname.startsWith(`${child.path}/`)
                                        ? "text-slate-900 dark:text-zinc-100"
                                        : child.isMainPage
                                          ? "text-slate-700 dark:text-zinc-300"
                                          : "text-slate-500 dark:text-zinc-400"
                                    }`}
                                  />
                                  <span>{child.label}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer actions */}
          <div className="p-4 mt-auto border-t dark:border-zinc-800">
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start w-full transition-colors border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                size="sm"
              >
                <HelpCircle className="w-4 h-4 mr-2 text-primary" />
                Help & Support
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar
