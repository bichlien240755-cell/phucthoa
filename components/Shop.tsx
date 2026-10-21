'use client';
import { useEffect, useMemo, useState } from "react";
import { Search, Flame, ShieldCheck } from "lucide-react";
import type { Product } from "@/lib/types";
import { createClient } from "@/lib/supabase-browser";

const money = (n: number | null) => n == null ? "Xem giá" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["Tất cả"]);
  const [category, setCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("products").select("id,title,slug,description,image_url,price,original_price,category,shopee_url,tiktok_url,is_featured,is_active,created_at").eq("is_active", true).order("is_featured", { ascending: false }).order("created_at", { ascending: false });
        if (error) throw error;
        if (alive) {
          const list = (data || []) as Product[];
          setProducts(list);
          setCategories(["Tất cả", ...Array.from(new Set(list.map(p => p.category).filter((x): x is string => !!x))).sort()]);
        }
      } catch (e) { if (alive) setDbError(e instanceof Error ? e.message : "Không tải được sản phẩm."); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, []);
  const filtered = useMemo(() => products.filter(p => (category === "Tất cả" || p.category === category) && `${p.title} ${p.description || ""}`.toLowerCase().includes(search.toLowerCase())), [products, category, search]);
  async function clickProduct(product: Product, platform: "shopee" | "tiktok") {
    const url = platform === "shopee" ? product.shopee_url : product.tiktok_url;
    if (!url) return;
    try { const supabase = createClient(); await supabase.rpc("record_affiliate_click", { p_product_id: product.id, p_platform: platform }); } catch { /* Analytics failure must not block the affiliate destination. */ }
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return <>
    <div className="topbar">🔥 Deal đáng chú ý mỗi ngày · Chọn thông minh, mua sắm tiết kiệm</div>
    <header className="header"><div className="container header-inner">
      <a className="logo" href="/" aria-label="Deal Hay Mỗi Ngày">DEAL HAY <span>MỖI NGÀY</span></a>
      <form className="search" onSubmit={e => e.preventDefault()}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm, danh mục..." aria-label="Tìm sản phẩm"/><button aria-label="Tìm kiếm"><Search size={18}/></button></form>
      <a className="admin-link" href="/admin">Quản trị ↗</a>
    </div></header>
    <main className="container">
      <section className="hero"><div><div style={{fontSize:12,fontWeight:800,letterSpacing:2,color:"#fed7aa",marginBottom:12}}>DEAL HOT • CHỌN LỌC MỖI NGÀY</div><h1>Săn deal hay.<br/>Mua sắm thông minh.</h1><p>Tổng hợp sản phẩm đáng chú ý từ Shopee và TikTok Shop tại một nơi. Xem thông tin, chọn nền tảng phù hợp và mua hàng trực tiếp.</p><a className="btn" href="#san-pham">Khám phá sản phẩm ↓</a></div><div className="hero-bubble"><Flame size={80} strokeWidth={1.5}/></div></section>
      <section className="banner"><div><strong>⚡ Ưu đãi bạn không muốn bỏ lỡ</strong><p>Khám phá các lựa chọn được tuyển chọn. Giá và khuyến mãi cuối cùng theo nền tảng bán hàng.</p></div><a className="btn" href="#san-pham">Xem deal ngay</a></section>
      <section id="san-pham">
        <div className="section-head"><div><h2>Sản phẩm nổi bật</h2><p>Chọn mua trên Shopee hoặc TikTok Shop.</p></div><span className="muted">{filtered.length} sản phẩm</span></div>
        <div className="categories">{categories.map(c => <button key={c} className={`chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c}</button>)}</div>
        {dbError && <div className="empty"><strong>Chưa kết nối được dữ liệu sản phẩm.</strong><p>{dbError}</p><p>Kiểm tra biến môi trường và chạy file <code>supabase/schema.sql</code>.</p></div>}
        {loading && <div className="empty">Đang tải sản phẩm…</div>}
        {!loading && !dbError && filtered.length === 0 && <div className="empty"><strong>{products.length ? "Không tìm thấy sản phẩm phù hợp." : "Shop đang chuẩn bị các deal đầu tiên."}</strong><p>{products.length ? "Thử từ khóa hoặc danh mục khác." : "Đăng nhập trang quản trị để nhập sản phẩm bằng Excel/CSV."}</p></div>}
        <div className="grid">{filtered.map(p => <article className="product" key={p.id}>
          <a href={`/product/${p.slug}`} className="product-image" aria-label={p.title}>{p.image_url ? <img src={p.image_url} alt={p.title} loading="lazy"/> : <Flame size={44}/>}</a>
          <div className="product-body"><a className="product-title" href={`/product/${p.slug}`}>{p.title}</a>{p.description && <div className="product-desc">{p.description}</div>}<div><span className="price">{money(p.price)}</span>{p.original_price && p.price && p.original_price > p.price && <span className="old-price">{money(p.original_price)}</span>}</div>
          <div className="platforms">{p.shopee_url && <button className="platform shopee" onClick={() => clickProduct(p,"shopee")}>Mua Shopee ↗</button>}{p.tiktok_url && <button className="platform tiktok" onClick={() => clickProduct(p,"tiktok")}>TikTok Shop ↗</button>}</div>
          </div></article>)}</div>
      </section>
      <div className="notice" style={{marginTop:26}}><ShieldCheck size={15} style={{display:"inline",verticalAlign:"middle",marginRight:5}}/>Một số liên kết trên website có thể là liên kết tiếp thị liên kết. Chúng tôi có thể nhận hoa hồng nếu bạn mua hàng qua liên kết, không làm thay đổi giá bạn trả. Giá, tồn kho và khuyến mãi do nền tảng/người bán quyết định.</div>
    </main>
    <footer className="footer"><div className="container footer-inner"><div><div className="logo" style={{color:"#fff"}}>DEAL HAY <span>MỖI NGÀY</span></div><p>Gợi ý mua sắm, kết nối đến nền tảng bán hàng.</p></div><div><strong>Thông tin</strong><p><a href="/chinh-sach">Chính sách & công bố affiliate</a></p><small>© {new Date().getFullYear()} Deal Hay Mỗi Ngày</small></div></div></footer>
  </>;
}
