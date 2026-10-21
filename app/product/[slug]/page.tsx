import type { Metadata } from "next";
import ProductDetail from "@/components/ProductDetail";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return { title: params.slug.replace(/-/g, " "), description: "Thông tin sản phẩm và liên kết mua hàng trên Shopee hoặc TikTok Shop." };
}
export default function ProductPage({ params }: { params: { slug: string } }) { return <ProductDetail slug={params.slug} />; }
