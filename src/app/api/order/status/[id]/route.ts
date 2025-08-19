import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../../backend/routes/mongodb';
import { Order } from '../../../../../../backend/models/Order';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const orderId = params.id;
    const { status, note } = await request.json();
    
    // Validate status
    if (!status || !['pending', 'delivered', 'returned'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }
    
    const currentTime = new Date().toISOString();
    
    // Update the status
    const updates: any = {
      status,
      statusHistory: [
        ...order.statusHistory,
        {
          status,
          timestamp: currentTime,
          note: note || `Order marked as ${status}`
        }
      ]
    };
    
    // Update date fields based on status
    if (status === 'delivered') {
      updates.deliveryDate = currentTime;
    } else if (status === 'returned') {
      updates.returnDate = currentTime;
    }
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updates },
      { new: true }
    );
    
    return NextResponse.json(
      { 
        success: true, 
        message: `Order status updated to ${status}`,
        order: updatedOrder
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
