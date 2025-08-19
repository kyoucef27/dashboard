'use client';

import { useEffect, useState } from 'react';
import { IProduct } from '../../../backend/models/Product';
import ProductCard from '@/components/ProductCard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
type ProductWithId = IProduct & {
  _id: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      setProducts(data.products);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId: string) => {
    try {
      setDeleteError(null);
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      // Refresh the products list after successful deletion
      fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setDeleteError(err.message || 'Failed to delete product. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar></Navbar>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Products</h1>
        
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
            {deleteError}
            <button 
              className="ml-2 text-red-600 hover:text-red-800"
              onClick={() => setDeleteError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-center">
            {error}
            <button 
              className="ml-3 text-red-600 hover:text-red-800"
              onClick={fetchProducts}
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4 text-center">
            No products found. Start by adding a new product.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product._id.toString()} 
                product={product} 
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
