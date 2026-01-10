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
  Eye,
  ArrowRight,
  Info,
  Navigation,
  AlertTriangle,
  Map
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
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Tertunda</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Disetujui</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCoordinates = (lat: number | string, lng: number | string) => {
    // Convert to number if it's a string or decimal
    const latNum = typeof lat === 'string' ? parseFloat(lat) : Number(lat)
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : Number(lng)
    return `${latNum.toFixed(6)}, ${lngNum.toFixed(6)}`
  }

  const calculateDistance = (lat1: number | string, lng1: number | string, lat2: number | string, lng2: number | string) => {
    // Convert to number if it's a string or decimal
    const lat1Num = typeof lat1 === 'string' ? parseFloat(lat1) : Number(lat1)
    const lng1Num = typeof lng1 === 'string' ? parseFloat(lng1) : Number(lng1)
    const lat2Num = typeof lat2 === 'string' ? parseFloat(lat2) : Number(lat2)
    const lng2Num = typeof lng2 === 'string' ? parseFloat(lng2) : Number(lng2)
    
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2Num - lat1Num) * Math.PI / 180
    const dLng = (lng2Num - lng1Num) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1Num * Math.PI / 180) * Math.cos(lat2Num * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return parseFloat((R * c).toFixed(2)) // Distance in km
  }

  const getDistanceImpact = (distance: number) => {
    if (distance > 100) {
      return { level: 'high', label: 'Perubahan Signifikan', message: 'Lintas kota / provinsi — berdampak besar pada visibilitas dan booking' }
    } else if (distance > 50) {
      return { level: 'medium', label: 'Perubahan Menengah', message: 'Perubahan lokasi lintas kota' }
    } else if (distance > 10) {
      return { level: 'low', label: 'Perubahan Lokal', message: 'Perubahan dalam area yang sama' }
    } else {
      return { level: 'minimal', label: 'Penyesuaian Kecil', message: 'Penyesuaian koordinat minor' }
    }
  }

  const isReasonGeneric = (reason?: string) => {
    if (!reason) return true
    const genericPatterns = ['perbaikan', 'koreksi', 'update', 'ubah', 'edit', 'fix']
    const lowerReason = reason.toLowerCase()
    return genericPatterns.some(pattern => lowerReason.includes(pattern)) && reason.length < 30
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
            <Button onClick={fetchRequests}>Coba Lagi</Button>
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
          <h1 className="text-3xl font-bold">Permintaan Perubahan Lokasi</h1>
          <p className="text-gray-600 mt-2">
            Tinjau dan setujui/tolak permintaan perubahan lokasi dari pemilik properti
          </p>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Permintaan Tertunda ({pendingRequests.length})</h2>
            <div className="grid gap-6">
              {pendingRequests.map((request) => {
                const distance = calculateDistance(request.oldLatitude, request.oldLongitude, request.newLatitude, request.newLongitude)
                const impact = getDistanceImpact(distance)
                const reasonIsGeneric = isReasonGeneric(request.reason)
                
                return (
                  <Card key={request.id} className="border-2 border-l-4 border-l-blue-500 shadow-lg">
                    {/* Header Section - Property Name with Status */}
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                              <MapPin className="w-6 h-6 text-blue-600" />
                              {request.property.name}
                            </CardTitle>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {request.property.address}, {request.property.city}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                            <Info className="w-4 h-4" />
                            <span>Perubahan lokasi dapat memengaruhi booking, pajak, dan visibilitas properti</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Location Comparison - Side by Side */}
                      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Current Location */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                              <Label className="text-sm font-semibold text-gray-700">Lokasi Saat Ini</Label>
                            </div>
                            <div className="bg-white rounded-md p-3 border border-gray-200">
                              <p className="font-semibold text-gray-900">{request.property.city}</p>
                              <p className="text-xs text-gray-500 font-mono mt-1">{formatCoordinates(request.oldLatitude, request.oldLongitude)}</p>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="flex items-center justify-center">
                            <ArrowRight className="w-8 h-8 text-gray-400" />
                          </div>

                          {/* New Location */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                              <Label className="text-sm font-semibold text-gray-700">Lokasi Baru</Label>
                            </div>
                            <div className="bg-blue-50 rounded-md p-3 border-2 border-blue-300">
                              <p className="font-semibold text-blue-900">{request.property.city}</p>
                              <p className="text-xs text-blue-600 font-mono mt-1">{formatCoordinates(request.newLatitude, request.newLongitude)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Distance Display - Prominent */}
                        <div className="mt-6 pt-6 border-t border-gray-300">
                          <div className="flex items-baseline justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Navigation className="w-5 h-5 text-blue-600" />
                                <Label className="text-sm font-medium text-gray-600">Jarak Perubahan</Label>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-gray-900">{distance.toLocaleString('id-ID')}</span>
                                <span className="text-lg text-gray-600 font-medium">km</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant="outline" 
                                className={`${
                                  impact.level === 'high' ? 'bg-red-50 text-red-700 border-red-300' :
                                  impact.level === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                                  impact.level === 'low' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                  'bg-gray-50 text-gray-700 border-gray-300'
                                }`}
                              >
                                {impact.label}
                              </Badge>
                              <p className="text-xs text-gray-600 mt-2 max-w-[200px]">{impact.message}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reason Section */}
                      {request.reason && (
                        <div className={`rounded-lg p-4 border-2 ${reasonIsGeneric ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-start gap-2 mb-2">
                            <Label className="text-sm font-semibold text-gray-700">Alasan Permintaan</Label>
                            {reasonIsGeneric && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Alasan kurang spesifik
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mb-2">{request.reason}</p>
                          {reasonIsGeneric && (
                            <p className="text-xs text-yellow-700 italic flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              Pertimbangkan verifikasi tambahan sebelum menyetujui
                            </p>
                          )}
                        </div>
                      )}

                      {/* Meta Information - Secondary */}
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 border-t pt-4">
                        <div>
                          <Label className="text-xs text-gray-500">Diajukan Oleh</Label>
                          <p className="font-medium text-gray-900 mt-1">{request.requestedBy.fullName}</p>
                          <p className="text-xs text-gray-500">{request.requestedBy.email}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Waktu Permintaan</Label>
                          <p className="font-medium text-gray-900 mt-1">
                            {new Date(request.createdAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons - Decision First */}
                      <div className="border-t pt-6 space-y-3">
                        <p className="text-xs text-gray-500 mb-4">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Aksi ini akan langsung memperbarui lokasi properti dan berdampak pada sistem terkait
                        </p>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              setSelectedRequest(request)
                              setIsApproveDialogOpen(true)
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            size="lg"
                          >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Setujui
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRequest(request)
                              setIsRejectDialogOpen(true)
                            }}
                            variant="destructive"
                            className="flex-1 font-semibold"
                            size="lg"
                          >
                            <XCircle className="w-5 h-5 mr-2" />
                            Tolak
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const url = `https://www.google.com/maps?q=${request.newLatitude},${request.newLongitude}`
                              window.open(url, '_blank')
                            }}
                            className="border-gray-300"
                          >
                            <Map className="w-4 h-4 mr-2" />
                            Lihat Peta
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Permintaan yang Telah Diproses ({processedRequests.length})</h2>
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
                          <Label className="text-xs text-gray-600">Lokasi Sebelumnya</Label>
                          <p className="font-mono">{formatCoordinates(request.oldLatitude, request.oldLongitude)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">Lokasi Baru</Label>
                          <p className="font-mono">{formatCoordinates(request.newLatitude, request.newLongitude)}</p>
                        </div>
                      </div>
                      {request.reviewNotes && (
                        <div>
                          <Label className="text-xs text-gray-600">Catatan Review</Label>
                          <p>{request.reviewNotes}</p>
                        </div>
                      )}
                      {request.reviewedBy && (
                        <div>
                          <Label className="text-xs text-gray-600">
                            {request.status === 'approved' ? 'Disetujui' : 'Ditolak'} Oleh
                          </Label>
                          <p>{request.reviewedBy.fullName} pada {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString('id-ID') : ''}</p>
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
              <p className="text-gray-600">Tidak ada permintaan perubahan lokasi</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Setujui Perubahan Lokasi</DialogTitle>
            <DialogDescription className="text-base">
              Apakah Anda yakin ingin menyetujui perubahan lokasi ini? Lokasi properti akan diperbarui secara langsung dan akan berdampak pada sistem terkait.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <Label className="text-xs text-gray-500 font-medium">Properti</Label>
                  <p className="font-semibold text-gray-900 mt-1">{selectedRequest.property.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{selectedRequest.property.city}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div>
                    <Label className="text-xs text-gray-500">Lokasi Saat Ini</Label>
                    <p className="font-mono text-xs text-gray-700 mt-1">{formatCoordinates(selectedRequest.oldLatitude, selectedRequest.oldLongitude)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Lokasi Baru</Label>
                    <p className="font-mono text-xs text-gray-700 mt-1">{formatCoordinates(selectedRequest.newLatitude, selectedRequest.newLongitude)}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {calculateDistance(selectedRequest.oldLatitude, selectedRequest.oldLongitude, selectedRequest.newLatitude, selectedRequest.newLongitude).toLocaleString('id-ID')}
                    </span>
                    <span className="text-sm text-gray-600">km</span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="approve-notes" className="text-sm font-medium">Catatan Review (Opsional)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Tambahkan catatan tentang persetujuan ini..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={isProcessing}>
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Setujui
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Tolak Perubahan Lokasi</DialogTitle>
            <DialogDescription className="text-base">
              Harap berikan alasan penolakan untuk permintaan perubahan lokasi ini. Alasan ini akan dikirimkan kepada pemilik properti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <Label className="text-xs text-gray-500 font-medium">Properti</Label>
                <p className="font-semibold text-gray-900 mt-1">{selectedRequest.property.name}</p>
                <p className="text-xs text-gray-600 mt-1">{selectedRequest.property.city}</p>
              </div>
            )}
            <div>
              <Label htmlFor="reject-notes" className="text-sm font-medium">
                Alasan Penolakan <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reject-notes"
                placeholder="Jelaskan mengapa permintaan perubahan lokasi ini ditolak..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                required
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Alasan wajib diisi untuk transparansi dengan pemilik properti</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isProcessing}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !reviewNotes.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
