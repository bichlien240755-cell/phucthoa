'use client';
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { Product } from "@/lib/types";
const money = (n: number | null) => n == null ? "Xem giá" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
export default function ProductDetail({slug}:{slug:string}) {
 const [p,setP]=useState<Product|null>(null); const [error,setError]=useState("");
 useEffect(()=>{(async()=>{try{const s=createClient();const {data,error}=await s.from("products").select("*").eq("slug",slug).eq("is_active",true).maybeSingle();if(error)throw error;setP(data as Product|null)}catch(e){setError(e instanceof Error?e.message:"Không tải được sản phẩm")}})()},[slug]);
 async function go(platform:"shopee"|"tiktok"){if(!p)return;const url=platform==="shopee"?p.shopee_url:p.tiktok_url;if(!url)return;try{await createClient().rpc("record_affiliate_click",{p_product_id:p.id,p_platform:platform})}catch{}window.open(url,"_blank","noopener,noreferrer")}
 if(error)return <main className="container" style={{padding:"50px 0"}}><p>{error}</p><a href="/">← Về trang chủ</a></main>;
 if(!p)return <main className="container" style={{padding:"50px 0"}}>Đang tải sản phẩm…</main>;
 return <main className="container" style={{padding:"28px 0",maxWidth:900}}><a href="/" className="muted">← Về Deal Hay Mỗi Ngày</a><div className="panel" style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:24,marginTop:18}}><div className="product-image" style={{height:320,borderRadius:12}}>{p.image_url?<img src={p.image_url} alt={p.title}/>: "🔥"}</div><div><p className="muted">{p.category}</p><h1 style={{fontSize:26,lineHeight:1.35}}>{p.title}</h1><p style={{fontSize:24,color:"#ea580c",fontWeight:800}}>{money(p.price)}</p>{p.original_price&&<p className="muted">Giá tham khảo trước ưu đãi: {money(p.original_price)}</p>}<p style={{lineHeight:1.8}}>{p.description}</p><div className="actions">{p.shopee_url&&<button className="btn" onClick={()=>go("shopee")}>Mua trên Shopee ↗</button>}{p.tiktok_url&&<button className="btn secondary" onClick={()=>go("tiktok")}>Xem TikTok Shop ↗</button>}</div><p className="muted">Giá, ưu đãi và tình trạng hàng có thể thay đổi. Vui lòng xác nhận tại nền tảng bán hàng.</p></div></div><div className="notice">Liên kết có thể là affiliate; website có thể nhận hoa hồng nếu bạn mua qua liên kết.</div></main>;
}
