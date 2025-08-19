// app/products/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface Product {
  _id: string;
  name: string;
  price: number;
  [key: string]: any; // keep other fields flexible
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products', {
          headers: {
            'x-api-key': process.env.MY_SECRET_KEY || 'hardcoded_key_here',
          },
        });

        const data = await res.json();

        if (!data.success) {
          setError(data.error || 'Failed to fetch');
        } else {
          setProducts(data.products);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Products</h1>
      <pre>{JSON.stringify(products, null, 2)}</pre>
    </div>
  );
}
