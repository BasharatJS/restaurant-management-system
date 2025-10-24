'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Order, OrderStatus } from '@/types'
import { getDocumentById, updateDocument } from '@/lib/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function OrderDetailsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      const orderData = await getDocumentById<Order>('orders', orderId)
      if (orderData) {
        setOrder(orderData)
      } else {
        toast.error('Order not found')
        router.push('/dashboard/orders')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load order')
      router.push('/dashboard/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return

    setUpdating(true)
    try {
      await updateDocument('orders', orderId, { status: newStatus })
      setOrder({ ...order, status: newStatus })
      toast.success('Order status updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentStatusUpdate = async (
    newPaymentStatus: 'pending' | 'paid' | 'refunded'
  ) => {
    if (!order) return

    setUpdating(true)
    try {
      await updateDocument('orders', orderId, {
        paymentStatus: newPaymentStatus,
      })
      setOrder({ ...order, paymentStatus: newPaymentStatus })
      toast.success('Payment status updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'preparing':
        return 'bg-blue-100 text-blue-800'
      case 'ready':
        return 'bg-purple-100 text-purple-800'
      case 'served':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'refunded':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/orders')}
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Created on {formatDate(order.createdAt, 'MMM dd, yyyy hh:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(order.status)}>
            {order.status.toUpperCase()}
          </Badge>
          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
            {order.paymentStatus.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                      {item.specialInstructions && (
                        <p className="text-sm text-blue-600 mt-1">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <p className="text-xs text-gray-500">
                        GST {item.gstRate}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-6 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CGST</span>
                  <span className="font-medium">
                    {formatCurrency(order.cgst)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SGST</span>
                  <span className="font-medium">
                    {formatCurrency(order.sgst)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(order.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Amount</span>
                  <span className="text-green-600">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {(order.customerName || order.customerPhone) && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.customerName && (
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                )}
                {order.customerPhone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                )}
                {order.deliveryAddress && (
                  <div>
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="font-medium">{order.deliveryAddress}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Order Type</p>
                <Badge variant="outline" className="mt-1">
                  {order.orderType}
                </Badge>
              </div>

              {order.tableNumber && (
                <div>
                  <p className="text-sm text-gray-600">Table Number</p>
                  <p className="font-medium">Table {order.tableNumber}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium capitalize">
                  {order.paymentMethod || 'Not specified'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Created By</p>
                <p className="font-medium">{order.createdBy}</p>
              </div>

              {order.completedAt && (
                <div>
                  <p className="text-sm text-gray-600">Completed At</p>
                  <p className="font-medium">
                    {formatDate(order.completedAt, 'MMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Status */}
          {user?.role !== 'kitchen' && (
            <Card>
              <CardHeader>
                <CardTitle>Update Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order Status</label>
                  <Select
                    value={order.status}
                    onValueChange={(value: OrderStatus) =>
                      handleStatusUpdate(value)
                    }
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="served">Served</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select
                    value={order.paymentStatus}
                    onValueChange={(value: any) =>
                      handlePaymentStatusUpdate(value)
                    }
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {order.paymentStatus === 'paid' &&
                  order.status === 'served' && (
                    <Button
                      className="w-full"
                      onClick={() =>
                        router.push(
                          `/dashboard/billing/generate?orderId=${orderId}`
                        )
                      }
                    >
                      Generate Bill
                    </Button>
                  )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
