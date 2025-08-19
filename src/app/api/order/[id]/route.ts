import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../backend/routes/mongodb';
import { Order } from '../../../../../backend/models/Order';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const orderId = params.id;
    
    // Find the order by ID
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: true, 
        order
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
