using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace NguyenNgocLoi_KtraFE.Controllers
{
    public class HomeController : Controller
    {
        // Route mặc định / và /Home/Index mở trang Amazon.
        public ActionResult Index()
        {
            return View("NguyenNgocLoi_KtraFE");
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        public ActionResult NguyenNgocLoi_KtraFE()
        {
            return View();
        }
    }
}
