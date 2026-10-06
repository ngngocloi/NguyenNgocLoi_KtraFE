# NguyenNgocLoi_KtraFE

Bài tập xây dựng giao diện danh sách sản phẩm Amazon bằng HTML, CSS và JavaScript trên project ASP.NET MVC 5.

**Sinh viên:** Nguyễn Ngọc Lợi

## Công nghệ

- ASP.NET MVC 5, .NET Framework 4.7.2.
- HTML (Razor view), CSS, JavaScript thuần.
- Font Awesome 5.15.4.

## Chạy project bằng Visual Studio

1. Clone repo hoặc tải ZIP và giải nén.
2. Mở file `NguyenNgocLoi_KtraFE.sln` trong Visual Studio.
3. Cài **ASP.NET and web development**, **.NET Framework 4.7.2 targeting pack** và **IIS Express** nếu máy còn thiếu.
4. Nhấp chuột phải vào solution, chọn **Restore NuGet Packages**.
5. Chọn project `NguyenNgocLoi_KtraFE` làm **Startup Project**, chọn **IIS Express**, rồi nhấn **Ctrl + F5**.

Trang chủ mở tại `http://localhost:51153/` hoặc `/Home/Index`. Nếu cổng trên máy khác, dùng địa chỉ Visual Studio mở trong trình duyệt. Nếu trang chủ chưa mở đúng, vào **Project Properties → Web → Specific Page** và nhập `Home/Index`.

## Các file chính

Các đường dẫn dưới đây nằm trong thư mục project `NguyenNgocLoi_KtraFE/`:

| Đường dẫn | Nội dung |
| --- | --- |
| `Controllers/HomeController.cs` | Mở trang chủ |
| `Views/Home/NguyenNgocLoi_KtraFE.cshtml` | Bố cục và danh sách sản phẩm |
| `Content/Style.css` | Màu sắc, kích thước và bố cục trên các màn hình |
| `Scripts/scripts.js` | Xử lý tìm kiếm, bộ lọc và giỏ hàng |
| `assets/` | Hình ảnh sản phẩm và Font Awesome |

## Chức năng

- Tìm kiếm bằng tên sản phẩm, bấm biểu tượng kính lúp hoặc nhấn Enter.
- Chọn danh mục, lọc theo giá, đánh giá và ưu đãi; sắp xếp danh sách sản phẩm.
- Bấm ảnh hoặc tên sản phẩm để xem chi tiết.
- Thêm sản phẩm vào giỏ, thay đổi số lượng, xóa sản phẩm và tính tổng tiền.
- Lưu giỏ hàng bằng `localStorage` để giữ lại khi tải lại trang.
- Điều chỉnh bố cục theo kích thước màn hình.

Dự án dùng dữ liệu sản phẩm mẫu để thực hành frontend, chưa có chức năng thanh toán hoặc đặt hàng thật.
