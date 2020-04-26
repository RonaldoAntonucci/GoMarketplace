import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity?: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const storageKey = '@GoMarketplace:products';
  const [products, setProducts] = useState<Required<Product>[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(storageKey);

      if (storagedProducts) {
        setProducts(JSON.parse(storagedProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const hasProductOnCartIndex = products.findIndex(
        current => product.id === current.id,
      );

      if (hasProductOnCartIndex >= 0) {
        products[hasProductOnCartIndex].quantity += 1;
      } else {
        products.push({ ...product, quantity: 1 });
      }

      setProducts([...products]);
      await AsyncStorage.setItem(storageKey, JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      products[productIndex].quantity += 1;

      setProducts([...products]);
      await AsyncStorage.setItem(storageKey, JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      const newState = [...products];

      if (newState[productIndex].quantity > 1) {
        newState[productIndex].quantity -= 1;
      } else {
        newState.splice(productIndex, 1);
      }

      setProducts(newState);
      await AsyncStorage.setItem(storageKey, JSON.stringify(newState));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
    }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
