import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "pixel-perfect-ui-x5k0v-pcmfs2xe.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "74b9af105d9f854b2ecce04110f06f36";

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    productType: string;
    tags: string[];
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: { amount: string; currencyCode: string };
          availableForSale: boolean;
          selectedOptions: Array<{ name: string; value: string }>;
        };
      }>;
    };
    options: Array<{ name: string; values: string[] }>;
  };
}

const PRODUCT_FIELDS = `
  id title description handle productType tags
  priceRange { minVariantPrice { amount currencyCode } }
  images(first: 5) { edges { node { url altText } } }
  variants(first: 10) { edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } } }
  options { name values }
`;

export const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) { edges { node { ${PRODUCT_FIELDS} } } }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) { product(handle: $handle) { ${PRODUCT_FIELDS} } }
`;

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (response.status === 402) {
    toast.error("Shopify: pagamento necessário", {
      description: "O acesso à API do Shopify exige um plano ativo. Acesse admin.shopify.com para atualizar.",
    });
    return;
  }
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  if (data.errors) throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`);
  return data;
}

export async function fetchProducts(first = 50): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(PRODUCTS_QUERY, { first });
  return data?.data?.products?.edges ?? [];
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  const p = data?.data?.product;
  return p ? { node: p } : null;
}

export function formatPrice(amount: string | number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(Number(amount));
}

/* ---------- Cart API ---------- */
export const CART_QUERY = `query cart($id: ID!) { cart(id: $id) { id totalQuantity } }`;
const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
      userErrors { field message }
    }
  }`;
const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
      userErrors { field message }
    }
  }`;
const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { id } userErrors { field message } }
  }`;

type UserError = { field: string[] | null; message: string };

function formatCheckoutUrl(checkoutUrl: string) {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("channel", "online_store");
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}
function isCartNotFoundError(errs: UserError[]) {
  return errs.some((e) => e.message.toLowerCase().includes("cart not found") || e.message.toLowerCase().includes("does not exist"));
}

export async function createShopifyCart(variantId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_CREATE_MUTATION, { input: { lines: [{ quantity, merchandiseId: variantId }] } });
  if (data?.data?.cartCreate?.userErrors?.length > 0) return null;
  const cart = data?.data?.cartCreate?.cart;
  if (!cart?.checkoutUrl) return null;
  const lineId = cart.lines.edges[0]?.node?.id;
  if (!lineId) return null;
  return { cartId: cart.id as string, checkoutUrl: formatCheckoutUrl(cart.checkoutUrl), lineId: lineId as string };
}

export async function addLineToShopifyCart(cartId: string, variantId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, { cartId, lines: [{ quantity, merchandiseId: variantId }] });
  const errs: UserError[] = data?.data?.cartLinesAdd?.userErrors || [];
  if (isCartNotFoundError(errs)) return { success: false, cartNotFound: true };
  if (errs.length > 0) return { success: false };
  const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
  const newLine = lines.find((l: { node: { id: string; merchandise: { id: string } } }) => l.node.merchandise.id === variantId);
  return { success: true, lineId: newLine?.node?.id as string | undefined };
}

export async function removeLineFromShopifyCart(cartId: string, lineId: string) {
  const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, { cartId, lineIds: [lineId] });
  const errs: UserError[] = data?.data?.cartLinesRemove?.userErrors || [];
  if (isCartNotFoundError(errs)) return { success: false, cartNotFound: true };
  if (errs.length > 0) return { success: false };
  return { success: true };
}

/* ---------- Helpers ---------- */
export function getSize(p: ShopifyProduct) {
  const opt = p.node.options.find((o) => /tamanho|size/i.test(o.name));
  return opt?.values?.[0] ?? null;
}
const MEASURE_RE = /^(medida|comprimento|largura|busto|ombro|cintura|manga)[-_:]/i;
export function getMeasures(p: ShopifyProduct) {
  return p.node.tags
    .filter((t) => MEASURE_RE.test(t))
    .map((t) => {
      const [k = "", v = ""] = t.split(/[-_:]/);
      return { label: k.charAt(0).toUpperCase() + k.slice(1).toLowerCase(), value: v };
    });
}
export function getCondition(p: ShopifyProduct) {
  const t = p.node.tags.find((t) => /^estado[-_:]/i.test(t));
  return t ? t.split(/[-_:]/).slice(1).join(" ") : null;
}
