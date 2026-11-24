document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    function toggleMenu() {
        mainNav.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
    }

    mobileMenuToggle.addEventListener('click', toggleMenu);
    mobileMenuOverlay.addEventListener('click', toggleMenu);

    // Cart Sidebar Toggle
    const cartToggle = document.getElementById('cart-toggle');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCart = document.getElementById('close-cart');
    const cartOverlay = document.getElementById('cart-overlay');
    const returnShopBtn = document.getElementById('return-shop');

    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
    }

    cartToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCart();
    });

    closeCart.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    returnShopBtn.addEventListener('click', toggleCart);

    // Header Scroll Effect
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        }
    });

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                // Close mobile menu if open
                if (mainNav.classList.contains('active')) {
                    toggleMenu();
                }
                
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add to cart animation (simple mock)
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    const cartCount = document.querySelector('.cart-count');
    let count = 0;

    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Animation effect
            this.textContent = 'Ajouté !';
            this.classList.add('btn-primary');
            this.classList.remove('btn-outline');
            
            count++;
            cartCount.textContent = count;
            
            // Pulse animation on cart icon
            cartCount.style.transform = 'scale(1.5)';
            setTimeout(() => {
                cartCount.style.transform = 'scale(1)';
            }, 300);
            
            setTimeout(() => {
                this.textContent = 'Ajouter au panier';
                this.classList.remove('btn-primary');
                this.classList.add('btn-outline');
            }, 2000);
        });
    });
});
