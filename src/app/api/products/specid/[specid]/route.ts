import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../backend/routes/mongodb";
import { Product } from "../../../../../../backend/models/Product";

export async function GET(
  request: NextRequest,
  { params }: { params: any }  
) {
  try {
    await connectDB();

    const { specid } = params as { specid: string };

    const product = await Product.findOne({ specid });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, product },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching product by specid:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}
