'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  MapPin,
  Star,
  Eye,
  Edit,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Power,
  Trash2,
  Building2,
  Clock,
  Users,
} from 'lucide-react'
import { useI18n } from '@/contexts/i18n-context'

interface PropertyCardRedesignedProps {
  property: any
  onEdit: (property: any) => void
  onDelete: (property: any) => void
  onToggleStatus: (property: any) => void
  onChat: (property: any) => void
}

const statusConfig = {
  Active: { variant: 'default' as const, label: 'Aktif' },
  Inactive: { variant: 'secondary' as const, label: 'Nonaktif' },
  Maintenance: { variant: 'outline' as const, label: 'Maintenance' },
  Suspended: { variant: 'destructive' as const, label: 'Ditangguhkan' },
}

export function PropertyCardRedesigned({
  property,
  onEdit,
  onDelete,
  onToggleStatus,
  onChat,
}: PropertyCardRedesignedProps) {
  const router = useRouter()
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)

  const status = property.isActive ? 'Active' : 'Inactive'
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.Inactive
  const totalRooms = property.rooms?.length || 0
  const activeRooms = property.rooms?.filter((r: any) => r.isActive).length || 0
  const rating = property.rating?.toFixed(1) || '0.0'
  const reviewCount = property.reviewCount || 0

  // Get top amenities for quick view
  const topAmenities = property.amenities?.slice(0, 4) || []
  const hasMoreAmenities = (property.amenities?.length || 0) > 4

  return (
    <Card className="group overflow-hidden border transition-all duration-200 hover:shadow-md">
        {/* Image Section - Enhanced */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {property.imageUrls && property.imageUrls.length > 0 ? (
            <img
              src={property.imageUrls[0]}
              alt={property.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Status Badge - Top Left */}
          <div className="absolute left-3 top-3">
            <Badge variant={statusInfo.variant} className="font-medium shadow-sm">
              {statusInfo.label}
            </Badge>
          </div>

          {/* Property Type Badge - Top Right */}
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm font-medium">
              {property.propertyType || 'Property'}
            </Badge>
          </div>

          {/* More Menu - Bottom Right */}
          <div className="absolute bottom-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm p-0 shadow-sm hover:bg-background"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(property)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Properti
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleStatus(property)}>
                  <Power className="mr-2 h-4 w-4" />
                  {property.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </DropdownMenuItem>
                {property.owner?.id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onChat(property)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat Owner
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(property)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Properti
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Section - Cleaner */}
        <CardHeader className="space-y-3 pb-3">
          {/* Title & Location */}
          <div className="space-y-1.5">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight">
              {property.name}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">
                {property.city}, {property.country}
              </span>
            </div>
          </div>

          {/* Rating & Reviews - Compact */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{rating}</span>
            </div>
            {reviewCount > 0 && (
              <span className="text-sm text-muted-foreground">
                ({reviewCount} {reviewCount === 1 ? 'ulasan' : 'ulasan'})
              </span>
            )}
          </div>
        </CardHeader>

        {/* Quick Info - Collapsible */}
        <CardContent className="space-y-3 pb-3">
          {/* Availability Summary */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Ketersediaan Kamar</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">
                {activeRooms}/{totalRooms}
              </div>
              <div className="text-xs text-muted-foreground">tersedia</div>
            </div>
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <div className="space-y-3 rounded-lg border bg-muted/20 p-3 animate-in slide-in-from-top-2">
              {/* Check-in/out Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Check-in</span>
                  </div>
                  <div className="text-sm font-medium">
                    {property.checkInTime || '14:00'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Check-out</span>
                  </div>
                  <div className="text-sm font-medium">
                    {property.checkOutTime || '12:00'}
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {topAmenities.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Fasilitas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {topAmenities.map((amenity: string, idx: number) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {amenity}
                      </Badge>
                    ))}
                    {hasMoreAmenities && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs font-normal">
                            +{property.amenities.length - 4}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            {property.amenities.slice(4).map((amenity: string, idx: number) => (
                              <div key={idx} className="text-sm">
                                {amenity}
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}

              {/* Owner Info */}
              {property.owner && (
                <div className="space-y-1 border-t pt-2">
                  <div className="text-xs font-medium text-muted-foreground">Pemilik</div>
                  <div className="text-sm font-medium">
                    {property.owner.fullName || property.owner.email || 'Tidak diketahui'}
                  </div>
                </div>
              )}

              {/* Dynamic Pricing Badge */}
              {property.dynamicPricingEnabled && (
                <Badge variant="default" className="w-fit text-xs">
                  Harga Dinamis Aktif
                </Badge>
              )}
            </div>
          )}

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                Sembunyikan Detail
              </>
            ) : (
              <>
                <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                Tampilkan Detail
              </>
            )}
          </Button>
        </CardContent>

        {/* Actions - Clear Hierarchy */}
        <CardFooter className="flex flex-col gap-2 border-t pt-4">
          {/* Primary Action */}
          <Button
            className="w-full font-medium"
            onClick={() => router.push(`/rooms?property=${property.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Lihat Kamar
          </Button>

          {/* Secondary Actions */}
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(property)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {property.owner?.id && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onChat(property)}
                    className="shrink-0"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Chat dengan Owner</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardFooter>
      </Card>
  )
}
