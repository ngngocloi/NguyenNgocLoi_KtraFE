# Amazon Product List — Nguyễn Ngọc Lợi

Repo: https://github.com/ngngocloi/NguyenNgocLoi_KtraFE

Bài tập giao diện Amazon dùng **ASP.NET MVC 5 / .NET Framework 4.7.2** trong Visual Studio. HTML nằm trong Razor view; CSS và JavaScript thuần xử lý tìm kiếm, bộ lọc và giỏ hàng với 21 sản phẩm mẫu.

## Chạy bằng Visual Studio

1. Chọn **Code → Download ZIP** trên GitHub và giải nén, hoặc clone repo bằng Git.
2. Mở `NguyenNgocLoi_KtraFE.sln` ở thư mục gốc repo.
3. Cài workload **ASP.NET and web development**, **.NET Framework 4.7.2 targeting pack/developer tools** và **IIS Express** nếu Visual Studio báo thiếu. Đổi thành phần tại Visual Studio Installer → Modify.
4. Trong Solution Explorer, nhấp chuột phải vào solution → **Restore NuGet Packages**. Chờ khôi phục xong các gói MVC.
5. Chọn project `NguyenNgocLoi_KtraFE` làm **Startup Project**, rồi chọn **IIS Express** trên thanh chạy.
6. Nhấn **Ctrl + F5**. Trang Amazon mở tại `http://localhost:51153/`. Có thể vào `/Home/Index` hoặc `/Home/NguyenNgocLoi_KtraFE`.
7. Nếu Visual Studio đặt một trang mở khác, vào **Project → Properties → Web → Start Action**, chọn **Specific Page** với giá trị `Home/Index`.

Sau khi sửa mã, lưu tệp và tải lại trang. **Ctrl + F5 trong trình duyệt** tải lại CSS/JS; **Ctrl + 0** đưa zoom về 100%. Độ rộng 1280–1440 px hiển thị 5 sản phẩm một hàng. Nếu cổng khác do cấu hình máy, dùng địa chỉ IIS Express hiển thị trong trình duyệt.

Tệp `.cshtml` chạy qua MVC/IIS Express. Không mở nó trực tiếp như tệp HTML và không đặt đường dẫn `Views/Home/...cshtml` vào trình duyệt.

## Cấu trúc để viết bài

| Tệp | Vai trò |
| --- | --- |
| `NguyenNgocLoi_KtraFE.sln` | Solution mở trong Visual Studio |
| `NguyenNgocLoi_KtraFE/Controllers/HomeController.cs` | Action mở trang Amazon |
| `NguyenNgocLoi_KtraFE/Views/Home/NguyenNgocLoi_KtraFE.cshtml` | HTML, ảnh, tên và giá của sản phẩm |
| `NguyenNgocLoi_KtraFE/Content/Style.css` | Giao diện và responsive |
| `NguyenNgocLoi_KtraFE/Scripts/scripts.js` | Tìm kiếm, lọc, sắp xếp, chi tiết và giỏ hàng |
| `NguyenNgocLoi_KtraFE/assets/` | Ảnh sản phẩm và Font Awesome 5.15.4 cục bộ |
| `docs/index.html` | Bản frontend tự chứa ảnh/font để mở trực tiếp hoặc đưa lên GitHub Pages |
| `tools/export_preview.py` | Tạo lại `docs/index.html` từ source MVC |

Trang Amazon đặt `Layout = null` vì view đã chứa HTML đầy đủ. `_Layout.cshtml` và Bootstrap của template vẫn phục vụ các trang About/Contact. `Url.Content("~/...")` tạo đường dẫn CSS, JavaScript và ảnh đúng cả khi chạy ở `/Home/Index` hoặc trong ứng dụng con của IIS.

## Thử các chức năng

