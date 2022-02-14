import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      const tempCart = [...cart];

      //localizando o produto no cart
      const productExist = tempCart.find((product) => product.id === productId);

      //busca stock do produto
      const stock = await api.get(`stock/${productId}`);
      const stockProduct = await stock.data;

      //pega qnt disponivel
      const stockAmount = stockProduct.amount;
      //qnt atual de produtos no carrinho
      const currrentAmount = productExist ? productExist.amount : 0;

      //verificando se tem a qnt solicitada em estoque
      if (stockAmount < currrentAmount + 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExist) {
        productExist.amount += 1;
      } else {
        //busca o produto
        const productResponse = await api.get<Product>(`products/${productId}`);
        //cria o amount do produto localizado
        const newProduct = {
          ...productResponse.data,
          amount: 1,
        };
        //adiciona no tempCart
        tempCart.push(newProduct);
      }

      setCart(tempCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(tempCart));
    } catch {
      // TODO
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      //TODO;
      const tempCart = [...cart];

      //verifica se existe o produto no cart
      const productExist = tempCart.find((product) => productId === product.id);

      if (!productExist) {
        throw new Error();
      }

      //se existe remove
      const filtered = tempCart.filter((product) => product.id !== productId);

      setCart(filtered);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(filtered));
    } catch {
      //TODO;
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      //TODO;
      if (amount <= 0) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }
      const tempCart = [...cart];

      const productExists = tempCart.find(
        (product) => product.id === productId
      );

      if (!productExists) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const stock = await api.get<Product>(`stock/${productId}`);
      const stockAmount = await stock.data.amount;

      if (stockAmount < amount) {
        throw new Error();
      }

      productExists.amount = amount;

      setCart(tempCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(tempCart));
    } catch {
      //TODO;
      toast.error("Quantidade solicitada fora de estoque");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
