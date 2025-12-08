import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  MoreHorizontal,
  Building,
  Home,
  Trees,
  Eye,
  Edit
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const properties = [
  {
    property_id: 1,
    name: 'Luxury Beach Resort & Spa',
    type: 'Hotel',
    city: 'Bali',
    country: 'Indonesia',
    description: 'A beautiful beachfront resort with premium amenities and stunning ocean views.',
    rating: 4.8,
    total_reviews: 124,
    check_in_time: '14:00',
    check_out_time: '12:00',
    address: '123 Beach Road, Seminyak',
    total_rooms: 24,
    available_rooms: 8,
    base_price: 250,
    currency: 'USD',
    dynamic_pricing_enabled: true,
    status: 'Active',
    owner_name: 'John Resort Owner',
    amenities: ['Pool', 'Spa', 'Restaurant', 'Beachfront', 'Free WiFi']
  },
  {
    property_id: 2,
    name: 'Mountain View Villa',
    type: 'Villa',
    city: 'Ubud',
    country: 'Indonesia',
    description: 'Private villa with panoramic mountain views and personal pool.',
    rating: 4.9,
    total_reviews: 89,
    check_in_time: '15:00',
    check_out_time: '11:00',
    address: '456 Mountain Street, Ubud',
    total_rooms: 1,
    available_rooms: 1,
    base_price: 180,
    currency: 'USD',
    dynamic_pricing_enabled: false,
    status: 'Active',
    owner_name: 'Sarah Villa Owner',
    amenities: ['Private Pool', 'Mountain View', 'Kitchen', 'Garden']
  },
  {
    property_id: 3,
    name: 'City Center Apartment',
    type: 'Home',
    city: 'Jakarta',
    country: 'Indonesia',
    description: 'Modern apartment in the heart of the city with easy access to business districts.',
    rating: 4.5,
    total_reviews: 67,
    check_in_time: '14:00',
    check_out_time: '12:00',
    address: '789 Business District, Jakarta',
    total_rooms: 3,
    available_rooms: 0,
    base_price: 120,
    currency: 'USD',
    dynamic_pricing_enabled: true,
    status: 'Maintenance',
    owner_name: 'Mike Apartment Owner',
    amenities: ['City View', 'Gym', 'Parking', 'Concierge']
  },
  {
    property_id: 4,
    name: 'Forest Cabin Retreat',
    type: 'Cabin',
    city: 'Bandung',
    country: 'Indonesia',
    description: 'Cozy cabin surrounded by nature, perfect for a peaceful getaway.',
    rating: 4.7,
    total_reviews: 45,
    check_in_time: '16:00',
    check_out_time: '10:00',
    address: '321 Forest Lane, Bandung',
    total_rooms: 2,
    available_rooms: 2,
    base_price: 90,
    currency: 'USD',
    dynamic_pricing_enabled: false,
    status: 'Active',
    owner_name: 'David Cabin Owner',
    amenities: ['Forest View', 'Fireplace', 'Hiking', 'Nature']
  }
]

const statusVariants = {
  Active: 'default',
  Maintenance: 'secondary',
  Inactive: 'outline',
  Suspended: 'destructive'
} as const

const typeVariants = {
  Hotel: 'default',
  Villa: 'secondary',
  Cabin: 'destructive'
} as const

export default function PropertiesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Properties Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage hotels, villas, apartments, and other properties
            </p>
          </div>
          <Button className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Properties</CardTitle>
                <CardDescription>
                  Manage and view all properties in the system
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search properties..."
                    className="w-full sm:w-[200px] pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Properties Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.property_id} property={property} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function PropertyCard({ property }: { property: any }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200">
      {/* Property Image */}
      <div className="aspect-video relative bg-gradient-to-br from-blue-400 to-purple-500">
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={statusVariants[property.status as keyof typeof statusVariants]}>
            {property.status}
          </Badge>
          <Badge variant={typeVariants[property.type as keyof typeof typeVariants]}>
            {property.type}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-lg leading-tight">{property.name}</CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{property.city}, {property.country}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-foreground">{property.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({property.total_reviews} reviews)
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {property.description}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1 mb-4">
          {property.amenities.slice(0, 3).map((amenity: string) => (
            <Badge key={amenity} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {property.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{property.amenities.length - 3} more
            </Badge>
          )}
        </div>

        {/* Property Details Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">Rooms</div>
            <div className="font-semibold text-foreground">
              {property.available_rooms}/{property.total_rooms} available
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">Price</div>
            <div className="font-semibold text-foreground">
              {property.currency} {property.base_price}/night
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">Check-in</div>
            <div className="font-semibold text-foreground">{property.check_in_time}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground text-xs font-medium">Check-out</div>
            <div className="font-semibold text-foreground">{property.check_out_time}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-rows-2 gap-4 pt-3 border-t">
        <div className="flex justify-between text-xs text-muted-foreground">
          Owner: {property.owner_name}
        </div>
        <div className="flex items-center gap-2">
          {property.dynamic_pricing_enabled && (
            <Badge variant="default" className="text-xs">
              Dynamic Pricing
            </Badge>
          )}
          <Button size="sm">Manage</Button>
        </div>
      </CardFooter>
    </Card>
  )
}