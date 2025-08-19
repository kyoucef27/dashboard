import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../backend/routes/mongodb';
import { Order } from '../../../../backend/models/Order';
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const customer = searchParams.get('customer');
    
    // Build the filter
    const filter: any = {};
    
    // Filter by status if provided
    if (status && ['pending', 'delivered', 'returned'].includes(status)) {
      filter.status = status;
    }
    
    // Filter by date range if provided
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate + 'T23:59:59.999Z') };
    }
    
    // Filter by customer if provided
    if (customer) {
      filter.$or = [
        { 'customer.name': { $regex: customer, $options: 'i' } },
        { 'customer.email': { $regex: customer, $options: 'i' } }
      ];
    }
    
    // Fetch filtered orders, newest first
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    
    return NextResponse.json(
      { 
        success: true, 
        count: orders.length,
        orders
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    // Parse the JSON body
    const body = await request.json();
    const { items, total, customer } = body.order;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }
    
    if (typeof total !== 'number' || total < 0) {
      return NextResponse.json(
        { success: false, message: 'Total must be a non-negative number' },
        { status: 400 }
      );
    }
    
    if (!customer || typeof customer !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Customer information is required' },
        { status: 400 }
      );
    }
    
    // Validate each order item
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json(
          { success: false, message: 'Each item must have a valid productId' },
          { status: 400 }
        );
      }
      
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { success: false, message: 'Each item must have a quantity of at least 1' },
          { status: 400 }
        );
      }
    }
    
    // Create a new order with current timestamp
    const currentTime = new Date().toISOString();
    const orderData = {
      items,
      total,
      customer,
      timestamp: currentTime,
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: currentTime,
          note: 'Order created'
        }
      ]
    };
    console.log(customer)
    const order = new Order(orderData);
    console.log(order)
    await order.save();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Order created successfully',
        order
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}