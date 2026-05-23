import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useMediaStore from '../store/useMediaStore';
import Loader from '../components/ui/Loader';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const products = useMediaStore((state) => state.products);
  const isLoading = useMediaStore((state) => state.isLoading);
  const loadProducts = useMediaStore((state) => state.loadProducts);

  useEffect(() => {
    if (!products.length) {
      loadProducts({ force: true });
    }
  }, [loadProducts, products.length]);

  useEffect(() => {
    if (isLoading) return;

    const product = products.find((item) => item.id === id);
    const next = new URLSearchParams();

    if (product) {
      if (product.category) {
        next.set('category', product.category);
      }
      next.set('request', product.id);
      navigate(`/products?${next.toString()}`, { replace: true });
      return;
    }

    navigate('/products', { replace: true });
  }, [id, isLoading, navigate, products]);

  return <Loader />;
};

export default ProductDetails;
