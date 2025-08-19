import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../backend/routes/mongodb";
import { Order } from "../../../../../../backend/models/Order";

export async function GET(
  request: NextRequest,
  { params }: any   // 👈 use `any` here to satisfy Next.js
) {
  try {
    await connectDB();

    const email = decodeURIComponent(params.email);

    const orders = await Order.find({ "customer.email": email }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      { success: true, count: orders.length, orders },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching orders by email:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
