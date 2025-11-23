import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

// Mock data
const users = [
  {
    user_id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    full_name: 'John Doe',
    phone_number: '+1234567890',
    registration_date: '2024-01-15',
    last_login: '2024-03-20',
    loyalty_points: 1500
  },
  {
    user_id: 2,
    username: 'jane_smith',
    email: 'jane@example.com',
    full_name: 'Jane Smith',
    phone_number: '+1234567891',
    registration_date: '2024-02-10',
    last_login: '2024-03-19',
    loyalty_points: 800
  },
]

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Users Management</h1>
            <p className="text-muted-foreground mt-1">Manage system users and their data</p>
          </div>
          <Button className="sm:w-auto w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              className="w-full"
            />
          </div>
          <Button variant="outline" className="sm:w-auto w-full">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">ID</TableHead>
                      <TableHead className="whitespace-nowrap">Username</TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Full Name</TableHead>
                      <TableHead className="whitespace-nowrap">Phone</TableHead>
                      <TableHead className="whitespace-nowrap">Registration</TableHead>
                      <TableHead className="whitespace-nowrap">Last Login</TableHead>
                      <TableHead className="whitespace-nowrap">Loyalty Points</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="whitespace-nowrap">{user.user_id}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.username}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.full_name}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.phone_number}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.registration_date}</TableCell>
                        <TableCell className="whitespace-nowrap">{user.last_login}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary">{user.loyalty_points}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}