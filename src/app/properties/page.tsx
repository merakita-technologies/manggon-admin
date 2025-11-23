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
  Users, 
  Eye,
  Edit,
  MoreHorizontal,
  Building,
  Home,
  House,
  Trees
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Mock data with more detailed information
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
    image_urls: ['/api/placeholder/400/250'],
    total_rooms: 24,
    available_rooms: 8,
    base_price: 250,
    currency: 'USD',
    dynamic_pricing_enabled: true,
    status: 'Active',
    owner_name: 'John Resort Owner',
    created_date: '2024-01-15',
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
    image_urls: ['/api/placeholder/400/250'],
    total_rooms: 1,
    available_rooms: 1,
    base_price: 180,
    currency: 'USD',
    dynamic_pricing_enabled: false,
    status: 'Active',
    owner_name: 'Sarah Villa Owner',
    created_date: '2024-02-10',
    amenities: ['Private Pool', 'Mountain View', 'Kitchen', 'Garden']
  },
  {
    property_id: 3,
    name: 'City Center Apartment',
    type: 'Apartment',
    city: 'Jakarta',
    country: 'Indonesia',
    description: 'Modern apartment in the heart of the city with easy access to business districts.',
    rating: 4.5,
    total_reviews: 67,
    check_in_time: '14:00',
    check_out_time: '12:00',
    address: '789 Business District, Jakarta',
    image_urls: ['/api/placeholder/400/250'],
    total_rooms: 3,
    available_rooms: 0,
    base_price: 120,
    currency: 'USD',
    dynamic_pricing_enabled: true,
    status: 'Maintenance',
    owner_name: 'Mike Apartment Owner',
    created_date: '2024-03-01',
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
    image_urls: ['/api/placeholder/400/250'],
    total_rooms: 2,
    available_rooms: 2,
    base_price: 90,
    currency: 'USD',
    dynamic_pricing_enabled: false,
    status: 'Active',
    owner_name: 'David Cabin Owner',
    created_date: '2024-01-28',
    amenities: ['Forest View', 'Fireplace', 'Hiking', 'Nature']
  }
]

const propertyTypes = [
  { value: 'all', label: 'All Types', icon: Building },
  { value: 'hotel', label: 'Hotels', icon: Building },
  { value: 'villa', label: 'Villas', icon: Home },
  { value: 'apartment', label: 'Apartments', icon: House },
  { value: 'cabin', label: 'Cabins', icon: Trees }
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
  Apartment: 'outline',
  Cabin: 'destructive'
} as const

export default function PropertiesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Properties Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage hotels, villas, apartments, and other properties
            </p>
          </div>
          <Button className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7</div>
              <p className="text-xs text-muted-foreground">
                284 total reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45.2K</div>
              <p className="text-xs text-muted-foreground">
                +18% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
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

        {/* Property Type Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-auto">
            {propertyTypes.map((type) => {
              const Icon = type.icon
              return (
                <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          </TabsContent>

          {/* You can add more tab content for specific property types */}
          <TabsContent value="hotel">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.filter(p => p.type.toLowerCase() === 'hotel').map((property) => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

// Property Card Component
function PropertyCard({ property }: { property: any }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Property Image */}
      <div className="aspect-video relative bg-muted">
        <img
          src={property.image_urls[0] || '/api/placeholder/400/250'}
          alt={property.name}
          className="object-cover w-full h-full"
        />
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
              <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
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
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-tight">{property.name}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{property.city}, {property.country}</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{property.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({property.total_reviews} reviews)
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {property.description}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1 mt-3">
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

        {/* Property Details */}
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Rooms</div>
            <div className="font-medium">
              {property.available_rooms}/{property.total_rooms} available
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Price</div>
            <div className="font-medium">
              {property.currency} {property.base_price}/night
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Check-in</div>
            <div className="font-medium">{property.check_in_time}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Check-out</div>
            <div className="font-medium">{property.check_out_time}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-3 border-t">
        <div className="text-xs text-muted-foreground">
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