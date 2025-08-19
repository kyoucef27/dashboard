import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../backend/routes/mongodb';
import { Order } from '../../../../../backend/models/Order';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get search query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Both start and end dates are required' },
        { status: 400 }
      );
    }
    
    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format. Use ISO format (YYYY-MM-DD)' },
        { status: 400 }
      );
    }
    
    // Set end date to the end of the day
    endDateObj.setHours(23, 59, 59, 999);
    
    // Search for orders in the date range
    const orders = await Order.find({
      createdAt: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    }).sort({ createdAt: -1 });
    
    return NextResponse.json(
      {
        success: true,
        count: orders.length,
        orders
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error searching orders by date range:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to search orders' },
      { status: 500 }
    );
  }
}
