(() => {
    "use strict";

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const searchInput = $("#search-input");
    const categorySelect = $("#search-category");
    const priceRange = $("#max-price");
    const sortSelect = $("#sort");
    const productDialog = $("#product-dialog");
    const cartDialog = $("#cart-dialog");
    const storageKey = "amazon-ktrafe-cart-v1";
    const maxQuantity = 99;
    const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    let toastTimer;

    // Dùng textContent thay vì ghép từ khóa vào HTML để hiển thị an toàn.
    function element(tag, className = "", text) {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function normalize(text) {
        return text.toLowerCase().normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
    }

    // Tính tiền bằng số nguyên cent để tránh sai số cộng số thập phân.
    function cents(text) {
        return Math.round(Number(text.replace(/[^\d.]/g, "")) * 100);
    }

    const money = (value) => currency.format(value / 100);
    const featuredTemplate = $(".product-card").cloneNode(true);

    // 1. ĐỌC 5 MÁY CHÀ VÀ 16 TÚI XÁCH TỪ HTML.
    const catalog = $$(".product-card, .recommendation-card").map((card, index) => {
        const isBag = card.classList.contains("recommendation-card");
        const title = card.querySelector(isBag ? ".recommendation-title" : ".product-title");
        const image = card.querySelector("img");
        const priceNode = card.querySelector(isBag ? ".recommendation-price" : ".price");
        const priceText = isBag
            ? priceNode.firstChild.textContent + "." + priceNode.querySelector("sup").textContent
            : priceNode.getAttribute("aria-label");
        const tags = isBag
            ? "fashion bags handbag handbags purse tote tui xach thoi trang"
            : "home cleaning tools scrubber brush bathroom household tile kitchen may cha ve sinh nha tam";
        const windowTag = !isBag && [0, 2].includes(index) ? " window cua so" : "";
        return {
            id: card.dataset.productId,
            name: title.textContent.trim(),
            image: image.getAttribute("src"),
            alt: image.alt,
            href: title.getAttribute("href"),
            price: cents(priceText),
            category: isBag ? "fashion" : "home",
            rating: parseFloat(card.querySelector(".stars").getAttribute("aria-label")),
            reviews: Number(card.querySelector(".rating a").textContent.replace(/\D/g, "")),
            discount: Boolean(card.querySelector(".list-price, .coupon")),
            coupon: Boolean(card.querySelector(".coupon")),
            keywords: normalize(title.textContent + " " + tags + windowTag),
            order: index,
            template: isBag ? null : card.cloneNode(true)
        };
    });

    // Ba món mẫu trong giỏ giữ nguyên bố cục của ảnh đề bài.
    const seedCards = $$("#cart-items .cart-item");
    const seedProducts = seedCards.map((card) => ({
        id: card.dataset.productId,
        name: card.dataset.name,
        image: card.querySelector("img").getAttribute("src"),
        alt: card.querySelector("img").alt,
        price: cents(card.querySelector("strong").textContent),
        deal: Boolean(card.querySelector(".deal-label")),
        href: "https://www.amazon.com/s?k=" + encodeURIComponent(card.querySelector("img").alt)
    }));
    const productsById = new Map([...catalog, ...seedProducts].map((product) => [product.id, product]));
    const initialCart = seedCards.map((card) => ({ id: card.dataset.productId, quantity: Number(card.dataset.quantity) }));
    const state = {
        query: searchInput.value.trim(), category: categorySelect.value,
        minPrice: 0, maxPrice: 200, rating: 0, deal: "", sort: "featured"
    };

    // 2. TÌM KIẾM, LỌC VÀ SẮP XẾP.
    function matchingProducts() {
        const words = normalize(state.query).split(/\s+/).filter(Boolean);
        const result = catalog.filter((product) =>
            (state.category === "aps" || product.category === state.category) &&
            words.every((word) => product.keywords.includes(word)) &&
            product.price >= state.minPrice * 100 && product.price <= state.maxPrice * 100 &&
            product.rating >= state.rating &&
            (state.deal !== "discounts" || product.discount) &&
            (state.deal !== "coupons" || product.coupon)
        );
        const sorts = {
            featured: (a, b) => a.order - b.order,
            "price-asc": (a, b) => a.price - b.price || a.order - b.order,
            "price-desc": (a, b) => b.price - a.price || a.order - b.order,
            review: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
            newest: (a, b) => b.order - a.order
        };
        return result.sort(sorts[state.sort]);
    }

    function createProductCard(product) {
        const card = (product.template || featuredTemplate).cloneNode(true);
        card.dataset.productId = product.id;
        card.dataset.priceCents = product.price;
        card.querySelector(".add-button").dataset.action = "add";
        if (!product.template) {
            const image = card.querySelector("img");
            image.src = product.image;
            image.alt = product.alt;
            card.querySelector(".product-title").textContent = product.name;
            card.querySelectorAll("a").forEach((link) => { link.href = product.href; });
            card.querySelector(".rating a").textContent = product.reviews.toLocaleString("en-US");
            card.querySelector(".price").setAttribute("aria-label", (product.price / 100).toFixed(2) + " dollars");
            card.querySelector(".whole").textContent = Math.floor(product.price / 100);
            card.querySelector(".cents").textContent = String(product.price % 100).padStart(2, "0");
            card.querySelectorAll(".sponsored, .bought, .list-price, .coupon, .sustainability").forEach((node) => node.remove());
            card.querySelector(".delivery-info strong").textContent = "Nov 11 – Dec 5";
        }
        return card;
    }

    function clearFilters() {
        state.minPrice = 0;
        state.maxPrice = 200;
        state.rating = 0;
        state.deal = "";
    }

    function updatePriceLabel() {
        $("#price-label").textContent = "$0 – $" + priceRange.value + (priceRange.value === "200" ? "+" : "");
    }

    function filterChip(label, filter) {
        const button = element("button", "filter-chip", label + " ×");
        button.type = "button";
        button.dataset.action = "remove-filter";
        button.dataset.filter = filter;
        button.setAttribute("aria-label", "Remove filter: " + label);
        return button;
    }

    function renderFilters() {
        const container = $("#active-filters");
        container.replaceChildren();
        if (state.minPrice !== 0 || state.maxPrice !== 200) {
            container.append(filterChip("Price: $" + state.minPrice + " – $" + state.maxPrice, "price"));
        }
        if (state.rating) container.append(filterChip("4 stars & up", "rating"));
        if (state.deal) container.append(filterChip(state.deal === "coupons" ? "Today's Deals" : "Discounts", "deal"));
        const hasFilters = container.childElementCount > 0;
        container.hidden = !hasFilters;
        if (hasFilters) {
            const clear = element("button", "clear-filters", "Clear filters");
            clear.type = "button";
            clear.dataset.action = "clear-filters";
            container.append(clear);
        }
        priceRange.value = state.maxPrice;
        updatePriceLabel();
        $$("[data-rating], [data-deal], [data-min]").forEach((link) => {
            const selected = link.hasAttribute("data-rating") ? state.rating === Number(link.dataset.rating)
                : link.hasAttribute("data-deal") ? state.deal === link.dataset.deal
                    : state.minPrice === Number(link.dataset.min) && state.maxPrice === Number(link.dataset.max);
            link.classList.toggle("is-active", selected);
            link.setAttribute("role", "button");
            link.setAttribute("aria-pressed", String(selected));
        });
    }

    function renderProducts(scroll = false) {
        const result = matchingProducts();
        $(".product-grid").replaceChildren(...result.map(createProductCard));
        $("#empty-results").hidden = result.length > 0;
        const summary = $("#results-summary");
        summary.textContent = result.length + (result.length === 1 ? " result" : " results");
        if (state.query) {
            summary.append(document.createTextNode(" for "), element("b", "", '"' + state.query + '"'));
        }
        if (state.category !== "aps") summary.append(document.createTextNode(" in " + (state.category === "home" ? "Home" : "Fashion")));
        renderFilters();
        if (scroll) $("#results").scrollIntoView({ block: "start" });
    }

    function showAllProducts() {
        state.query = searchInput.value = "";
        state.category = categorySelect.value = "aps";
        state.sort = sortSelect.value = "featured";
        clearFilters();
        renderProducts(true);
    }

    function toggleFilters() {
        const isOpen = $("#filters").classList.toggle("is-open");
        const button = $(".mobile-filter-toggle");
        button.setAttribute("aria-expanded", String(isOpen));
        button.textContent = isOpen ? "Hide filters" : "Show filters";
    }

    // 3. GIỎ HÀNG VÀ LOCALSTORAGE.
    function loadCart() {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved === null) return initialCart;
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) return initialCart;
            const validated = new Map();
            parsed.forEach((item) => {
                if (item && productsById.has(item.id) && Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= maxQuantity) {
                    validated.set(item.id, Math.min(maxQuantity, (validated.get(item.id) || 0) + item.quantity));
                }
            });
            return Array.from(validated, ([id, quantity]) => ({ id, quantity }));
        } catch {
            // Nếu trình duyệt chặn lưu trữ, các thao tác vẫn chạy trong lần mở này.
            return initialCart;
        }
    }

    let cart = loadCart();

    function saveCart() {
        try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch { /* Vẫn dùng giỏ hàng trong bộ nhớ. */ }
    }

    function notify(message) {
        const toast = $("#status-message");
        toast.textContent = message;
        toast.hidden = false;
        const feedback = productDialog.open ? $("#detail-feedback") : cartDialog.open ? $("#cart-feedback") : null;
        if (feedback) {
            feedback.textContent = message;
            feedback.hidden = false;
        }
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.hidden = true;
            $$(".modal-feedback").forEach((node) => { node.hidden = true; });
        }, 3500);
    }

    function cartButton(action, label, icon) {
        const button = element("button");
        button.type = "button";
        button.dataset.action = action;
        button.setAttribute("aria-label", label);
        const symbol = element("i", "fas fa-" + icon);
        symbol.setAttribute("aria-hidden", "true");
        button.append(symbol);
        return button;
    }

    function quantityControl(item, name) {
        const controls = element("div", "quantity-control");
        controls.setAttribute("aria-label", "Quantity: " + item.quantity);
        controls.append(
            cartButton("decrease", item.quantity === 1 ? "Remove " + name : "Decrease quantity of " + name, item.quantity === 1 ? "trash-alt" : "minus"),
            element("span", "", item.quantity),
            cartButton("increase", "Increase quantity of " + name, "plus")
        );
        controls.lastElementChild.disabled = item.quantity >= maxQuantity;
        return controls;
    }

    function createMiniCartItem(item) {
        const product = productsById.get(item.id);
        const card = element("article", "cart-item");
        card.dataset.cartId = item.id;
        const preview = element("button", "cart-product-preview");
        preview.type = "button";
        preview.dataset.action = "details";
        preview.dataset.productId = item.id;
        preview.setAttribute("aria-label", "View " + product.name);
        const image = element("img");
        image.src = product.image;
        image.alt = product.alt;
        preview.append(image);
        card.append(preview);
        if (product.deal) card.append(element("span", "deal-label", "Limited time deal"));
        card.append(element("strong", "", money(product.price)), quantityControl(item, product.name));
        return card;
    }

    function createFullCartItem(item) {
        const product = productsById.get(item.id);
        const row = element("article", "cart-dialog-item");
        row.dataset.cartId = item.id;
        const image = element("img");
        image.src = product.image;
        image.alt = product.alt;
        const content = element("div", "cart-dialog-description");
        content.append(element("h3", "", product.name), element("p", "", money(product.price) + " each"));
        const actions = element("div", "cart-row-actions");
        const label = element("label", "", "Quantity ");
        const input = element("input", "quantity-input");
        input.type = "number";
        input.min = "1";
        input.max = String(maxQuantity);
        input.step = "1";
        input.value = item.quantity;
        input.dataset.action = "quantity";
        input.setAttribute("aria-label", "Quantity of " + product.name);
        label.append(input);
        const remove = element("button", "remove-cart-item", "Remove");
        remove.type = "button";
        remove.dataset.action = "remove";
        remove.setAttribute("aria-label", "Remove " + product.name);
        actions.append(label, remove);
        content.append(actions);
        row.append(image, content, element("strong", "cart-line-total", money(product.price * item.quantity)));
        return row;
    }

    function renderCart() {
        // Giữ vị trí bàn phím khi nút tăng/giảm làm giỏ hàng được vẽ lại.
        const focused = document.activeElement;
        const focusedRow = focused.closest("[data-cart-id]");
        const focusId = focusedRow && focusedRow.dataset.cartId;
        const focusAction = focused.dataset.action;
        const focusRoot = cartDialog.contains(focused) ? cartDialog : $("#cart");
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = cart.reduce((sum, item) => sum + productsById.get(item.id).price * item.quantity, 0);
        $(".cart-count").textContent = count;
        $(".cart-link").setAttribute("aria-label", "Cart, " + count + " items");
        $(".subtotal").textContent = money(total);
        $("#cart-items").replaceChildren(...cart.map(createMiniCartItem));
        $("#empty-cart").hidden = cart.length > 0;
        $("#cart-dialog-heading").textContent = "Shopping Cart (" + count + (count === 1 ? " item)" : " items)");
        $("#cart-dialog-items").replaceChildren(...cart.map(createFullCartItem));
        if (!cart.length) $("#cart-dialog-items").append(element("p", "empty-cart-message", "Your cart is empty. Add a product to start shopping."));
        $("#cart-dialog-total").textContent = "Subtotal (" + count + (count === 1 ? " item): " : " items): ") + money(total);
        $("#clear-cart").disabled = !cart.length;
        if (focusId && focusAction) {
            const replacement = focusRoot.querySelector('[data-cart-id="' + focusId + '"] [data-action="' + focusAction + '"]');
            (replacement || focusRoot.querySelector(cartDialog.open ? "[data-close-dialog]" : ".go-cart")).focus({ preventScroll: true });
        }
    }

    function addToCart(id, quantity = 1) {
        const existing = cart.find((item) => item.id === id);
        const oldQuantity = existing ? existing.quantity : 0;
        const nextQuantity = Math.min(maxQuantity, oldQuantity + quantity);
        if (nextQuantity === oldQuantity) return notify("Maximum quantity is 99 per product.");
        if (existing) existing.quantity = nextQuantity;
        else cart.push({ id, quantity: nextQuantity });
        saveCart();
        renderCart();
        notify("Added " + (nextQuantity - oldQuantity) + " to cart.");
    }

    function setQuantity(id, quantity) {
        const item = cart.find((entry) => entry.id === id);
        if (!item) return;
        if (quantity === 0) {
            cart = cart.filter((entry) => entry.id !== id);
            notify("Product removed from cart.");
        } else if (Number.isInteger(quantity) && quantity >= 1 && quantity <= maxQuantity) {
            item.quantity = quantity;
        } else notify("Enter a whole quantity from 1 to 99.");
        saveCart();
        renderCart();
    }

    // 4. CHI TIẾT SẢN PHẨM.
    function showProduct(id) {
        const product = productsById.get(id);
        if (!product) return;
        const layout = element("div", "product-detail-layout");
        const image = element("img", "detail-image");
        image.src = product.image;
        image.alt = product.alt;
        const content = element("div", "product-detail-content");
        content.append(element("h3", "", product.name));
        if (product.rating) content.append(element("p", "detail-rating", "★ " + product.rating + " / 5 · " + product.reviews.toLocaleString("en-US") + " reviews"));
        content.append(element("strong", "detail-price", money(product.price)), element("p", "", "Ships to Vietnam"));
        const label = element("label", "detail-quantity", "Quantity ");
        const input = element("input", "quantity-input");
        input.id = "detail-quantity";
        input.type = "number";
        input.min = "1";
        input.max = "99";
        input.step = "1";
        input.value = "1";
        label.append(input);
        const add = element("button", "add-button", "Add to cart");
        add.type = "button";
        add.dataset.action = "detail-add";
        add.dataset.productId = id;
        const original = element("a", "original-product-link", "View on Amazon");
        original.href = product.href;
        original.target = "_blank";
        original.rel = "noopener noreferrer";
        const feedback = element("p", "modal-feedback");
        feedback.id = "detail-feedback";
        feedback.hidden = true;
        feedback.setAttribute("role", "status");
        feedback.setAttribute("aria-live", "polite");
        content.append(label, add, feedback, original);
        layout.append(image, content);
        $("#product-details").replaceChildren(layout);
        if (!productDialog.open) productDialog.showModal();
    }

    // 5. CÁC SỰ KIỆN: Enter, nút tìm kiếm, chọn bộ lọc, giỏ hàng, đóng hộp.
    $(".search-bar").addEventListener("submit", (event) => {
        event.preventDefault();
        state.query = searchInput.value.trim();
        state.category = categorySelect.value;
        renderProducts(true);
    });
    categorySelect.addEventListener("change", () => {
        state.category = categorySelect.value;
        state.query = searchInput.value = "";
        clearFilters();
        renderProducts();
    });
    sortSelect.addEventListener("change", () => { state.sort = sortSelect.value; renderProducts(); });
    priceRange.addEventListener("input", updatePriceLabel);
    $("#apply-price").addEventListener("click", () => {
        state.minPrice = 0;
        state.maxPrice = Number(priceRange.value);
        renderProducts();
    });
    $(".mobile-filter-toggle").addEventListener("click", toggleFilters);

    document.addEventListener("change", (event) => {
        if (event.target.dataset.action === "quantity") {
            setQuantity(event.target.closest("[data-cart-id]").dataset.cartId, Number(event.target.value));
        }
    });

    document.addEventListener("click", (event) => {
        const close = event.target.closest("[data-close-dialog]");
        if (close) return close.closest("dialog").close();
        const button = event.target.closest("[data-action]");
        if (button) {
            const action = button.dataset.action;
            const row = button.closest("[data-cart-id]");
            const item = row && cart.find((entry) => entry.id === row.dataset.cartId);
            if (action === "add") addToCart(button.closest(".product-card").dataset.productId);
            if (action === "detail-add" && $("#detail-quantity").reportValidity()) addToCart(button.dataset.productId, Number($("#detail-quantity").value));
            if (action === "details") showProduct(button.dataset.productId);
            if (action === "open-cart") cartDialog.showModal();
            if (action === "show-all") showAllProducts();
            if (action === "clear-cart") { cart = []; saveCart(); renderCart(); notify("Cart cleared."); }
            if (item && action === "increase") setQuantity(item.id, item.quantity + 1);
            if (item && action === "decrease") setQuantity(item.id, item.quantity - 1);
            if (item && action === "remove") setQuantity(item.id, 0);
            if (action === "clear-filters") { clearFilters(); renderProducts(); }
            if (action === "remove-filter") {
                if (button.dataset.filter === "price") { state.minPrice = 0; state.maxPrice = 200; }
                if (button.dataset.filter === "rating") state.rating = 0;
                if (button.dataset.filter === "deal") state.deal = "";
                renderProducts();
            }
            return;
        }
        const link = event.target.closest("a");
        if (!link) return;
        const card = link.closest(".product-card, .recommendation-card");
        if (card) { event.preventDefault(); return showProduct(card.dataset.productId); }
        if (link.classList.contains("cart-link")) { event.preventDefault(); return cartDialog.showModal(); }
        if (link.classList.contains("all-menu")) {
            event.preventDefault();
            if (window.matchMedia("(max-width: 700px)").matches) toggleFilters();
            $("#filters").scrollIntoView({ block: "start" });
            return;
        }
        if (link.hasAttribute("data-search")) {
            event.preventDefault();
            state.query = searchInput.value = link.dataset.search;
            state.category = categorySelect.value = link.dataset.category || "aps";
            clearFilters();
            renderProducts(true);
        } else if (link.hasAttribute("data-rating")) {
            event.preventDefault();
            state.rating = state.rating ? 0 : Number(link.dataset.rating);
            renderProducts();
        } else if (link.hasAttribute("data-deal")) {
            event.preventDefault();
            const nextDeal = state.deal === link.dataset.deal ? "" : link.dataset.deal;
            if (link.closest(".header-nav")) {
                state.query = searchInput.value = "";
                state.category = categorySelect.value = "aps";
                clearFilters();
            }
            state.deal = nextDeal;
            renderProducts();
        } else if (link.hasAttribute("data-min")) {
            event.preventDefault();
            state.minPrice = Number(link.dataset.min);
            state.maxPrice = Number(link.dataset.max);
            renderProducts();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === " " && event.target.matches('a[role="button"]')) {
            event.preventDefault();
            event.target.click();
        }
    });
    [productDialog, cartDialog].forEach((dialog) => {
        dialog.addEventListener("click", (event) => {
            // Đóng khi bấm phần nền ngoài hộp; Escape do thẻ dialog xử lý sẵn.
            const box = dialog.getBoundingClientRect();
            if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
        });
    });

    renderProducts();
    renderCart();
})();
