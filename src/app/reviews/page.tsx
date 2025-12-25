'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Star, Loader2, CheckCircle, Building, User, MoreHorizontal, Eye, EyeOff, Trash2, Shield } from 'lucide-react'
import { graphqlClient } from '@/lib/graphql'
import { formatDate } from '@/lib/date-utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useI18n } from '@/contexts/i18n-context'

export default function ReviewsPage() {
  const { t } = useI18n()
  const [reviews, setReviews] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    if (selectedProperty) {
      fetchReviews(selectedProperty)
    } else {
      fetchAllReviews()
    }
  }, [selectedProperty])

  const fetchProperties = async () => {
    try {
      const data = await graphqlClient.getProperties()
      setProperties(data)
    } catch (err: any) {
      console.error('Error fetching properties:', err)
    }
  }

  const fetchAllReviews = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Use getAllReviews for admin/owner view
      const data = await graphqlClient.getAllReviews({
        propertyId: selectedProperty || undefined,
        includePrivate: true, // Admin can see private reviews
      })
      
      // Enrich with property names
      const reviewsWithProperty = data.map((review: any) => ({
        ...review,
        propertyName: review.property?.name || t('common.unknown'),
        propertyId: review.property?.id,
      }))
      
      setReviews(reviewsWithProperty)
    } catch (err: any) {
      setError(err.message || t('reviews.fetchError'))
      console.error('Error fetching reviews:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReviews = async (propertyId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      // Use getAllReviews with property filter
      const data = await graphqlClient.getAllReviews({
        propertyId: propertyId,
        includePrivate: true,
      })
      
      const reviewsWithProperty = data.map((review: any) => ({
        ...review,
        propertyName: review.property?.name || t('common.unknown'),
        propertyId: propertyId,
      }))
      setReviews(reviewsWithProperty)
    } catch (err: any) {
      setError(err.message || t('reviews.fetchError'))
      console.error('Error fetching reviews:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyReview = async (reviewId: string) => {
    try {
      const result = await graphqlClient.verifyReview(reviewId)
      if (result.success) {
        if (selectedProperty) {
          fetchReviews(selectedProperty)
        } else {
          fetchAllReviews()
        }
      } else {
        alert(result.message || t('reviews.verifyReviewError'))
      }
    } catch (err: any) {
      console.error('Error verifying review:', err)
      alert(err.message || t('common.error'))
    }
  }

  const handleToggleVisibility = async (reviewId: string) => {
    try {
      const result = await graphqlClient.toggleReviewVisibility(reviewId)
      if (result.success) {
        if (selectedProperty) {
          fetchReviews(selectedProperty)
        } else {
          fetchAllReviews()
        }
      } else {
        alert(result.message || t('reviews.toggleVisibilityError'))
      }
    } catch (err: any) {
      console.error('Error toggling review visibility:', err)
      alert(err.message || t('reviews.toggleVisibilityError'))
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t('reviews.deleteReviewConfirm'))) {
      return
    }

    try {
      const result = await graphqlClient.deleteReview(reviewId)
      if (result.success) {
        if (selectedProperty) {
          fetchReviews(selectedProperty)
        } else {
          fetchAllReviews()
        }
      } else {
        alert(result.message || t('reviews.deleteReviewError'))
      }
    } catch (err: any) {
      console.error('Error deleting review:', err)
      alert(err.message || t('common.error'))
    }
  }

  const filteredReviews = reviews.filter((review) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      review.user?.fullName?.toLowerCase().includes(query) ||
      review.user?.email?.toLowerCase().includes(query) ||
      review.title?.toLowerCase().includes(query) ||
      review.comment?.toLowerCase().includes(query) ||
      review.propertyName?.toLowerCase().includes(query)
    )
  })

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0

  const verifiedReviews = reviews.filter((r) => r.isVerified).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t('reviews.management')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('reviews.managementDescription')}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reviews.totalReviews')}</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('reviews.allReviews')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reviews.averageRating')}</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('reviews.outOf', { defaultValue: 'Out of 5.0' })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('reviews.verifiedReviews')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('reviews.verified', { defaultValue: 'Verified' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('reviews.title')}</CardTitle>
                <CardDescription>
                  {t('reviews.managementDescription')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm min-w-[200px]"
                >
                  <option value="">{t('reviews.allProperties')}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('reviews.searchPlaceholder')}
                    className="w-full sm:w-[200px] pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => selectedProperty ? fetchReviews(selectedProperty) : fetchAllReviews()} variant="outline" className="mt-4">
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reviews.allReviews')}</CardTitle>
            <CardDescription>
              {filteredReviews.length} {t('reviews.review')}{filteredReviews.length !== 1 ? 's' : ''} {t('common.found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('reviews.noReviewsFound')}</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? t('common.tryAdjusting') : t('reviews.noReviewsSubmitted')}
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reviews.user')}</TableHead>
                      <TableHead>{t('reviews.property')}</TableHead>
                      <TableHead>{t('reviews.rating')}</TableHead>
                      <TableHead>{t('common.title', { defaultValue: 'Title' })}</TableHead>
                      <TableHead>{t('reviews.comment')}</TableHead>
                      <TableHead>{t('reviews.date')}</TableHead>
                      <TableHead>{t('reviews.status')}</TableHead>
                      <TableHead>{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{review.user?.fullName || t('common.unknown')}</span>
                            <span className="text-xs text-muted-foreground">{review.user?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{review.propertyName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < (review.rating || 0)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-1 font-semibold">{review.rating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{review.title}</span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                            {review.comment}
                          </p>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(review.reviewDate)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {review.isVerified && (
                              <Badge variant="default" className="w-fit gap-1">
                                <CheckCircle className="h-3 w-3" />
                                {t('reviews.verified')}
                              </Badge>
                            )}
                            {review.isPublic ? (
                              <Badge variant="outline" className="w-fit">{t('common.public', { defaultValue: 'Public' })}</Badge>
                            ) : (
                              <Badge variant="secondary" className="w-fit">{t('common.private', { defaultValue: 'Private' })}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!review.isVerified && (
                                <DropdownMenuItem onClick={() => handleVerifyReview(review.id)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  {t('reviews.verify', { defaultValue: 'Verify Review' })}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleToggleVisibility(review.id)}>
                                {review.isPublic ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    {t('common.hide', { defaultValue: 'Hide Review' })}
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t('common.show', { defaultValue: 'Show Review' })}
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteReview(review.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('common.delete')} {t('reviews.review')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


