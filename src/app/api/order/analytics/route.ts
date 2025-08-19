import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../backend/routes/mongodb';
import { Order } from '../../../../../backend/models/Order';

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Get total count for each status
    const totalOrders = await Order.countDocuments({});
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const returnedOrders = await Order.countDocuments({ status: 'returned' });
    
    // Get weekly data
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$total" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
      }
    ]);
    
    // Get monthly data
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const monthlyData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          revenue: { $sum: "$total" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Format the weekly data for charts
    const formattedWeeklyData = weeklyData.map(day => ({
      date: `${day._id.year}-${day._id.month.toString().padStart(2, '0')}-${day._id.day.toString().padStart(2, '0')}`,
      orders: day.count,
      revenue: day.revenue
    }));
    
    // Format the monthly data for charts
    const formattedMonthlyData = monthlyData.map(month => ({
      month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
      orders: month.count,
      revenue: month.revenue
    }));
    
    return NextResponse.json(
      { 
        success: true, 
        statistics: {
          totalOrders,
          pendingOrders,
          deliveredOrders,
          returnedOrders,
          weeklyData: formattedWeeklyData,
          monthlyData: formattedMonthlyData
        }
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error('Error fetching order analytics:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch order analytics' },
      { status: 500 }
    );
  }
}
