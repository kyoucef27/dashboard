import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { connectDB } from "../../backend/routes/mongodb";
import { Product } from "../../backend/models/Product";
import { Order } from "../../backend/models/Order";

export default async function Home() {
  // Get the user session
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  // Get dashboard stats
  let productCount = 0;
  let pendingOrderCount = 0;
  let totalRevenue = 0;

  try {
    await connectDB();
    
    // Count products
    productCount = await Product.countDocuments();
    
    // Count pending orders
    pendingOrderCount = await Order.countDocuments({ status: 'pending' });
    
    // Calculate total revenue from delivered orders
    const orders = await Order.find({ status: 'delivered' });
    totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar></Navbar>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">NadiaLuxe Dashboard</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl text-center">
          Welcome to the admin dashboard for managing NadiaLuxe products and orders.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4 w-full max-w-5xl">
          <Link href="/products" 
                className="bg-white shadow-md rounded-lg p-8 flex flex-col items-center hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="bg-blue-100 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Products</h2>
            <p className="text-gray-600 text-center">Browse, search, and manage all products in the catalog.</p>
          </Link>
          
          <Link href="/orders" 
                className="bg-white shadow-md rounded-lg p-8 flex flex-col items-center hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Orders</h2>
            <p className="text-gray-600 text-center">Track, update, and manage customer orders.</p>
          </Link>
          
          <Link href="/upload" 
                className="bg-white shadow-md rounded-lg p-8 flex flex-col items-center hover:shadow-lg transition-all transform hover:-translate-y-1">
            <div className="bg-purple-100 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Add Product</h2>
            <p className="text-gray-600 text-center">Create and upload new products to the catalog.</p>
          </Link>
        </div>
        
        <div className="mt-16 w-full max-w-5xl bg-white shadow-md rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-800">{productCount}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-800">{pendingOrderCount}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-800">{totalRevenue} DZD</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}