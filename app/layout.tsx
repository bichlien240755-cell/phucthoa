import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Deal Hay Mỗi Ngày | Săn deal thông minh", template: "%s | Deal Hay Mỗi Ngày" },
  description: "Tổng hợp deal đáng chú ý từ Shopee và TikTok Shop. So sánh lựa chọn và đến nền tảng mua hàng qua link tiếp thị liên kết.",
  openGraph: { type: "website", locale: "vi_VN", siteName: "Deal Hay Mỗi Ngày", title: "Deal Hay Mỗi Ngày", description: "Săn deal thông minh mỗi ngày." },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
