'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface LocationChangeRequest {
  id: string
  propertyId: string
  property: {
    id: string
    name: string
    address: string
    city: string
  }
  requestedBy: {
    id: string
    fullName: string
    email: string
  }
  oldLatitude: number
  oldLongitude: number
  newLatitude: number
  newLongitude: number
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
  reviewedBy?: {
    id: string
    fullName: string
  }
  reviewedAt?: string
  reviewNotes?: string
  createdAt: string
}

export default function LocationChangeRequestsPage() {
  const [requests, setRequests] = useState<LocationChangeRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<LocationChangeRequest | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.get<LocationChangeRequest[]>('/location-change-requests')
      setRequests(data)
    } catch (err: any) {
      console.error('Error fetching location change requests:', err)
      setError(err.message || 'Failed to load location change requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      await apiClient.put(`/location-change-requests/${selectedRequest.id}/approve`, {
        reviewNotes: reviewNotes || undefined,
      })
      setIsApproveDialogOpen(false)
      setReviewNotes('')
      setSelectedRequest(null)
      await fetchRequests()
    } catch (err: any) {
      console.error('Error approving request:', err)
      alert(err.message || 'Failed to approve request')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      await apiClient.put(`/location-change-requests/${selectedRequest.id}/reject`, {
        reviewNotes: reviewNotes || undefined,
      })
      setIsRejectDialogOpen(false)
      setReviewNotes('')
      setSelectedRequest(null)
      await fetchRequests()
    } catch (err: any) {
      console.error('Error rejecting request:', err)
      alert(err.message || 'Failed to reject request')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return (R * c).toFixed(2) // Distance in km
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchRequests}>Retry</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Location Change Requests</h1>
          <p className="text-gray-600 mt-2">
            Review and approve/reject location change requests from property owners
          </p>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          {request.property.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {request.property.address}, {request.property.city}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Current Location</Label>
                          <p className="text-sm font-mono mt-1">{formatCoordinates(request.oldLatitude, request.oldLongitude)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">New Location</Label>
                          <p className="text-sm font-mono mt-1">{formatCoordinates(request.newLatitude, request.newLongitude)}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Distance</Label>
                        <p className="text-sm mt-1">
                          {calculateDistance(request.oldLatitude, request.oldLongitude, request.newLatitude, request.newLongitude)} km
                        </p>
                      </div>
                      {request.reason && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Reason</Label>
                          <p className="text-sm mt-1">{request.reason}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Requested By</Label>
                        <p className="text-sm mt-1">{request.requestedBy.fullName} ({request.requestedBy.email})</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Requested At</Label>
                        <p className="text-sm mt-1">{new Date(request.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsApproveDialogOpen(true)
                          }}
                          className="flex-1"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsRejectDialogOpen(true)
                          }}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${request.newLatitude},${request.newLongitude}`
                            window.open(url, '_blank')
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View on Map
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Processed Requests ({processedRequests.length})</h2>
            <div className="grid gap-4">
              {processedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          {request.property.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {request.property.address}, {request.property.city}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600">Previous</Label>
                          <p className="font-mono">{formatCoordinates(request.oldLatitude, request.oldLongitude)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">New</Label>
                          <p className="font-mono">{formatCoordinates(request.newLatitude, request.newLongitude)}</p>
                        </div>
                      </div>
                      {request.reviewNotes && (
                        <div>
                          <Label className="text-xs text-gray-600">Review Notes</Label>
                          <p>{request.reviewNotes}</p>
                        </div>
                      )}
                      {request.reviewedBy && (
                        <div>
                          <Label className="text-xs text-gray-600">
                            {request.status === 'approved' ? 'Approved' : 'Rejected'} By
                          </Label>
                          <p>{request.reviewedBy.fullName} on {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : ''}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No location change requests found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Location Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this location change? The property location will be updated immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="space-y-2 text-sm">
                <div>
                  <Label className="text-xs text-gray-600">Property</Label>
                  <p className="font-medium">{selectedRequest.property.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600">Current</Label>
                    <p className="font-mono text-xs">{formatCoordinates(selectedRequest.oldLatitude, selectedRequest.oldLongitude)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">New</Label>
                    <p className="font-mono text-xs">{formatCoordinates(selectedRequest.newLatitude, selectedRequest.newLongitude)}</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="approve-notes">Review Notes (Optional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Add any notes about this approval..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Location Change</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this location change request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="space-y-2 text-sm">
                <div>
                  <Label className="text-xs text-gray-600">Property</Label>
                  <p className="font-medium">{selectedRequest.property.name}</p>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="reject-notes">Rejection Reason *</Label>
              <Textarea
                id="reject-notes"
                placeholder="Please explain why this location change is being rejected..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !reviewNotes.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
