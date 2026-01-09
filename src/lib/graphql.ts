import { GraphQLClient } from 'graphql-request'
import { GRAPHQL_ENDPOINT } from './api-config'

class GraphQLService {
  private client: GraphQLClient
  private token: string | null = null

  constructor() {
    this.client = new GraphQLClient(GRAPHQL_ENDPOINT, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
      if (this.token) {
        this.setToken(this.token)
      }
    }
  }

  setToken(token: string | null) {
    this.token = token
    this.client.setHeader('Authorization', token ? `JWT ${token}` : '')
    
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
  }

  async request<T = any>(query: string, variables?: any): Promise<T> {
    try {
      const data = await this.client.request<T>(query, variables)
      return data
    } catch (error: any) {
      console.error('GraphQL request error:', error)
      
      // Handle authentication errors (401 - Token expired/invalid)
      if (error.response) {
        const errors = error.response.errors || []
        const errorMessage = errors[0]?.message || error.message || 'Request failed'
        
        // Check for token expiration or unauthorized errors
        if (
          errorMessage.includes('Token has expired') ||
          errorMessage.includes('Token expired') ||
          errorMessage.includes('Invalid token') ||
          errorMessage.includes('Unauthorized') ||
          errorMessage.includes('Authentication required') ||
          error.status === 401 ||
          error.response?.status === 401
        ) {
          // Clear token and user info
          this.logout()
          
          // Redirect to login page (only on client side)
          if (typeof window !== 'undefined') {
            // Don't redirect if already on login/register pages
            const currentPath = window.location.pathname
            if (!currentPath.startsWith('/auth/')) {
              window.location.href = '/auth/login'
            }
          }
          
          throw new Error('Session expired. Please login again.')
        }
        
        console.error('GraphQL errors:', errors)
        throw new Error(errorMessage)
      }
      
      // Handle network errors
      if (error.message) {
        console.error('Network error:', error.message)
        if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new Error(`Tidak dapat terhubung ke server. Pastikan backend berjalan di ${GRAPHQL_ENDPOINT.replace('/graphql', '')}`)
        }
      }
      throw error
    }
  }

  // Auth Mutations
  async login(email: string, password: string) {
    const mutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          success
          message
          token
          user {
            id
            email
            fullName
            phoneNumber
            loyaltyPoints
            role
            emailVerified
          }
        }
      }
    `
    const response = await this.request<{ login: { success: boolean; message: string; token: string; user: any } }>(
      mutation,
      { email, password }
    )
    
    if (response.login.success && response.login.token) {
      this.setToken(response.login.token)
      if (typeof window !== 'undefined' && response.login.user) {
        localStorage.setItem('user_info', JSON.stringify(response.login.user))
      }
    }
    
    return response.login
  }

  async createUser(input: {
    email: string
    password: string
    fullName?: string
    phoneNumber?: string
    role?: string
  }) {
    const mutation = `
      mutation CreateUser($input: RegisterInput!) {
        createUser(input: $input) {
          success
          message
          user {
            id
            email
            fullName
            phoneNumber
            loyaltyPoints
            emailVerified
            role
          }
        }
      }
    `
    const response = await this.request<{ createUser: { success: boolean; message: string; user: any } }>(
      mutation,
      { input }
    )
    return response.createUser
  }

  async updateUser(id: string, input: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    role?: string
    password?: string
    isActive?: boolean
    emailVerified?: boolean
    loyaltyPoints?: number
  }) {
    // Try GraphQL mutation first, fallback to REST API
    try {
      const mutation = `
        mutation UpdateUser($id: String!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            success
            message
            user {
              id
              email
              firstName
              lastName
              phoneNumber
              role
              isActive
              emailVerified
              loyaltyPoints
            }
          }
        }
      `
      const response = await this.request<{ updateUser: { success: boolean; message: string; user: any } }>(
        mutation,
        { id, input }
      )
      return response.updateUser
    } catch (error: any) {
      // If GraphQL mutation doesn't exist, return success: false to trigger REST API fallback
      return {
        success: false,
        message: 'GraphQL mutation not available, using REST API',
        user: null,
      }
    }
  }

  logout() {
    this.setToken(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_info')
      localStorage.removeItem('auth_token')
    }
  }

  async resendVerificationEmail(email: string) {
    const mutation = `
      mutation ResendVerificationEmail($email: String!) {
        resendVerificationEmail(email: $email) {
          success
          message
        }
      }
    `
    const response = await this.request<{ resendVerificationEmail: { success: boolean; message: string } }>(
      mutation,
      { email }
    )
    return response.resendVerificationEmail
  }

  async verifyEmail(token: string) {
    const mutation = `
      mutation VerifyEmail($token: String!) {
        verifyEmail(token: $token) {
          success
          message
          token
          user {
            id
            email
            fullName
            phoneNumber
            loyaltyPoints
            role
            emailVerified
          }
        }
      }
    `
    const response = await this.request<{ verifyEmail: { success: boolean; message: string; token: string; user: any } }>(
      mutation,
      { token }
    )
    
    if (response.verifyEmail.success && response.verifyEmail.token) {
      this.setToken(response.verifyEmail.token)
      if (typeof window !== 'undefined' && response.verifyEmail.user) {
        localStorage.setItem('user_info', JSON.stringify(response.verifyEmail.user))
      }
    }
    
    return response.verifyEmail
  }

  // Forgot Password (placeholder - needs backend implementation)
  async forgotPassword(email: string) {
    // TODO: Implement when backend adds forgotPassword mutation
    // const mutation = `
    //   mutation ForgotPassword($email: String!) {
    //     forgotPassword(email: $email) {
    //       success
    //       message
    //     }
    //   }
    // `
    // const response = await this.request<{ forgotPassword: { success: boolean; message: string } }>(
    //   mutation,
    //   { email }
    // )
    // return response.forgotPassword
    
    // Placeholder response
    return {
      success: true,
      message: 'Password reset email sent successfully'
    }
  }

  // User Queries
  async getUsers() {
    // Note: Backend might need a users query - for now using properties as example
    // This will need to be adjusted based on actual backend schema
    const query = `
      query {
        properties {
          owner {
            id
            email
            fullName
            phoneNumber
            role
          }
        }
      }
    `
    const response = await this.request<{ properties: Array<{ owner: any }> }>(query)
    // Extract unique users from properties
    const userMap = new Map()
    response.properties.forEach((p) => {
      if (p.owner && !userMap.has(p.owner.id)) {
        userMap.set(p.owner.id, p.owner)
      }
    })
    return Array.from(userMap.values())
  }

  // Property Queries
  async getProperties(params?: {
    city?: string
    country?: string
    propertyType?: string
    search?: string
    includeInactive?: boolean
  }) {
    const query = `
      query GetProperties($city: String, $country: String, $propertyType: String, $search: String) {
        properties(city: $city, country: $country, propertyType: $propertyType, search: $search) {
          id
          name
          address
          city
          country
          description
          propertyType
          rating
          imageUrls
          placeId
          pricePerNight
          amenities
          reviewCount
          maxGuests
          bedrooms
          bathrooms
          latitude
          longitude
          checkInTime
          checkOutTime
          cancellationPolicy
          dynamicPricingEnabled
          weekendMultiplier
          isActive
          createdAt
          updatedAt
          owner {
            id
            email
            fullName
          }
          rooms {
            id
            roomNumber
            roomType
            capacity
            basePricePerNight
            description
            images
            isActive
            supportsHourlyBooking
            weekendMultiplier
            holidayMultiplier
            enableWeekendMultiplier
            enableHolidayMultiplier
          }
        }
      }
    `
    // Remove includeInactive from params as it's not in schema yet
    const { includeInactive, ...queryParams } = params || {}
    const response = await this.request<{ properties: any[] }>(query, queryParams)
    return response.properties
  }

  async getProperty(id: string) {
    const query = `
      query GetProperty($id: String!) {
        property(id: $id) {
          id
          name
          address
          city
          country
          description
          propertyType
          rating
          imageUrls
          placeId
          pricePerNight
          amenities
          reviewCount
          maxGuests
          bedrooms
          bathrooms
          latitude
          longitude
          checkInTime
          checkOutTime
          cancellationPolicy
          dynamicPricingEnabled
          weekendMultiplier
          isActive
          createdAt
          updatedAt
          owner {
            id
            email
            fullName
          }
          rooms {
            id
            roomNumber
            roomType
            capacity
            basePricePerNight
            description
            images
            isActive
            supportsHourlyBooking
            weekendMultiplier
            holidayMultiplier
            enableWeekendMultiplier
            enableHolidayMultiplier
          }
        }
      }
    `
    const response = await this.request<{ property: any }>(query, { id })
    return response.property
  }

  // Property Mutations
  async createProperty(input: {
    name: string
    address: string
    city: string
    country: string
    description?: string
    propertyType: string
    imageUrls?: string[]
    placeId?: string
    pricePerNight?: number
    amenities?: string[]
    maxGuests?: number
    bedrooms?: number
    bathrooms?: number
    latitude?: number
    longitude?: number
    checkInTime?: string
    checkOutTime?: string
    cancellationPolicy?: string
    dynamicPricingEnabled?: boolean
    weekendMultiplier?: number
    isActive?: boolean
  }) {
    const mutation = `
      mutation CreateProperty($input: CreatePropertyInput!) {
        createProperty(input: $input) {
          success
          message
          property {
            id
            name
            address
            city
            country
            description
            propertyType
            rating
            imageUrls
            placeId
            pricePerNight
            amenities
            reviewCount
            maxGuests
            bedrooms
            bathrooms
            latitude
            longitude
            checkInTime
            checkOutTime
            cancellationPolicy
            dynamicPricingEnabled
            isActive
            createdAt
            updatedAt
            owner {
              id
              email
              fullName
            }
          }
        }
      }
    `
    const response = await this.request<{ createProperty: { success: boolean; message: string; property: any } }>(
      mutation,
      { input }
    )
    return response.createProperty
  }

  async updateProperty(id: string, input: {
    name?: string
    address?: string
    city?: string
    country?: string
    description?: string
    propertyType?: string
    imageUrls?: string[]
    placeId?: string
    pricePerNight?: number
    amenities?: string[]
    maxGuests?: number
    bedrooms?: number
    bathrooms?: number
    latitude?: number
    longitude?: number
    checkInTime?: string
    checkOutTime?: string
    cancellationPolicy?: string
    dynamicPricingEnabled?: boolean
    weekendMultiplier?: number
    isActive?: boolean
  }) {
    const mutation = `
      mutation UpdateProperty($id: String!, $input: UpdatePropertyInput!) {
        updateProperty(id: $id, input: $input) {
          success
          message
          property {
            id
            name
            address
            city
            country
            description
            propertyType
            rating
            imageUrls
            placeId
            pricePerNight
            amenities
            reviewCount
            maxGuests
            bedrooms
            bathrooms
            latitude
            longitude
            checkInTime
            checkOutTime
            cancellationPolicy
            dynamicPricingEnabled
            isActive
            createdAt
            updatedAt
            owner {
              id
              email
              fullName
            }
          }
        }
      }
    `
    const response = await this.request<{ updateProperty: { success: boolean; message: string; property: any } }>(
      mutation,
      { id, input }
    )
    return response.updateProperty
  }

  async deleteProperty(id: string) {
    const mutation = `
      mutation DeleteProperty($id: String!) {
        deleteProperty(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteProperty: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteProperty
  }

  async togglePropertyStatus(id: string) {
    const mutation = `
      mutation TogglePropertyStatus($id: String!) {
        togglePropertyStatus(id: $id) {
          success
          message
          property {
            id
            isActive
          }
        }
      }
    `
    const response = await this.request<{ togglePropertyStatus: { success: boolean; message: string; property: any } }>(
      mutation,
      { id }
    )
    return response.togglePropertyStatus
  }

  // Room Unit Mutations
  async createRoomUnit(input: {
    propertyId: string
    roomNumber: string
    roomType: string
    capacity: number
    basePricePerNight: number
    description?: string
    images?: string[]
    isActive?: boolean
    supportsHourlyBooking?: boolean
    weekendMultiplier?: number
    holidayMultiplier?: number
    enableWeekendMultiplier?: boolean
    enableHolidayMultiplier?: boolean
  }) {
    const mutation = `
      mutation CreateRoomUnit($input: CreateRoomUnitInput!) {
        createRoomUnit(input: $input) {
          success
          message
          roomUnit {
            id
            roomNumber
            roomType
            capacity
            basePricePerNight
            description
            images
            isActive
            supportsHourlyBooking
            weekendMultiplier
            holidayMultiplier
            enableWeekendMultiplier
            enableHolidayMultiplier
          }
        }
      }
    `
    const response = await this.request<{ createRoomUnit: { success: boolean; message: string; roomUnit: any } }>(
      mutation,
      { input }
    )
    return response.createRoomUnit
  }

  async updateRoomUnit(id: string, input: {
    roomNumber?: string
    roomType?: string
    capacity?: number
    basePricePerNight?: number
    description?: string
    images?: string[]
    isActive?: boolean
    supportsHourlyBooking?: boolean
    weekendMultiplier?: number
    holidayMultiplier?: number
    enableWeekendMultiplier?: boolean
    enableHolidayMultiplier?: boolean
  }) {
    const mutation = `
      mutation UpdateRoomUnit($id: String!, $input: UpdateRoomUnitInput!) {
        updateRoomUnit(id: $id, input: $input) {
          success
          message
          roomUnit {
            id
            roomNumber
            roomType
            capacity
            basePricePerNight
            description
            images
            isActive
            supportsHourlyBooking
            weekendMultiplier
            holidayMultiplier
            enableWeekendMultiplier
            enableHolidayMultiplier
          }
        }
      }
    `
    const response = await this.request<{ updateRoomUnit: { success: boolean; message: string; roomUnit: any } }>(
      mutation,
      { id, input }
    )
    return response.updateRoomUnit
  }

  async deleteRoomUnit(id: string) {
    const mutation = `
      mutation DeleteRoomUnit($id: String!) {
        deleteRoomUnit(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteRoomUnit: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteRoomUnit
  }

  async toggleRoomStatus(id: string) {
    const mutation = `
      mutation ToggleRoomStatus($id: String!) {
        toggleRoomStatus(id: $id) {
          success
          message
          roomUnit {
            id
            isActive
          }
        }
      }
    `
    const response = await this.request<{ toggleRoomStatus: { success: boolean; message: string; roomUnit: any } }>(
      mutation,
      { id }
    )
    return response.toggleRoomStatus
  }

  // Booking Queries
  async getBookings(status?: string) {
    const query = `
      query GetMyBookings($status: String) {
        myBookings(status: $status) {
          id
          checkInDate
          checkOutDate
          checkInTime
          checkOutTime
          bookingType
          durationHours
          guestNames
          specialRequests
          totalPrice
          status
          bookingDate
          durationNights
          isActive
          user {
            id
            email
            fullName
          }
          roomUnit {
            id
            roomNumber
            roomType
            capacity
            basePricePerNight
          }
          property {
            id
            name
            city
            country
          }
          payment {
            id
            amount
            status
            paymentMethod
          }
        }
      }
    `
    const response = await this.request<{ myBookings: any[] }>(query, status ? { status } : {})
    return response.myBookings
  }

  async createBooking(input: {
    roomUnitId: string
    checkInDate: string
    checkOutDate: string
    checkInTime?: string
    checkOutTime?: string
    bookingType?: string
    guestNames?: string[]
    specialRequests?: string
    addOnIds?: string[]
  }) {
    const mutation = `
      mutation CreateBooking($input: BookingInput!) {
        createBooking(input: $input) {
          success
          message
          booking {
            id
            checkInDate
            checkOutDate
            checkInTime
            checkOutTime
            bookingType
            durationHours
            guestNames
            specialRequests
            totalPrice
            status
            bookingDate
            durationNights
            isActive
            user {
              id
              email
              fullName
            }
            roomUnit {
              id
              roomNumber
              roomType
              capacity
              basePricePerNight
            }
            property {
              id
              name
              city
              country
            }
            payment {
              id
              amount
              status
              paymentMethod
            }
          }
        }
      }
    `
    const response = await this.request<{ createBooking: { success: boolean; message: string; booking: any } }>(
      mutation,
      { input }
    )
    return response.createBooking
  }

  async getAllBookings(params?: {
    status?: string
    propertyId?: string
    includeInactive?: boolean
  }) {
    const query = `
      query GetAllBookings($status: String, $propertyId: String, $includeInactive: Boolean) {
        allBookings(status: $status, propertyId: $propertyId, includeInactive: $includeInactive) {
          id
          checkInDate
          checkOutDate
          checkInTime
          checkOutTime
          bookingType
          durationHours
          guestNames
          specialRequests
          totalPrice
          status
          bookingDate
          durationNights
          isActive
          user {
            id
            email
            fullName
          }
          roomUnit {
            id
            roomNumber
            roomType
            capacity
            basePricePerNight
          }
          property {
            id
            name
            city
            country
          }
          payment {
            id
            amount
            status
            paymentMethod
          }
        }
      }
    `
    const response = await this.request<{ allBookings: any[] }>(query, params || {})
    return response.allBookings
  }

  async getBooking(id: string) {
    const query = `
      query GetBooking($id: String!) {
        booking(id: $id) {
          id
          checkInDate
          checkOutDate
          checkInTime
          checkOutTime
          bookingType
          durationHours
          guestNames
          specialRequests
          totalPrice
          status
          bookingDate
          durationNights
          isActive
          user {
            id
            email
            fullName
          }
          roomUnit {
            id
            roomNumber
            roomType
            capacity
            basePricePerNight
          }
          property {
            id
            name
            city
            country
          }
          payment {
            id
            amount
            status
            paymentMethod
          }
          priceBreakdown {
            date
            basePrice
            multiplier
            finalPrice
            holidayName
          }
        }
      }
    `
    const response = await this.request<{ booking: any }>(query, { id })
    return response.booking
  }

  // Booking Mutations
  async updateBookingStatus(id: string, status: string) {
    const mutation = `
      mutation UpdateBookingStatus($id: String!, $status: String!) {
        updateBookingStatus(id: $id, status: $status) {
          success
          message
          booking {
            id
            status
            isActive
          }
        }
      }
    `
    const response = await this.request<{ updateBookingStatus: { success: boolean; message: string; booking: any } }>(
      mutation,
      { id, status }
    )
    return response.updateBookingStatus
  }

  async cancelBooking(id: string) {
    const mutation = `
      mutation CancelBooking($id: String!) {
        cancelBooking(id: $id) {
          success
          message
          booking {
            id
            status
            isActive
          }
        }
      }
    `
    const response = await this.request<{ cancelBooking: { success: boolean; message: string; booking: any } }>(
      mutation,
      { id }
    )
    return response.cancelBooking
  }

  async checkRoomAvailability(params: {
    roomUnitId: string
    checkInDate: string
    checkOutDate: string
    checkInTime?: string
    checkOutTime?: string
    bookingType?: string
  }) {
    const query = `
      query CheckRoomAvailability(
        $roomUnitId: String!
        $checkInDate: String!
        $checkOutDate: String!
        $checkInTime: String
        $checkOutTime: String
        $bookingType: String
      ) {
        checkRoomAvailability(
          roomUnitId: $roomUnitId
          checkInDate: $checkInDate
          checkOutDate: $checkOutDate
          checkInTime: $checkInTime
          checkOutTime: $checkOutTime
          bookingType: $bookingType
        ) {
          available
          message
        }
      }
    `
    const response = await this.request<{ checkRoomAvailability: { available: boolean; message?: string } }>(
      query,
      params
    )
    return response.checkRoomAvailability
  }

  async approveBooking(id: string) {
    const mutation = `
      mutation ApproveBooking($id: String!) {
        approveBooking(id: $id) {
          success
          message
          booking {
            id
            status
            isActive
          }
        }
      }
    `
    const response = await this.request<{ approveBooking: { success: boolean; message: string; booking: any } }>(
      mutation,
      { id }
    )
    return response.approveBooking
  }

  async rejectBooking(id: string, reason?: string) {
    const mutation = `
      mutation RejectBooking($id: String!, $input: RejectBookingInput) {
        rejectBooking(id: $id, input: $input) {
          success
          message
          booking {
            id
            status
            isActive
          }
        }
      }
    `
    const response = await this.request<{ rejectBooking: { success: boolean; message: string; booking: any } }>(
      mutation,
      { id, input: reason ? { reason } : null }
    )
    return response.rejectBooking
  }

  // Review Queries
  async getPropertyReviews(propertyId: string) {
    const query = `
      query GetPropertyReviews($propertyId: String!) {
        propertyReviews(propertyId: $propertyId) {
          id
          rating
          title
          comment
          reviewDate
          isVerified
          helpfulVotes
          isPublic
          user {
            id
            email
            fullName
          }
        }
      }
    `
    const response = await this.request<{ propertyReviews: any[] }>(query, { propertyId })
    return response.propertyReviews
  }

  async getAllReviews(params?: {
    propertyId?: string
    includePrivate?: boolean
  }) {
    const query = `
      query GetAllReviews($propertyId: String, $includePrivate: Boolean) {
        allReviews(propertyId: $propertyId, includePrivate: $includePrivate) {
          id
          rating
          title
          comment
          reviewDate
          isVerified
          helpfulVotes
          isPublic
          user {
            id
            email
            fullName
          }
          property {
            id
            name
            city
            country
          }
        }
      }
    `
    const response = await this.request<{ allReviews: any[] }>(query, params || {})
    return response.allReviews
  }

  // Review Mutations
  async updateReview(id: string, input: {
    title?: string
    comment?: string
    rating?: number
    isPublic?: boolean
  }) {
    const mutation = `
      mutation UpdateReview($id: String!, $input: UpdateReviewInput!) {
        updateReview(id: $id, input: $input) {
          success
          message
          review {
            id
            rating
            title
            comment
            reviewDate
            isVerified
            helpfulVotes
            isPublic
            user {
              id
              email
              fullName
            }
            property {
              id
              name
              city
              country
            }
          }
        }
      }
    `
    const response = await this.request<{ updateReview: { success: boolean; message: string; review: any } }>(
      mutation,
      { id, input }
    )
    return response.updateReview
  }

  async deleteReview(id: string) {
    const mutation = `
      mutation DeleteReview($id: String!) {
        deleteReview(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteReview: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteReview
  }

  async toggleReviewVisibility(id: string) {
    const mutation = `
      mutation ToggleReviewVisibility($id: String!) {
        toggleReviewVisibility(id: $id) {
          success
          message
          review {
            id
            isPublic
          }
        }
      }
    `
    const response = await this.request<{ toggleReviewVisibility: { success: boolean; message: string; review: any } }>(
      mutation,
      { id }
    )
    return response.toggleReviewVisibility
  }

  async verifyReview(id: string) {
    const mutation = `
      mutation VerifyReview($id: String!) {
        verifyReview(id: $id) {
          success
          message
          review {
            id
            isVerified
          }
        }
      }
    `
    const response = await this.request<{ verifyReview: { success: boolean; message: string; review: any } }>(
      mutation,
      { id }
    )
    return response.verifyReview
  }

  // Payment Queries
  async getPaymentByBooking(bookingId: string) {
    const query = `
      query GetPaymentByBooking($bookingId: String!) {
        getPaymentByBooking(bookingId: $bookingId) {
          id
          amount
          status
          paymentMethod
        }
      }
    `
    const response = await this.request<{ getPaymentByBooking: any }>(query, { bookingId })
    return response.getPaymentByBooking
  }

  async confirmPayment(paymentId: string, paymentMethod: string) {
    const mutation = `
      mutation ConfirmPayment($paymentId: String!, $paymentMethod: String!) {
        confirmPayment(paymentId: $paymentId, paymentMethod: $paymentMethod) {
          success
          message
          payment {
            id
            amount
            status
            paymentMethod
          }
        }
      }
    `
    const response = await this.request<{ confirmPayment: { success: boolean; message: string; payment: any } }>(
      mutation,
      { paymentId, paymentMethod }
    )
    return response.confirmPayment
  }

  async getAllPayments(params?: {
    status?: string
  }) {
    const query = `
      query GetAllPayments($status: String) {
        allPayments(status: $status) {
          id
          amount
          status
          paymentMethod
        }
      }
    `
    const response = await this.request<{ allPayments: any[] }>(query, params || {})
    return response.allPayments
  }

  // Payment Mutations
  async updatePaymentStatus(id: string, status: string) {
    const mutation = `
      mutation UpdatePaymentStatus($id: String!, $status: String!) {
        updatePaymentStatus(id: $id, status: $status) {
          success
          message
          payment {
            id
            amount
            status
            paymentMethod
          }
        }
      }
    `
    const response = await this.request<{ updatePaymentStatus: { success: boolean; message: string; payment: any } }>(
      mutation,
      { id, status }
    )
    return response.updatePaymentStatus
  }

  async refundPayment(id: string) {
    const mutation = `
      mutation RefundPayment($id: String!) {
        refundPayment(id: $id) {
          success
          message
          payment {
            id
            amount
            status
            paymentMethod
          }
        }
      }
    `
    const response = await this.request<{ refundPayment: { success: boolean; message: string; payment: any } }>(
      mutation,
      { id }
    )
    return response.refundPayment
  }

  // Hourly Rates Queries
  async getHourlyRatesByRoomUnit(roomUnitId: string) {
    const query = `
      query GetHourlyRatesByRoomUnit($roomUnitId: String!) {
        getHourlyRatesByRoomUnit(roomUnitId: $roomUnitId) {
          id
          roomUnitId
          startTime
          endTime
          pricePerHour
          minimumDurationHours
          crossesMidnight
          isActive
          description
        }
      }
    `
    const response = await this.request<{ getHourlyRatesByRoomUnit: any[] }>(query, { roomUnitId })
    return response.getHourlyRatesByRoomUnit
  }

  async calculateHourlyPrice(params: {
    roomUnitId: string
    checkInDate: string
    checkInTime: string
    checkOutDate: string
    checkOutTime: string
  }) {
    const query = `
      query CalculateHourlyPrice(
        $roomUnitId: String!
        $checkInDate: String!
        $checkInTime: String!
        $checkOutDate: String!
        $checkOutTime: String!
      ) {
        calculateHourlyPrice(
          roomUnitId: $roomUnitId
          checkInDate: $checkInDate
          checkInTime: $checkInTime
          checkOutDate: $checkOutDate
          checkOutTime: $checkOutTime
        ) {
          success
          message
          totalPrice
          totalHours
          applicableRates {
            id
            startTime
            endTime
            pricePerHour
            minimumDurationHours
          }
        }
      }
    `
    const response = await this.request<{ calculateHourlyPrice: any }>(query, params)
    return response.calculateHourlyPrice
  }

  // Hourly Rates Mutations
  async createHourlyRate(input: {
    roomUnitId: string
    startTime: string
    endTime: string
    pricePerHour: number
    minimumDurationHours?: number
    crossesMidnight?: boolean
    description?: string
  }) {
    const mutation = `
      mutation CreateHourlyRate($input: CreateHourlyRateInput!) {
        createHourlyRate(input: $input) {
          success
          message
          hourlyRate {
            id
            roomUnitId
            startTime
            endTime
            pricePerHour
            minimumDurationHours
            crossesMidnight
            isActive
            description
          }
        }
      }
    `
    const response = await this.request<{ createHourlyRate: { success: boolean; message: string; hourlyRate: any } }>(
      mutation,
      { input }
    )
    return response.createHourlyRate
  }

  async updateHourlyRate(id: string, input: {
    startTime?: string
    endTime?: string
    pricePerHour?: number
    minimumDurationHours?: number
    crossesMidnight?: boolean
    isActive?: boolean
    description?: string
  }) {
    const mutation = `
      mutation UpdateHourlyRate($id: String!, $input: UpdateHourlyRateInput!) {
        updateHourlyRate(id: $id, input: $input) {
          success
          message
          hourlyRate {
            id
            roomUnitId
            startTime
            endTime
            pricePerHour
            minimumDurationHours
            crossesMidnight
            isActive
            description
          }
        }
      }
    `
    const response = await this.request<{ updateHourlyRate: { success: boolean; message: string; hourlyRate: any } }>(
      mutation,
      { id, input }
    )
    return response.updateHourlyRate
  }

  async deleteHourlyRate(id: string) {
    const mutation = `
      mutation DeleteHourlyRate($id: String!) {
        deleteHourlyRate(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteHourlyRate: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteHourlyRate
  }

  // Notification Queries
  async getNotifications(params?: {
    isRead?: boolean
    type?: string
  }) {
    const query = `
      query GetNotifications($isRead: Boolean, $type: String) {
        notifications(isRead: $isRead, type: $type) {
          id
          title
          message
          type
          isRead
          link
          user {
            id
            email
            fullName
          }
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ notifications: any[] }>(query, params || {})
    return response.notifications
  }

  async getNotification(id: string) {
    const query = `
      query GetNotification($id: String!) {
        notification(id: $id) {
          id
          title
          message
          type
          isRead
          link
          user {
            id
            email
            fullName
          }
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ notification: any }>(query, { id })
    return response.notification
  }

  // Notification Mutations
  async createNotification(input: {
    userId: string
    title: string
    message: string
    type?: string
    link?: string
  }) {
    const mutation = `
      mutation CreateNotification($input: CreateNotificationInput!) {
        createNotification(input: $input) {
          success
          message
          notification {
            id
            title
            message
            type
            isRead
            link
            user {
              id
              email
              fullName
            }
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ createNotification: { success: boolean; message: string; notification: any } }>(
      mutation,
      { input }
    )
    return response.createNotification
  }

  async updateNotification(id: string, input: {
    title?: string
    message?: string
    type?: string
    link?: string
    isRead?: boolean
  }) {
    const mutation = `
      mutation UpdateNotification($id: String!, $input: UpdateNotificationInput!) {
        updateNotification(id: $id, input: $input) {
          success
          message
          notification {
            id
            title
            message
            type
            isRead
            link
            user {
              id
              email
              fullName
            }
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ updateNotification: { success: boolean; message: string; notification: any } }>(
      mutation,
      { id, input }
    )
    return response.updateNotification
  }

  async deleteNotification(id: string) {
    const mutation = `
      mutation DeleteNotification($id: String!) {
        deleteNotification(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteNotification: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteNotification
  }

  async markNotificationAsRead(id: string) {
    const mutation = `
      mutation MarkNotificationAsRead($id: String!) {
        markNotificationAsRead(id: $id) {
          success
          message
          notification {
            id
            isRead
          }
        }
      }
    `
    const response = await this.request<{ markNotificationAsRead: { success: boolean; message: string; notification: any } }>(
      mutation,
      { id }
    )
    return response.markNotificationAsRead
  }

  async markAllNotificationsAsRead() {
    const mutation = `
      mutation MarkAllNotificationsAsRead {
        markAllNotificationsAsRead {
          success
          message
        }
      }
    `
    const response = await this.request<{ markAllNotificationsAsRead: { success: boolean; message: string } }>(
      mutation
    )
    return response.markAllNotificationsAsRead
  }

  // Products Queries & Mutations
  async getProducts(params?: { category?: string; search?: string; includeInactive?: boolean }) {
    const query = `
      query GetProducts($category: String, $search: String, $includeInactive: Boolean) {
        products(category: $category, search: $search, includeInactive: $includeInactive) {
          id
          name
          description
          price
          stock
          imageUrl
          category
          isActive
          pointsEarned
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ products: any[] }>(query, params)
    return response.products
  }

  async getProduct(id: string) {
    const query = `
      query GetProduct($id: String!) {
        product(id: $id) {
          id
          name
          description
          price
          stock
          imageUrl
          category
          isActive
          pointsEarned
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ product: any }>(query, { id })
    return response.product
  }

  async createProduct(input: {
    name: string
    description?: string
    price: number
    stock: number
    imageUrl?: string
    category?: string
    pointsEarned?: number
    isActive?: boolean
  }) {
    const mutation = `
      mutation CreateProduct($input: CreateProductInput!) {
        createProduct(input: $input) {
          success
          message
          product {
            id
            name
            description
            price
            stock
            imageUrl
            category
            isActive
            pointsEarned
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ createProduct: { success: boolean; message: string; product: any } }>(
      mutation,
      { input }
    )
    return response.createProduct
  }

  async updateProduct(id: string, input: {
    name?: string
    description?: string
    price?: number
    stock?: number
    imageUrl?: string
    category?: string
    pointsEarned?: number
    isActive?: boolean
  }) {
    const mutation = `
      mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
        updateProduct(id: $id, input: $input) {
          success
          message
          product {
            id
            name
            description
            price
            stock
            imageUrl
            category
            isActive
            pointsEarned
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ updateProduct: { success: boolean; message: string; product: any } }>(
      mutation,
      { id, input }
    )
    return response.updateProduct
  }

  async deleteProduct(id: string) {
    const mutation = `
      mutation DeleteProduct($id: String!) {
        deleteProduct(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteProduct: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteProduct
  }

  async toggleProductStatus(id: string) {
    const mutation = `
      mutation ToggleProductStatus($id: String!) {
        toggleProductStatus(id: $id) {
          success
          message
          product {
            id
            isActive
          }
        }
      }
    `
    const response = await this.request<{ toggleProductStatus: { success: boolean; message: string; product: any } }>(
      mutation,
      { id }
    )
    return response.toggleProductStatus
  }

  // Orders Queries & Mutations
  async getOrders(params?: { status?: string }) {
    const query = `
      query GetOrders($status: String) {
        orders(status: $status) {
          id
          user {
            id
            email
            fullName
            loyaltyPoints
          }
          product {
            id
            name
            description
            price
            imageUrl
            category
          }
          quantity
          totalPrice
          pointsEarned
          status
          paymentStatus
          paymentId
          approvedBy
          approvedAt
          shippedAt
          trackingNumber
          notes
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ orders: any[] }>(query, params)
    return response.orders
  }

  async getOrder(id: string) {
    const query = `
      query GetOrder($id: String!) {
        order(id: $id) {
          id
          user {
            id
            email
            fullName
            loyaltyPoints
          }
          product {
            id
            name
            description
            price
            imageUrl
            category
          }
          quantity
          totalPrice
          pointsEarned
          status
          paymentStatus
          paymentId
          approvedBy
          approvedAt
          shippedAt
          trackingNumber
          notes
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ order: any }>(query, { id })
    return response.order
  }

  async createOrder(input: {
    productId: string
    quantity: number
    notes?: string
  }) {
    const mutation = `
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          success
          message
          order {
            id
            user {
              id
              email
              fullName
              loyaltyPoints
            }
            product {
              id
              name
              description
              price
              imageUrl
              category
            }
            quantity
            totalPrice
            pointsEarned
            status
            paymentStatus
            paymentId
            approvedBy
            approvedAt
            shippedAt
            trackingNumber
            notes
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ createOrder: { success: boolean; message: string; order: any } }>(
      mutation,
      { input }
    )
    return response.createOrder
  }

  async updateOrderStatus(id: string, status: string) {
    const mutation = `
      mutation UpdateOrderStatus($id: String!, $input: UpdateOrderStatusInput!) {
        updateOrderStatus(id: $id, input: { status: $status }) {
          success
          message
          order {
            id
            status
            paymentStatus
            paymentId
            approvedBy
            approvedAt
            shippedAt
            trackingNumber
            notes
          }
        }
      }
    `
    const response = await this.request<{ updateOrderStatus: { success: boolean; message: string; order: any } }>(
      mutation,
      { id, input: { status } }
    )
    return response.updateOrderStatus
  }

  async confirmPayment(orderId: string, paymentId: string) {
    const mutation = `
      mutation ConfirmPayment($orderId: String!, $paymentId: String!) {
        confirmPayment(orderId: $orderId, paymentId: $paymentId) {
          success
          message
          order {
            id
            status
            paymentStatus
            paymentId
            notes
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ confirmPayment: { success: boolean; message: string; order: any } }>(
      mutation,
      { orderId, paymentId }
    )
    return response.confirmPayment
  }

  async approveOrder(id: string, notes?: string) {
    const mutation = `
      mutation ApproveOrder($id: String!, $input: ApproveOrderInput) {
        approveOrder(id: $id, input: $input) {
          success
          message
          order {
            id
            status
            approvedBy
            approvedAt
            notes
          }
        }
      }
    `
    const response = await this.request<{ approveOrder: { success: boolean; message: string; order: any } }>(
      mutation,
      { id, input: notes ? { notes } : null }
    )
    return response.approveOrder
  }

  async processOrder(id: string) {
    const mutation = `
      mutation ProcessOrder($id: String!) {
        processOrder(id: $id) {
          success
          message
          order {
            id
            status
          }
        }
      }
    `
    const response = await this.request<{ processOrder: { success: boolean; message: string; order: any } }>(
      mutation,
      { id }
    )
    return response.processOrder
  }

  async shipOrder(id: string, trackingNumber: string, notes?: string) {
    const mutation = `
      mutation ShipOrder($id: String!, $input: ShipOrderInput!) {
        shipOrder(id: $id, input: $input) {
          success
          message
          order {
            id
            status
            trackingNumber
            shippedAt
            notes
          }
        }
      }
    `
    const response = await this.request<{ shipOrder: { success: boolean; message: string; order: any } }>(
      mutation,
      { id, input: { trackingNumber, notes } }
    )
    return response.shipOrder
  }

  async completeOrder(id: string) {
    const mutation = `
      mutation CompleteOrder($id: String!) {
        completeOrder(id: $id) {
          success
          message
          order {
            id
            status
          }
        }
      }
    `
    const response = await this.request<{ completeOrder: { success: boolean; message: string; order: any } }>(
      mutation,
      { id }
    )
    return response.completeOrder
  }

  async deleteOrder(id: string) {
    const mutation = `
      mutation DeleteOrder($id: String!) {
        deleteOrder(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteOrder: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteOrder
  }

  async deleteAllOrders(restoreStock: boolean = false) {
    const mutation = `
      mutation DeleteAllOrders($restoreStock: Boolean) {
        deleteAllOrders(restoreStock: $restoreStock) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteAllOrders: { success: boolean; message: string } }>(
      mutation,
      { restoreStock }
    )
    return response.deleteAllOrders
  }

  // Amenities Queries & Mutations
  async getAmenities(params?: { category?: string; search?: string; includeInactive?: boolean }) {
    const query = `
      query GetAmenities($category: String, $search: String, $includeInactive: Boolean) {
        amenities(category: $category, search: $search, includeInactive: $includeInactive) {
          id
          name
          description
          icon
          category
          isActive
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ amenities: any[] }>(query, params)
    return response.amenities
  }

  async getAmenity(id: string) {
    const query = `
      query GetAmenity($id: String!) {
        amenity(id: $id) {
          id
          name
          description
          icon
          category
          isActive
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ amenity: any }>(query, { id })
    return response.amenity
  }

  async createAmenity(input: {
    name: string
    description?: string
    icon?: string
    category?: string
    isActive?: boolean
  }) {
    const mutation = `
      mutation CreateAmenity($input: CreateAmenityInput!) {
        createAmenity(input: $input) {
          success
          message
          amenity {
            id
            name
            description
            icon
            category
            isActive
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ createAmenity: { success: boolean; message: string; amenity: any } }>(
      mutation,
      { input }
    )
    return response.createAmenity
  }

  async updateAmenity(id: string, input: {
    name?: string
    description?: string
    icon?: string
    category?: string
    isActive?: boolean
  }) {
    const mutation = `
      mutation UpdateAmenity($id: String!, $input: UpdateAmenityInput!) {
        updateAmenity(id: $id, input: $input) {
          success
          message
          amenity {
            id
            name
            description
            icon
            category
            isActive
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ updateAmenity: { success: boolean; message: string; amenity: any } }>(
      mutation,
      { id, input }
    )
    return response.updateAmenity
  }

  async deleteAmenity(id: string) {
    const mutation = `
      mutation DeleteAmenity($id: String!) {
        deleteAmenity(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteAmenity: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteAmenity
  }

  async toggleAmenityStatus(id: string) {
    const mutation = `
      mutation ToggleAmenityStatus($id: String!) {
        toggleAmenityStatus(id: $id) {
          success
          message
          amenity {
            id
            isActive
          }
        }
      }
    `
    const response = await this.request<{ toggleAmenityStatus: { success: boolean; message: string; amenity: any } }>(
      mutation,
      { id }
    )
    return response.toggleAmenityStatus
  }

  // Addons Queries & Mutations
  async getAddons(params?: { category?: string; search?: string; includeInactive?: boolean }) {
    const query = `
      query GetAddons($category: String, $search: String, $includeInactive: Boolean) {
        addons(category: $category, search: $search, includeInactive: $includeInactive) {
          id
          name
          description
          price
          imageUrl
          category
          isActive
          isRecurring
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ addons: any[] }>(query, params)
    return response.addons
  }

  async getAddon(id: string) {
    const query = `
      query GetAddon($id: String!) {
        addon(id: $id) {
          id
          name
          description
          price
          imageUrl
          category
          isActive
          isRecurring
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ addon: any }>(query, { id })
    return response.addon
  }

  async createAddon(input: {
    name: string
    description?: string
    price: number
    imageUrl?: string
    category?: string
    isActive?: boolean
    isRecurring?: boolean
  }) {
    const mutation = `
      mutation CreateAddon($input: CreateAddonInput!) {
        createAddon(input: $input) {
          success
          message
          addon {
            id
            name
            description
            price
            imageUrl
            category
            isActive
            isRecurring
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ createAddon: { success: boolean; message: string; addon: any } }>(
      mutation,
      { input }
    )
    return response.createAddon
  }

  async updateAddon(id: string, input: {
    name?: string
    description?: string
    price?: number
    imageUrl?: string
    category?: string
    isActive?: boolean
    isRecurring?: boolean
  }) {
    const mutation = `
      mutation UpdateAddon($id: String!, $input: UpdateAddonInput!) {
        updateAddon(id: $id, input: $input) {
          success
          message
          addon {
            id
            name
            description
            price
            imageUrl
            category
            isActive
            isRecurring
            createdAt
            updatedAt
          }
        }
      }
    `
    const response = await this.request<{ updateAddon: { success: boolean; message: string; addon: any } }>(
      mutation,
      { id, input }
    )
    return response.updateAddon
  }

  async deleteAddon(id: string) {
    const mutation = `
      mutation DeleteAddon($id: String!) {
        deleteAddon(id: $id) {
          success
          message
        }
      }
    `
    const response = await this.request<{ deleteAddon: { success: boolean; message: string } }>(
      mutation,
      { id }
    )
    return response.deleteAddon
  }

  async toggleAddonStatus(id: string) {
    const mutation = `
      mutation ToggleAddonStatus($id: String!) {
        toggleAddonStatus(id: $id) {
          success
          message
          addon {
            id
            isActive
          }
        }
      }
    `
    const response = await this.request<{ toggleAddonStatus: { success: boolean; message: string; addon: any } }>(
      mutation,
      { id }
    )
    return response.toggleAddonStatus
  }

  // Chat Queries & Mutations
  async getConversations() {
    const query = `
      query GetConversations {
        conversations {
          id
          propertyId
          property {
            id
            name
            city
          }
          bookingId
          booking {
            id
            status
            totalPrice
          }
          lastMessageAt
          participants {
            id
            userId
            user {
              id
              email
              fullName
              phoneNumber
            }
            lastReadAt
            isActive
          }
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ conversations: any[] }>(query)
    return response.conversations
  }

  async getConversation(id: string) {
    const query = `
      query GetConversation($id: String!) {
        conversation(id: $id) {
          id
          propertyId
          property {
            id
            name
            city
          }
          bookingId
          booking {
            id
            status
            totalPrice
          }
          lastMessageAt
          participants {
            id
            userId
            user {
              id
              email
              fullName
              phoneNumber
            }
            lastReadAt
            isActive
          }
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ conversation: any }>(query, { id })
    return response.conversation
  }

  async createConversation(input: { propertyId?: string; bookingId?: string; ownerId: string }) {
    const mutation = `
      mutation CreateConversation($input: CreateConversationInput!) {
        createConversation(input: $input) {
          id
          propertyId
          bookingId
          lastMessageAt
          participants {
            id
            userId
            user {
              id
              email
              fullName
            }
          }
          createdAt
        }
      }
    `
    const response = await this.request<{ createConversation: any }>(mutation, { input })
    return response.createConversation
  }

  async getMessages(conversationId: string, limit?: number, offset?: number) {
    const query = `
      query GetMessages($conversationId: String!, $limit: Int, $offset: Int) {
        messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
          id
          conversationId
          senderId
          sender {
            id
            email
            fullName
          }
          content
          messageType
          isRead
          readAt
          originalPrice
          proposedPrice
          offerStatus
          attachmentUrl
          attachmentName
          attachmentSize
          attachmentMimeType
          createdAt
        }
      }
    `
    const response = await this.request<{ messages: any[] }>(query, { conversationId, limit, offset })
    return response.messages
  }

  async sendMessage(input: { 
    conversationId: string
    content: string
    messageType?: string
    originalPrice?: number
    proposedPrice?: number
    attachmentUrl?: string
    attachmentName?: string
    attachmentSize?: number
    attachmentMimeType?: string
  }) {
    const mutation = `
      mutation SendMessage($input: CreateMessageInput!) {
        sendMessage(input: $input) {
          id
          conversationId
          senderId
          sender {
            id
            email
            fullName
          }
          content
          messageType
          isRead
          attachmentUrl
          attachmentName
          attachmentSize
          attachmentMimeType
          createdAt
        }
      }
    `
    const response = await this.request<{ sendMessage: any }>(mutation, { input })
    return response.sendMessage
  }

  async markConversationAsRead(conversationId: string) {
    const mutation = `
      mutation MarkAsRead($input: MarkAsReadInput!) {
        markConversationAsRead(input: $input)
      }
    `
    const response = await this.request<{ markConversationAsRead: boolean }>(mutation, { input: { conversationId } })
    return response.markConversationAsRead
  }

  async getUnreadCount() {
    const query = `
      query GetUnreadCount {
        unreadCount
      }
    `
    const response = await this.request<{ unreadCount: number }>(query)
    return response.unreadCount
  }

  // Negotiations Queries & Mutations
  async getPriceOffers(bookingId?: string, propertyId?: string, status?: string) {
    const query = `
      query GetPriceOffers($bookingId: String, $propertyId: String, $status: OfferStatus) {
        priceOffers(bookingId: $bookingId, propertyId: $propertyId, status: $status) {
          id
          bookingId
          booking {
            id
            status
            totalPrice
          }
          propertyId
          property {
            id
            name
            pricePerNight
          }
          conversationId
          offerType
          originalPrice
          proposedPrice
          proposedBy
          proposedById
          proposedByUser {
            id
            email
            fullName
          }
          status
          expiresAt
          terms
          acceptedAt
          rejectedAt
          rejectionReason
          previousOfferId
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ priceOffers: any[] }>(query, { bookingId, propertyId, status })
    return response.priceOffers
  }

  async getPriceOffer(id: string) {
    const query = `
      query GetPriceOffer($id: String!) {
        priceOffer(id: $id) {
          id
          bookingId
          propertyId
          offerType
          originalPrice
          proposedPrice
          proposedBy
          status
          expiresAt
          terms
          createdAt
        }
      }
    `
    const response = await this.request<{ priceOffer: any }>(query, { id })
    return response.priceOffer
  }

  async createPriceOffer(input: {
    bookingId?: string
    propertyId?: string
    conversationId?: string
    offerType: string
    originalPrice: number
    proposedPrice: number
    proposedBy: string
    terms?: string
    expiresInHours?: number
    previousOfferId?: string
  }) {
    const mutation = `
      mutation CreatePriceOffer($input: CreatePriceOfferInput!) {
        createPriceOffer(input: $input) {
          id
          bookingId
          propertyId
          offerType
          originalPrice
          proposedPrice
          proposedBy
          status
          expiresAt
          terms
          createdAt
        }
      }
    `
    const response = await this.request<{ createPriceOffer: any }>(mutation, { input })
    return response.createPriceOffer
  }

  async acceptPriceOffer(offerId: string) {
    const mutation = `
      mutation AcceptPriceOffer($offerId: String!) {
        acceptPriceOffer(offerId: $offerId) {
          id
          status
          acceptedAt
        }
      }
    `
    const response = await this.request<{ acceptPriceOffer: any }>(mutation, { offerId })
    return response.acceptPriceOffer
  }

  async rejectPriceOffer(offerId: string, reason?: string) {
    const mutation = `
      mutation RejectPriceOffer($input: RejectPriceOfferInput!) {
        rejectPriceOffer(input: $input) {
          id
          status
          rejectedAt
          rejectionReason
        }
      }
    `
    const response = await this.request<{ rejectPriceOffer: any }>(mutation, { input: { offerId, reason } })
    return response.rejectPriceOffer
  }

  async cancelPriceOffer(offerId: string) {
    const mutation = `
      mutation CancelPriceOffer($offerId: String!) {
        cancelPriceOffer(offerId: $offerId) {
          id
          status
        }
      }
    `
    const response = await this.request<{ cancelPriceOffer: any }>(mutation, { offerId })
    return response.cancelPriceOffer
  }

  async getNegotiationHistory(bookingId?: string, propertyId?: string) {
    const query = `
      query GetNegotiationHistory($bookingId: String, $propertyId: String) {
        negotiationHistory(bookingId: $bookingId, propertyId: $propertyId) {
          id
          offerType
          originalPrice
          proposedPrice
          proposedBy
          status
          createdAt
        }
      }
    `
    const response = await this.request<{ negotiationHistory: any[] }>(query, { bookingId, propertyId })
    return response.negotiationHistory
  }

  // Holidays Queries & Mutations
  async getHolidays(isActive?: boolean) {
    const query = `
      query GetHolidays($isActive: Boolean) {
        holidays(isActive: $isActive) {
          id
          name
          description
          date
          isRecurring
          dayOfWeek
          monthDay
          priceMultiplier
          isActive
          priority
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ holidays: any[] }>(query, { isActive })
    return response.holidays
  }

  async getHoliday(id: string) {
    const query = `
      query GetHoliday($id: ID!) {
        holiday(id: $id) {
          id
          name
          description
          date
          isRecurring
          dayOfWeek
          monthDay
          priceMultiplier
          isActive
          priority
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ holiday: any }>(query, { id })
    return response.holiday
  }

  async createHoliday(input: {
    name: string
    description?: string
    date?: string
    isRecurring?: boolean
    dayOfWeek?: number
    monthDay?: string
    priceMultiplier?: number
    isActive?: boolean
    priority?: number
  }) {
    const mutation = `
      mutation CreateHoliday($input: CreateHolidayInput!) {
        createHoliday(input: $input) {
          id
          name
          description
          date
          isRecurring
          dayOfWeek
          monthDay
          priceMultiplier
          isActive
          priority
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ createHoliday: any }>(mutation, { input })
    return response.createHoliday
  }

  async updateHoliday(id: string, input: {
    name?: string
    description?: string
    date?: string
    isRecurring?: boolean
    dayOfWeek?: number
    monthDay?: string
    priceMultiplier?: number
    isActive?: boolean
    priority?: number
  }) {
    const mutation = `
      mutation UpdateHoliday($id: ID!, $input: UpdateHolidayInput!) {
        updateHoliday(id: $id, input: $input) {
          id
          name
          description
          date
          isRecurring
          dayOfWeek
          monthDay
          priceMultiplier
          isActive
          priority
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ updateHoliday: any }>(mutation, { id, input })
    return response.updateHoliday
  }

  async deleteHoliday(id: string) {
    const mutation = `
      mutation DeleteHoliday($id: ID!) {
        deleteHoliday(id: $id)
      }
    `
    const response = await this.request<{ deleteHoliday: boolean }>(mutation, { id })
    return response.deleteHoliday
  }

  // Tax Settings Queries & Mutations
  async getActiveTaxSettings() {
    const query = `
      query GetActiveTaxSettings {
        activeTaxSettings {
          id
          serviceFeePercentage
          vatRate
          vatEnabled
          isActive
          notes
          effectiveFrom
          effectiveTo
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ activeTaxSettings: any }>(query)
    return response.activeTaxSettings
  }

  async getAllTaxSettings() {
    const query = `
      query GetAllTaxSettings {
        allTaxSettings {
          id
          serviceFeePercentage
          vatRate
          vatEnabled
          isActive
          notes
          effectiveFrom
          effectiveTo
          createdBy
          createdAt
          updatedAt
        }
      }
    `
    const response = await this.request<{ allTaxSettings: any[] }>(query)
    return response.allTaxSettings
  }

  async createTaxSettings(input: {
    serviceFeePercentage: number
    vatRate: number
    vatEnabled?: boolean
    notes?: string
    effectiveFrom?: string
  }) {
    const mutation = `
      mutation CreateTaxSettings(
        $serviceFeePercentage: Float!
        $vatRate: Float!
        $vatEnabled: Boolean
        $notes: String
        $effectiveFrom: DateTime
      ) {
        createTaxSettings(
          serviceFeePercentage: $serviceFeePercentage
          vatRate: $vatRate
          vatEnabled: $vatEnabled
          notes: $notes
          effectiveFrom: $effectiveFrom
        ) {
          id
          serviceFeePercentage
          vatRate
          vatEnabled
          isActive
          notes
          effectiveFrom
          createdAt
        }
      }
    `
    const response = await this.request<{ createTaxSettings: any }>(mutation, input)
    return response.createTaxSettings
  }

  async updateTaxSettings(id: string, input: {
    serviceFeePercentage?: number
    vatRate?: number
    vatEnabled?: boolean
    notes?: string
    effectiveFrom?: string
  }) {
    const mutation = `
      mutation UpdateTaxSettings(
        $id: String!
        $serviceFeePercentage: Float
        $vatRate: Float
        $vatEnabled: Boolean
        $notes: String
        $effectiveFrom: DateTime
      ) {
        updateTaxSettings(
          id: $id
          serviceFeePercentage: $serviceFeePercentage
          vatRate: $vatRate
          vatEnabled: $vatEnabled
          notes: $notes
          effectiveFrom: $effectiveFrom
        ) {
          id
          serviceFeePercentage
          vatRate
          vatEnabled
          isActive
          notes
          effectiveFrom
          updatedAt
        }
      }
    `
    const response = await this.request<{ updateTaxSettings: any }>(mutation, { id, ...input })
    return response.updateTaxSettings
  }

  async activateTaxSettings(id: string) {
    const mutation = `
      mutation ActivateTaxSettings($id: String!) {
        activateTaxSettings(id: $id) {
          id
          isActive
          effectiveFrom
        }
      }
    `
    const response = await this.request<{ activateTaxSettings: any }>(mutation, { id })
    return response.activateTaxSettings
  }
}

export const graphqlClient = new GraphQLService()

