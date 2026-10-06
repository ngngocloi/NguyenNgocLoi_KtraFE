"""Tạo docs/index.html từ view MVC, CSS, JavaScript và ảnh của bài."""
from pathlib import Path
import base64
import mimetypes
import re

root = Path(__file__).resolve().parents[1]
app = root / "NguyenNgocLoi_KtraFE"
view = app / "Views/Home/NguyenNgocLoi_KtraFE.cshtml"
html = view.read_text(encoding="utf-8-sig")

# Bỏ khối Layout của Razor; giải đường dẫn Url.Content thành tên tệp cục bộ.
html = re.sub(r"\A\s*@\{.*?\}\s*", "", html, count=1, flags=re.S)
html = re.sub(r'@Url\.Content\("~/(.*?)"\)', lambda match: match.group(1), html)
html = re.sub(r'@Url\.Action\("Index",\s*"Home"\)', "index.html", html)
if "@Url." in html:
    raise ValueError("Có biểu thức Razor chưa được xuất sang HTML.")

def data_uri(path, mime_type=None):
    mime_type = mime_type or mimetypes.guess_type(path.name)[0]
    content = base64.b64encode(path.read_bytes()).decode("ascii")
    return "data:" + mime_type + ";base64," + content

# Font Awesome giữ nguyên biểu tượng khi mở trực tiếp và khi không có mạng.
font_css = (app / "assets/fontawesome/css/all.min.css").read_text()
def inline_font(match):
    block = match.group(0)
    font_name = re.search(r"\.\./webfonts/([^./]+)\.", block).group(1)
    uri = data_uri(app / "assets/fontawesome/webfonts" / (font_name + ".woff2"), "font/woff2")
    block = re.sub(r"src:[^;}]+;?", "", block)
    return block[:-1] + ';src:url(' + uri + ') format("woff2");}'

font_css = re.sub(r"@font-face\{[^}]+\}", inline_font, font_css)
html = re.sub(r'\s*<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">', "", html)
html = html.replace('<link rel="stylesheet" href="assets/fontawesome/css/all.min.css">', "<style>\n" + font_css + "\n</style>")
css = (app / "Content/Style.css").read_text(encoding="utf-8-sig")
html = html.replace('<link rel="stylesheet" href="Content/Style.css">', "<style>\n" + css + "\n</style>")
html = re.sub(r'src="(assets/images/[^\"]+)"', lambda match: 'src="' + data_uri(app / match.group(1)) + '"', html)

# Script inline đặt cuối body để các phần tử HTML đã có trước lúc xử lý.
html = re.sub(r'^[ \t]*<script src="Scripts/scripts.js" defer></script>\r?\n?', "", html, flags=re.M)
script = (app / "Scripts/scripts.js").read_text(encoding="utf-8-sig")
if "</script>" in script.lower():
    raise ValueError("JavaScript chứa thẻ đóng script cần được xử lý trước khi nhúng.")
html = html.replace("</body>", "<script>\n" + script + "\n</script>\n</body>")

output = root / "docs"
output.mkdir(exist_ok=True)
(output / "index.html").write_text(html, encoding="utf-8")
(output / ".nojekyll").write_text("", encoding="utf-8")
print("Đã tạo docs/index.html:", len(html.encode("utf-8")), "bytes")