- Gõ `bomves`, `cleaning tools`, `bag`, `túi xách` hoặc `máy chà`, rồi bấm kính lúp hoặc Enter. Kết quả hiện ngay trên trang. Để trống từ khóa để xem mọi sản phẩm trong danh mục đang chọn.
- Chọn **All / Home / Fashion** để xem nhóm sản phẩm. Đổi nhóm sẽ xóa từ khóa và bộ lọc.
- Chọn sắp xếp giá tăng/giảm, đánh giá hoặc Newest. Newest dựa trên thứ tự dữ liệu mẫu; đánh giá bằng nhau thì ưu tiên số lượt đánh giá.
- Bấm bộ lọc giá, đánh giá hoặc ưu đãi; kéo thanh giá rồi bấm **Go**. **× / Clear filters** bỏ lọc; **Show all products** mở lại toàn bộ danh sách khi không có kết quả.
- **Today's Deals** lọc các sản phẩm có coupon trong dữ liệu mẫu. Bấm lại để bỏ lọc.
- Bấm ảnh/tên sản phẩm để xem chi tiết, nhập số lượng rồi **Add to cart**. **View on Amazon** mở liên kết sản phẩm gốc.
- **Add to cart**, **+**, **−**, **Remove** cập nhật giỏ hàng, tổng tiền và số trên biểu tượng Cart. Số lượng tối đa là 99 mỗi sản phẩm.
- **Cart / Go to Cart** mở giỏ hàng đầy đủ. **Clear cart** xóa các món mẫu để bắt đầu chọn hàng.
- Giỏ lưu bằng `localStorage` trên trình duyệt, còn khi tải lại trang. Lần đầu có 3 món mẫu với tổng `$166.18`; tổng chưa tính vận chuyển và thuế.
- Nhấn Escape, bấm × hoặc nền ngoài hộp để đóng. Trên điện thoại, bấm **Show filters / All** để mở bộ lọc; hàng gợi ý có thể kéo ngang.

Đây là bài frontend với dữ liệu mẫu. Các liên kết tài khoản, đơn hàng và dịch vụ dẫn đến Amazon; giỏ hàng trong bài không gửi đơn hàng thật lên Amazon.

## Xem trên GitHub Pages

GitHub hiển thị source MVC. GitHub Pages chỉ phục vụ bản frontend trong `docs/`, không chạy controller C# hoặc Razor. Sau khi thư mục `docs` đã được đưa lên nhánh `main`:

1. Mở repo → **Settings → Pages**.
2. Trong **Build and deployment → Source**, chọn **Deploy from a branch**.
3. Chọn nhánh **main**, thư mục **/docs**, rồi **Save**.
4. Chờ lần triển khai hoàn tất, mở URL GitHub hiển thị: `https://ngngocloi.github.io/NguyenNgocLoi_KtraFE/`.

URL trên chỉ hoạt động sau khi Pages đã được bật và triển khai thành công. Trước đó, có thể mở `docs/index.html` trực tiếp để thử giao diện và các nút.

Khi sửa view, CSS, JavaScript hoặc ảnh, tạo lại bản Pages trước khi commit. Nếu máy có Python 3, chạy tại thư mục chứa solution:

```bash
python tools/export_preview.py
```

Trên Windows có thể dùng `py tools/export_preview.py`. Python chỉ dùng để tạo lại bản xem trước; chạy project MVC trong Visual Studio không cần Python.

## Cập nhật repo bằng Visual Studio

Mở **Git Changes**, kiểm tra các tệp đã sửa, ghi nội dung commit rồi chọn **Commit All**, sau đó **Push**. Nếu chưa đăng nhập GitHub, đăng nhập theo hộp thoại của Visual Studio và chọn repo này. Không đưa `.vs`, `bin`, `obj` lên Git.

## Kiểm tra và tài liệu

Đã kiểm tra JavaScript của bản frontend bằng trình duyệt: tìm kiếm, lọc/sắp xếp, chi tiết, thêm/xóa/đổi số lượng, tổng tiền, tải lại giỏ hàng và bố cục ở nhiều chiều rộng. Cấu hình project và đường dẫn MVC được kiểm tra từ source; môi trường kiểm tra không có Visual Studio/IIS Express trên Windows để chạy toàn bộ ứng dụng MVC.

- [ASP.NET MVC routing — Microsoft Learn](https://learn.microsoft.com/en-us/aspnet/mvc/overview/older-versions-1/controllers-and-routing/asp-net-mvc-routing-overview-cs)
- [Chọn nguồn GitHub Pages — GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
