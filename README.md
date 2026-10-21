# Deal Hay Mỗi Ngày — Shopee + TikTok Shop Affiliate

Starter project production-oriented cho Next.js + Supabase + Vercel. Không chứa link affiliate thật, không giả lập API của Shopee/TikTok. Bạn cần tự nhập link affiliate được tạo trong tài khoản chương trình tương ứng.

## Chức năng
- Storefront tiếng Việt, responsive/mobile-first, tìm kiếm, lọc danh mục, sản phẩm nổi bật.
- Trang chi tiết sản phẩm theo slug và metadata cơ bản.
- CTA riêng Shopee/TikTok Shop; ghi lượt click qua RPC Supabase trước khi mở link.
- Import `.xlsx`, `.xls`, `.csv` trong trang `/admin`, có preview trước khi nhập.
- Supabase Auth, bảng phân quyền `admin/editor/viewer`, RLS cho sản phẩm.
- Dashboard cơ bản đếm sản phẩm và lượt click theo nền tảng.
- Chính sách công bố affiliate, metadata SEO/Open Graph.
- Banner khuyến mãi tĩnh có thể tùy chỉnh trong `components/Shop.tsx`.

## 1. Tạo Supabase
1. Tạo project mới tại https://supabase.com/.
2. Vào SQL Editor, chạy toàn bộ `supabase/schema.sql`.
3. Vào Project Settings > API (hoặc Connect) và lấy Project URL cùng publishable/anon key.
4. Vào Authentication > Users, tạo user quản trị bằng email/mật khẩu.
5. Sao chép UUID user vừa tạo. Trong SQL Editor chạy (thay UUID):
   ```sql
   insert into public.admin_users(user_id, role)
   values ('UUID-USER-CUA-BAN', 'admin')
   on conflict (user_id) do update set role = excluded.role;
   ```
6. Nếu bật email confirmation trong Auth, xác nhận email trước khi đăng nhập.

## 2. Chạy local
Yêu cầu Node.js 20 LTS trở lên.
```bash
npm install
cp .env.example .env.local
```
Sửa `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```
Không cần service role key cho luồng mặc định. Không bao giờ đặt secret trong biến `NEXT_PUBLIC_*`.
```bash
npm run dev
```
Mở http://localhost:3000. Trang `/admin` để đăng nhập.

## 3. Import sản phẩm
1. Tải `public/products-template.csv` hoặc tải template từ trang quản trị.
2. Điền một dòng cho mỗi sản phẩm. Bắt buộc có `title` hoặc `Tên sản phẩm`.
3. `shopee_url` / `tiktok_url` phải là URL thật được tạo/cấp bởi chương trình affiliate của bạn. URL ảnh cần là URL công khai.
4. Các cột hỗ trợ: `title`, `slug`, `description`, `image_url`, `price`, `original_price`, `category`, `shopee_url`, `tiktok_url`, `is_featured`, `is_active`. Cũng hỗ trợ một số tiêu đề tiếng Việt như `Tên sản phẩm`, `Mô tả`, `Ảnh`, `Giá`, `Giá gốc`, `Danh mục`, `Link Shopee`, `Link TikTok`, `Nổi bật`, `Hiển thị`.
5. Tại `/admin`, chọn file, kiểm tra preview, bấm xác nhận nhập. Các slug trùng sẽ được cập nhật (upsert).
6. URL mẫu trong CSV là placeholder, phải thay bằng link affiliate thật trước khi nhập.

## 4. Deploy lên Vercel
1. Đưa project lên GitHub.
2. Trên Vercel, Import Git Repository.
3. Project Settings > Environment Variables: thêm:
   - `NEXT_PUBLIC_SITE_URL` = domain production, ví dụ `https://ten-shop.vercel.app`
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = publishable/anon key
4. Redeploy sau khi thêm biến môi trường.
5. Supabase Authentication > URL Configuration: đặt Site URL là domain production và thêm Redirect URLs tương ứng. Email/password hiện là luồng đăng nhập chính.
6. Thử đăng nhập admin, import một sản phẩm thật và kiểm tra lượt click. Sau khi gắn domain riêng, cập nhật `NEXT_PUBLIC_SITE_URL` và Supabase URL config.

## 5. Cách hoạt động và giới hạn
- Không tự cào sản phẩm, giá, tồn kho hoặc hoa hồng. Chỉ hiển thị dữ liệu bạn nhập.
- Không giả lập API hoặc tự sinh affiliate URL. Dùng link được tạo trong dashboard/chương trình affiliate chính thức.
- Lượt click là số lần người dùng nhấn CTA trên website, không phải đơn hàng hay hoa hồng được xác nhận. Đối soát doanh thu/đơn hàng trong dashboard của chương trình affiliate.
- Supabase RLS bảo vệ quyền ghi/xóa sản phẩm. Bảng `admin_users` phải được cấp role thủ công qua SQL cho tài khoản đầu tiên.
- View thống kê tổng theo nền tảng có thể cần kiểm tra quyền view trong dự án Supabase của bạn. Nếu Supabase báo lỗi khi truy vấn view, hãy xem mục Database > Views và Grants.
- Đây là source code triển khai được sau khi cấu hình dịch vụ; chưa thể deploy vào tài khoản Vercel/Supabase của bạn nếu chưa có quyền truy cập và thông tin project.
- Để giảm spam click, production lớn nên bổ sung rate limiting/chống bot ở server/edge và chính sách lưu trữ dữ liệu phù hợp.

## 6. Kiểm tra trước khi public
- [ ] Chạy SQL schema thành công.
- [ ] Tạo user Auth và cấp `admin`.
- [ ] Cấu hình biến môi trường ở local/Vercel.
- [ ] Thay link ví dụ bằng link affiliate thật.
- [ ] Kiểm tra link ảnh công khai, giá và mô tả.
- [ ] Kiểm tra chính sách affiliate và thông tin liên hệ của chủ website.
- [ ] Test mobile, CTA, click tracking, import file và RLS.
