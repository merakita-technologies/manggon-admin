import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, User, Building } from 'lucide-react'

const bookings = [
  {
    booking_id: 1,
    user_id: 1,
    username: 'john_doe',
    property_name: 'Luxury Beach Resort',
    check_in_date: '2024-03-25',
    check_out_date: '2024-03-30',
    num_guests: 2,
    total_price: 750,
    status: 'Confirmed'
  },
  // Add more bookings...
]

const statusVariants = {
  Pending: 'secondary',
  Confirmed: 'default',
  Cancelled: 'destructive',
  Completed: 'outline'
} as const

export default function BookingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bookings Management</h1>
            <p className="text-muted-foreground">Manage and track all bookings</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.booking_id}>
                    <TableCell>#{booking.booking_id}</TableCell>
                    <TableCell>{booking.username}</TableCell>
                    <TableCell>{booking.property_name}</TableCell>
                    <TableCell>{booking.check_in_date}</TableCell>
                    <TableCell>{booking.check_out_date}</TableCell>
                    <TableCell>{booking.num_guests}</TableCell>
                    <TableCell>${booking.total_price}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[booking.status as keyof typeof statusVariants]}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}