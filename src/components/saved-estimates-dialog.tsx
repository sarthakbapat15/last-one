'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Save, FolderOpen, Trash2, Search, Loader2, Clock, User, AlertTriangle } from 'lucide-react'

interface SavedEstimateItem {
  id: string
  clientName: string
  label: string
  totalCost: number
  createdAt: string
  updatedAt: string
}

interface SavedEstimatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (label: string) => Promise<void>
  onLoad: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  hasUnsavedData: boolean
  currentTotal: number
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SavedEstimatesDialog({
  open,
  onOpenChange,
  onSave,
  onLoad,
  onDelete,
  hasUnsavedData,
  currentTotal,
}: SavedEstimatesDialogProps) {
  const [mode, setMode] = useState<'list' | 'save'>('list')
  const [saveLabel, setSaveLabel] = useState('')
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; label: string } | null>(null)
  const [loadConfirm, setLoadConfirm] = useState<{ id: string; label: string } | null>(null)
  const [error, setError] = useState('')

  const fetchEstimates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/estimates/saved')
      if (res.ok) {
        const data = await res.json()
        setSavedEstimates(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && mode === 'list') {
      fetchEstimates()
    }
  }, [open, mode, fetchEstimates])

  const handleSave = async () => {
    if (!saveLabel.trim()) {
      setError('Please enter a label')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(saveLabel.trim())
      setSaveLabel('')
      setMode('list')
      fetchEstimates()
    } catch (err: any) {
      setError(err?.message || 'Failed to save estimate')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
      setSavedEstimates(prev => prev.filter(e => e.id !== id))
    } catch (err: any) {
      console.error('Delete failed:', err)
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  const handleLoad = async (id: string) => {
    setLoading(true)
    try {
      await onLoad(id)
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to load estimate')
    } finally {
      setLoading(false)
      setLoadConfirm(null)
    }
  }

  const filtered = savedEstimates.filter(e =>
    e.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) { setMode('list'); setError('') } onOpenChange(v) }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
          {mode === 'list' ? (
            <>
              <SheetHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-emerald-600" />
                    <SheetTitle>Saved Estimates</SheetTitle>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { setMode('save'); setError('') }}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Current
                  </Button>
                </div>
                <SheetDescription>Load a previously saved estimate or save your current work</SheetDescription>
              </SheetHeader>

              {/* Search */}
              <div className="px-6 py-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or label..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* List */}
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No saved estimates</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Save your current estimate to find it here later</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {filtered.map((item) => (
                      <div
                        key={item.id}
                        className="group border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => {
                          if (hasUnsavedData) {
                            setLoadConfirm({ id: item.id, label: item.label })
                          } else {
                            handleLoad(item.id)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.label}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground truncate">{item.clientName}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatRelativeDate(item.updatedAt)}
                              </span>
                              <span className="text-xs font-semibold text-emerald-700">
                                ₹{item.totalCost.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm({ id: item.id, label: item.label })
                            }}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <>
              <SheetHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-emerald-600" />
                  <SheetTitle>Save Estimate</SheetTitle>
                </div>
                <SheetDescription>Save your current estimate to continue later</SheetDescription>
              </SheetHeader>

              <div className="flex-1 px-6 py-6 space-y-5">
                {currentTotal > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-emerald-600">Current Total</p>
                    <p className="text-lg font-bold text-emerald-800">₹{currentTotal.toLocaleString('en-IN')}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="save-label">Estimate Label *</Label>
                  <Input
                    id="save-label"
                    placeholder="e.g., Rajesh 3BHK Kitchen, Priya Living Room"
                    value={saveLabel}
                    onChange={(e) => { setSaveLabel(e.target.value); setError('') }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                    autoFocus
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <p className="text-xs text-muted-foreground">
                    A descriptive name helps you find this estimate later
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setMode('list'); setError(''); setSaveLabel('') }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500"
                    onClick={handleSave}
                    disabled={saving || !saveLabel.trim()}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Estimate'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfirm?.label}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Load Confirmation Dialog (when unsaved data exists) */}
      <AlertDialog open={!!loadConfirm} onOpenChange={(v) => !v && setLoadConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              You have unsaved changes in the current estimate. Loading a saved estimate will replace all current data. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => loadConfirm && handleLoad(loadConfirm.id)}>
              Load Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
