import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../backend/routes/mongodb';
import { Order } from '../../../../../backend/models/Order';


interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();
    
    const orderId = context.params.id;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: true, order },
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
