export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  original_price: number | null;
  category: string | null;
  shopee_url: string | null;
  tiktok_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at?: string;
};
