

// Global function to prevent reference errors
window.setupPriceFilter = function() {
  // Empty function to prevent reference errors
  console.log("Price filter setup called");
};

// Variables for image navigation
let currentImageIndex = 0;
let productImages = [];

// DOM elements
const carouselTrackEl = document.getElementById("carouselTrack");
const prevButtonEl = document.getElementById("prevButton");
const nextButtonEl = document.getElementById("nextButton");
const productGridEl = document.getElementById("productGrid");
const loadMoreBtnEl = document.getElementById("loadMoreBtn");
const currentYearEl = document.getElementById("currentYear");
const cartIconEl = document.getElementById("cartIcon");
const cartCountEl = document.getElementById("cartCount");

// Filter elements
const filterBtnEl = document.getElementById("filterBtn");
const filterButtons = document.querySelectorAll(".filter-btn");
const filterModalEl = document.getElementById("filterModal");
const closeFilterButtonEl = document.getElementById("closeFilterButton");
const resetFilterBtnEl = document.getElementById("resetFilter");
const applyFilterBtnEl = document.getElementById("applyFilterButton");
const filterOptionsEl = document.getElementById("filterOptions");

// Modal elements
const cartModalEl = document.getElementById("cartModal");
const closeCartButtonEl = document.getElementById("closeCartButton");
const cartItemsEl = document.getElementById("cartItems");
const emptyCartMessageEl = document.getElementById("emptyCartMessage");
const checkoutFormEl = document.getElementById("checkoutForm");
const subtotalEl = document.getElementById("subtotal");
const deliveryTotalEl = document.getElementById("deliveryTotal");
const orderTotalEl = document.getElementById("orderTotal");
const checkoutButtonEl = document.getElementById("checkoutButton");

const productModalEl = document.getElementById("productModal");
const closeProductButtonEl = document.getElementById("closeProductButton");
const productModalTitleEl = document.getElementById("productModalTitle");
const productModalImageEl = document.getElementById("productModalImage");
const productModalPriceEl = document.getElementById("productModalPrice");
const productModalDescriptionEl = document.getElementById("productModalDescription");
const productModalCategoryEl = document.getElementById("productModalCategory");
const productModalAvailabilityEl = document.getElementById("productModalAvailability");
const decreaseQuantityEl = document.getElementById("decreaseQuantity");
const productQuantityEl = document.getElementById("productQuantity");
const increaseQuantityEl = document.getElementById("increaseQuantity");
const addToCartButtonEl = document.getElementById("addToCartButton");
const shareProductButtonEl = document.getElementById("shareProductButton");

const confirmationModalEl = document.getElementById("confirmationModal");
const closeConfirmationButtonEl = document.getElementById("closeConfirmationButton");
const confirmationDetailsEl = document.getElementById("confirmationDetails");
const continueShoppingEl = document.getElementById("continueShopping");

// Form elements
const nameEl = document.getElementById("name");
const nameErrorEl = document.getElementById("nameError");
const phoneEl = document.getElementById("phone");
const phoneErrorEl = document.getElementById("phoneError");
const addressEl = document.getElementById("address");
const addressErrorEl = document.getElementById("addressError");
const deliveryOptionEls = document.getElementsByName("deliveryOption");
const deliveryOptionErrorEl = document.getElementById("deliveryOptionError");
const homeDeliveryDetailsEl = document.getElementById("homeDeliveryDetails");
const societyEl = document.getElementById("society");
const societyErrorEl = document.getElementById("societyError");
const deliveryFeeEl = document.getElementById("deliveryFee");

// Global state variables
let currentSlide = 0;
let selectedCategory = "all";
let priceFilter = 1000;
let selectedProduct = null;
let visibleProductCount = 8;
let cartItems = [];
let deliveryFee = 0;
let selectedCategories = [];
const API_BASE_URL = ' https://junglibear.onrender.com/api';
let products = [];
let carouselItems = [];
let nextOrderID= 1
let orderId = 0
async function fetchProducts() {
    try {
        // Show loading state
        if (productGridEl) {
            productGridEl.innerHTML = '<div class="loading-spinner"></div>';
        }
        
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        products = data;

        // Ensure there are products to work with
        if (!products || products.length === 0) {
            throw new Error("No products found");
        }
        
        // Find max product price and round up to nearest 100
        const maxProductPrice = Math.max(...products.map(p => p.price || 0));
        priceFilter = Math.ceil(maxProductPrice / 100) * 100;
        
        console.log("Fetched products:", products.length);
        console.log("Max product price:", maxProductPrice);

        // Extract carousel items
        carouselItems = products
            .filter(item => item.inCarousel === true)
            .map(item => ({
                id: item.id,
                image: item.images && item.images.length > 0 ? item.images[0] : 'placeholder.jpg',
                title: item.carouselTitle || item.title || "No Title",
                subtitle: item.carouselSubtitle || "Quality Product",
                productId: item.id
            }));
            
        console.log("Carousel items:", carouselItems.length);

        // Make them globally available
        window.products = products;
        window.carouselItems = carouselItems;

        // Preload carousel images
        if (carouselItems.length > 0) {
            const carouselImageUrls = carouselItems.map(item => item.image);
            try {
                await Promise.all(carouselImageUrls.map(url => {
                    return new Promise((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve();
                        img.onerror = () => resolve(); // Continue even if image fails to load
                        img.src = url;
                    });
                }));
                console.log("Carousel images preloaded");
            } catch (error) {
                console.warn("Error preloading carousel images:", error);
            }
        }

        // Fire a custom event once data is ready
        window.dispatchEvent(new Event('productsReady'));
        
        // Initialize the application with the fetched data
        init();
    } catch (err) {
        console.error("Fetch error:", err);
        if (productGridEl) {
            productGridEl.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 2rem;">
                    <p>Failed to load products. Please try again later.</p>
                    <button class="button" onclick="fetchProducts()">Retry</button>
                </div>
            `;
        }
    }
}



console.log("Next Order ID:", nextOrderID);
// Initialize the application
function init() {
  // Set current year in footer
  currentYearEl.textContent = new Date().getFullYear();
  
  // Initialize carousel
  setupCarousel();
  
  // Initialize category filter
  populateCategories();
  
  // Check for product ID in URL
  checkForProductInURL();
  
  // Render initial products
  filterAndRenderProducts();
  
  // Load cart from local storage if available
  loadCartFromStorage();
  
  // Set up event listeners
  setupEventListeners();
  
}

// Check for product ID in URL
function checkForProductInURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  
  if (productId) {
    const id = parseInt(productId);
    const product = findProductById(id);
    
    if (product) {
      // Open the product modal after a short delay to ensure DOM is ready
      setTimeout(() => {
        openProductModal(product);
      }, 300);
    }
  }
}

// Handle popstate event for back/forward browser navigation
window.addEventListener('popstate', (event) => {
  // Check if there's a product ID in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('product');
  
  if (productId) {
    const id = parseInt(productId);
    const product = findProductById(id);
    
    if (product) {
      // Open the product modal
      openProductModal(product);
    }
  } else {
    // If no product ID in URL, close any open product modal
    closeProductModal();
  }
});

// Find product by ID
function findProductById(id) {
  return products.find(product => product.id === id);
}

// Carousel setup and functions
function setupCarousel() {
  // Check if carouselTrackEl exists and we have carousel items
  if (!carouselTrackEl) {
    console.warn("Carousel track element not found");
    return;
  }
  
  if (!carouselItems || carouselItems.length === 0) {
    console.warn("No carousel items to display");
    carouselTrackEl.innerHTML = `
      <div class="carousel-slide">
        <div class="carousel-content" style="color: #333; text-shadow: none; position: static; transform: none; margin: auto; text-align: center;">
          <h2>Welcome to JungliBear</h2>
          <p>Quality products for your home</p>
        </div>
      </div>
    `;
    return;
  }
  
  console.log("Setting up carousel with", carouselItems.length, "items");
  
  // Clear existing slides
  carouselTrackEl.innerHTML = '';
  
  // Create carousel slides
  carouselItems.forEach(item => {
    const slide = document.createElement("div");
    slide.className = "carousel-slide";
    slide.innerHTML = `
      <img src="${item.image}" alt="${item.title}" loading="eager">
      <div class="carousel-content">
        <h2>${item.title}</h2>
        <p>${item.subtitle}</p>
        <button class="button" data-product-id="${item.productId}">View Product</button>
      </div>
    `;
    carouselTrackEl.appendChild(slide);
  });
  
  // Set initial slide position
  currentSlide = 0; // Reset to first slide
  updateCarouselPosition();
  
  // Set up carousel buttons
  if (prevButtonEl) {
    prevButtonEl.removeEventListener("click", previousSlide);
    prevButtonEl.addEventListener("click", previousSlide);
  }
  
  if (nextButtonEl) {
    nextButtonEl.removeEventListener("click", nextSlide);
    nextButtonEl.addEventListener("click", nextSlide);
  }
  
  // Add click event for buttons in carousel
  const carouselButtons = carouselTrackEl.querySelectorAll('button[data-product-id]');
  carouselButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = parseInt(button.getAttribute('data-product-id'));
      const product = findProductById(productId);
      if (product) {
        openProductModal(product);
      }
    });
  });
  
  // Start carousel auto-rotation
  startCarouselAutoRotation();
}

function startCarouselAutoRotation() {
  setInterval(nextSlide, 5000);
}

function previousSlide() {
  // Get the number of slides by checking how many carousel slides are in the DOM
  const numSlides = document.querySelectorAll('.carousel-slide').length;
  currentSlide = (currentSlide === 0) ? numSlides - 1 : currentSlide - 1;
  updateCarouselPosition();
}

function nextSlide() {
  // Get the number of slides by checking how many carousel slides are in the DOM
  const numSlides = document.querySelectorAll('.carousel-slide').length;
  currentSlide = (currentSlide === numSlides - 1) ? 0 : currentSlide + 1;
  updateCarouselPosition();
}

function updateCarouselPosition() {
  if (carouselTrackEl) {
    carouselTrackEl.style.transform = `translateX(-${currentSlide * 100}%)`;
  }
}

// Filter functions
function populateCategories() {
  // Get unique categories
  const categories = [...new Set(products.map(product => product.category))];
  
  // Add filter buttons for horizontal scrolling categories
  const filterButtonsContainer = document.querySelector('.filter-buttons');
  
  if (filterButtonsContainer) {
    // Clear existing category buttons except the first two
    const existingButtons = filterButtonsContainer.querySelectorAll('.filter-btn');
    existingButtons.forEach((btn, index) => {
      if (index > 1) { // Skip the Filter and All buttons
        btn.remove();
      }
    });
    
    // Add category buttons after the first two buttons (Filter and All)
    categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'filter-btn';
      button.dataset.category = category;
      button.textContent = capitalizeFirstLetter(category);
      filterButtonsContainer.appendChild(button);
      
      // Add click event
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        // Add active class to clicked button
        button.classList.add('active');
        selectedCategory = category;
        filterAndRenderProducts();
      });
    });
    
    // Add event listener to filter buttons
    const allButton = document.querySelector('.filter-btn[data-category="all"]');
    if (allButton) {
      allButton.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        allButton.classList.add('active');
        selectedCategory = 'all';
        filterAndRenderProducts();
      });
    }
    
    // Set up filter modal
    setupFilterModal(categories);
  }
}

// Setup filter modal
function setupFilterModal(categories) {
  // Get modal elements
  if (filterModalEl) {
    const filterOptionsEl = document.getElementById('filterOptions');
        
    // Insert price filter at the top of filter options
    if (filterOptionsEl) {
      // Remove old price filter if it exists
      // Setup price slider events
      const minPriceRange = document.getElementById('minPriceRange');
      const maxPriceRange = document.getElementById('maxPriceRange');
      const minPriceValue = document.getElementById('minPriceValue');
      const maxPriceValue = document.getElementById('maxPriceValue');
      
      if (minPriceRange && maxPriceRange) {
        // Setup min price slider
        minPriceRange.addEventListener('input', () => {
          const minVal = parseInt(minPriceRange.value);
          const maxVal = parseInt(maxPriceRange.value);
          
          // Prevent min from exceeding max
          if (minVal > maxVal) {
            minPriceRange.value = maxVal;
          }
          
          // Update display value
          if (minPriceValue) {
            minPriceValue.textContent = minPriceRange.value;
          }
        });
        
        // Setup max price slider
        maxPriceRange.addEventListener('input', () => {
          const minVal = parseInt(minPriceRange.value);
          const maxVal = parseInt(maxPriceRange.value);
          
          // Prevent max from being less than min
          if (maxVal < minVal) {
            maxPriceRange.value = minVal;
          }
          
          // Update display value
          if (maxPriceValue) {
            maxPriceValue.textContent = maxPriceRange.value;
          }
        });
      }
    }
    
    // Add category checkboxes if element exists
    if (filterOptionsEl) {
      // Create categories section
      const categoriesSection = document.createElement('div');
      categoriesSection.className = 'filter-section';
      
      // Add category options
      categories.forEach(category => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        option.innerHTML = `
          <input type="checkbox" id="filter-${category}" value="${category}">
          <label for="filter-${category}">${capitalizeFirstLetter(category)}</label>
        `;
        categoriesSection.appendChild(option);
      });
      
      // Add categories section to filter options
      filterOptionsEl.appendChild(categoriesSection);
    }
    
    // Set up filter modal buttons
    if (filterBtnEl) {
      filterBtnEl.addEventListener('click', () => {
        filterModalEl.classList.add('show');
      });
    }
    
    if (closeFilterButtonEl) {
      closeFilterButtonEl.addEventListener('click', () => {
        filterModalEl.classList.remove('show');
      });
    }
    
    // Apply filters button
    if (applyFilterBtnEl) {
      applyFilterBtnEl.addEventListener('click', () => {
        // Get selected categories if element exists
        if (filterOptionsEl) {
          selectedCategories = Array.from(
            document.querySelectorAll('#filterOptions input[type="checkbox"]:checked')
          ).map(checkbox => checkbox.value);
        }
        
        filterModalEl.classList.remove('show');
        filterAndRenderProducts();
      });
    }
    
    // Reset filter button
    if (resetFilterBtnEl) {
      resetFilterBtnEl.addEventListener('click', () => {
        // Reset price slider if element exists
        if (modalPriceRangeEl && modalPriceRangeValueEl) {
          modalPriceRangeEl.value = 1000;
          priceFilter = 1000;
          modalPriceRangeValueEl.textContent = `₹1000`;
        }
        
        // Clear all checkboxes if elements exist
        if (filterOptionsEl) {
          const checkboxes = filterModalEl.querySelectorAll('input[type="checkbox"]');
          checkboxes.forEach(checkbox => {
            checkbox.checked = false;
          });
        }
        
        selectedCategories = [];
      });
    }
  }
}

// Product rendering functions
function filterAndRenderProducts() {
  // Get values from price range sliders
  const minPriceRange = document.getElementById('minPriceRange');
  const maxPriceRange = document.getElementById('maxPriceRange');
  
  // Set default min/max price values
  let minPrice = 0;
  let maxPrice = priceFilter;
  
  // Get values from sliders if they exist
  if (minPriceRange && maxPriceRange) {
    minPrice = parseInt(minPriceRange.value);
    maxPrice = parseInt(maxPriceRange.value);
    console.log(`Applying price filter: ₹${minPrice} - ₹${maxPrice}`);
  }
  
  // Apply filters
  const filtered = products.filter(product => {
    // Hide out-of-stock products
    if (product.inStock === false) {
      return false;
    }
    
    // Handle dual price filter
    const productPrice = product.price || 0;
    const matchesPrice = productPrice >= minPrice && productPrice <= maxPrice;
    
    // Handle category filter
    let matchesCategory = true;
    if (selectedCategory !== 'all') {
      matchesCategory = product.category === selectedCategory;
    }
    
    // Handle selected categories from modal
    let matchesSelectedCategories = true;
    if (selectedCategories.length > 0) {
      matchesSelectedCategories = selectedCategories.includes(product.category);
    }
    
    return matchesPrice && matchesCategory && matchesSelectedCategories;
  });
  
  // Clear product grid
  if (productGridEl) {
    productGridEl.innerHTML = '';
    
    // Render products
    if (filtered.length === 0) {
      productGridEl.innerHTML = `
        <div class="no-products-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
          <p>No products found matching your criteria.</p>
        </div>
      `;
      return;
    }
    
    // Make grid responsive based on screen size
    const screenWidth = window.innerWidth;
    if (screenWidth >= 1200) {
      productGridEl.style.gridTemplateColumns = 'repeat(5, 1fr)'; // 5 per row on large screens
    } else if (screenWidth >= 992) {
      productGridEl.style.gridTemplateColumns = 'repeat(4, 1fr)'; // 4 per row on medium-large screens
    } else if (screenWidth >= 768) {
      productGridEl.style.gridTemplateColumns = 'repeat(3, 1fr)'; // 3 per row on medium screens
    } else if (screenWidth >= 576) {
      productGridEl.style.gridTemplateColumns = 'repeat(2, 1fr)'; // 2 per row on small screens
    } else {
      productGridEl.style.gridTemplateColumns = 'repeat(1, 1fr)'; // 1 per row on very small screens
    }
    
    // Show only a certain number of products
    const productsToShow = filtered.slice(0, visibleProductCount);
    
    // Render products
    productsToShow.forEach(product => {
      const productCard = renderProductCard(product);
      productGridEl.appendChild(productCard);
    });
    
    // Show or hide load more button
    if (loadMoreBtnEl) {
      if (filtered.length > visibleProductCount) {
        loadMoreBtnEl.style.display = 'block';
      } else {
        loadMoreBtnEl.style.display = 'none';
      }
    }
  }
}

function renderProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  
  // Prepare product image
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : 'placeholder.jpg';
  
  card.innerHTML = `
    <div class="product-image">
      <img src="${imageUrl}" alt="${product.title}">
      <button class="share-button" data-product-id="${product.id}" aria-label="Share product">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      </button>
    </div>
    <div class="product-card-content">
      <h3 class="product-title">${product.title}</h3>
      <div class="product-price">₹${product.price.toFixed(2)}</div>
      <div class="product-card-actions">
        <button class="button view-product-button" data-product-id="${product.id}">View Product</button>
        <button class="button button-outline add-to-cart-button" data-product-id="${product.id}">Add to Cart</button>
      </div>
    </div>
  `;
  
  // Add event listeners
  card.querySelector('.view-product-button').addEventListener('click', () => {
    openProductModal(product);
  });
  
  card.querySelector('.add-to-cart-button').addEventListener('click', () => {
    addToCart(product, 1);
    showAddedToCartNotification(product.title);
  });
  
  card.querySelector('.share-button').addEventListener('click', (e) => {
    e.stopPropagation();
    shareProduct(product);
  });
  
  // Make the entire card clickable to open product modal
  card.addEventListener('click', (e) => {
    // Only open modal if not clicking a button
    if (!e.target.closest('button')) {
      openProductModal(product);
    }
  });
  
  return card;
}

// Open product modal
function openProductModal(product) {
  selectedProduct = product;
  
  // Update product details in modal
  if (productModalTitleEl) productModalTitleEl.textContent = product.title;
  if (productModalPriceEl) productModalPriceEl.textContent = `₹${product.price.toFixed(2)}`;
  if (productModalDescriptionEl) productModalDescriptionEl.textContent = product.description || 'No description available.';
  if (productModalCategoryEl) productModalCategoryEl.textContent = capitalizeFirstLetter(product.category || 'Uncategorized');
  
  // Update availability
  if (productModalAvailabilityEl) {
    const availabilityText = product.inStock ? 'In Stock' : 'Out of Stock';
    const availabilityClass = product.inStock ? 'in-stock' : 'out-of-stock';
    productModalAvailabilityEl.textContent = availabilityText;
    productModalAvailabilityEl.className = `product-availability ${availabilityClass}`;
  }
  
  // Reset quantity
  if (productQuantityEl) productQuantityEl.value = 1;
  
  // Set product images
  productImages = product.images || [];
  currentImageIndex = 0;
  
  // Create thumbnails
  const thumbnailsContainer = document.getElementById('productThumbnails');
  if (thumbnailsContainer) {
    thumbnailsContainer.innerHTML = '';
    
    productImages.forEach((imgUrl, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = `product-thumbnail ${index === 0 ? 'active' : ''}`;
      thumbnail.innerHTML = `<img src="${imgUrl}" alt="${product.title} - Image ${index + 1}">`;
      thumbnail.addEventListener('click', () => {
        currentImageIndex = index;
        updateModalImage();
        updateActiveThumbnail();
      });
      thumbnailsContainer.appendChild(thumbnail);
    });
  }
  
  // Update main product image
  updateModalImage();
  
  // Update URL with product ID
  updateURLWithProductId(product.id);
  
  // Show modal
  if (productModalEl) {
    productModalEl.classList.add('show');
    
    // Disable scrolling on body
    document.body.style.overflow = 'hidden';
  }
}

// Close product modal
function closeProductModal() {
  if (productModalEl) {
    productModalEl.classList.remove('show');
    document.body.style.overflow = '';
    
    // Update URL to remove product ID
    updateURLWithoutProductId();
  }
}

// Navigate to previous image
function navigateToPreviousImage(e) {
  e.stopPropagation();
  if (productImages.length <= 1) return;
  
  currentImageIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
  updateModalImage();
  updateActiveThumbnail();
}

// Navigate to next image
function navigateToNextImage(e) {
  e.stopPropagation();
  if (productImages.length <= 1) return;
  
  currentImageIndex = (currentImageIndex + 1) % productImages.length;
  updateModalImage();
  updateActiveThumbnail();
}

// Update modal image
function updateModalImage() {
  if (productModalImageEl) {
    if (productImages.length === 0) {
      productModalImageEl.src = 'placeholder.jpg';
      return;
    }
    
    productModalImageEl.src = productImages[currentImageIndex];
    productModalImageEl.alt = `${selectedProduct.title} - Image ${currentImageIndex + 1}`;
  }
}

// Update active thumbnail
function updateActiveThumbnail() {
  const thumbnails = document.querySelectorAll('.product-thumbnail');
  thumbnails.forEach((thumb, index) => {
    if (index === currentImageIndex) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

// Add to cart
function addToCart(product, quantity) {
  // Find if product already exists in cart
  const existingItem = cartItems.find(item => item.id === product.id);
  
  if (existingItem) {
    // Update quantity if product already in cart
    existingItem.quantity += quantity;
  } else {
    // Add new item to cart
    cartItems.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : 'placeholder.jpg',
      quantity: quantity
    });
  }
  
  // Update cart UI and save to storage
  updateCartQuantity(product.id, quantity);
  saveCartToStorage();
}

// Update cart quantity
function updateCartQuantity(productId, quantity) {
  // Update cart count in UI
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountEl) {
    cartCountEl.textContent = totalItems;
    cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

// Remove from cart
function removeFromCart(productId) {
  cartItems = cartItems.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartUI();
}

// Clear cart
function clearCart() {
  cartItems = [];
  saveCartToStorage();
  updateCartUI();
}

// Update cart UI
function updateCartUI() {
  // Update cart count
  updateCartQuantity();
  
  // Update cart items display if cart modal is open
  if (cartModalEl && cartModalEl.classList.contains('show')) {
    renderCartItems();
    updateCartTotals();
  }
}

// Render cart items
function renderCartItems() {
  if (!cartItemsEl) return;
  
  if (cartItems.length === 0) {
    cartItemsEl.innerHTML = '';
    if (emptyCartMessageEl) emptyCartMessageEl.style.display = 'block';
    if (checkoutFormEl) checkoutFormEl.style.display = 'none';
    return;
  }
  
  if (emptyCartMessageEl) emptyCartMessageEl.style.display = 'none';
  if (checkoutFormEl) checkoutFormEl.style.display = 'block';
  
  cartItemsEl.innerHTML = '';
  
  cartItems.forEach(item => {
    const cartItemEl = document.createElement('div');
    cartItemEl.className = 'cart-item';
    cartItemEl.innerHTML = `
      <div class="cart-item-image">
        <img src="${item.image}" alt="${item.title}">
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.title}</h4>
        <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
        <div class="cart-item-quantity">
          <button class="quantity-button decrease" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-button increase" data-id="${item.id}">+</button>
        </div>
      </div>
      <button class="remove-item-button" data-id="${item.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;
    cartItemsEl.appendChild(cartItemEl);
  });
  
  // Add event listeners
  const decreaseButtons = cartItemsEl.querySelectorAll('.quantity-button.decrease');
  decreaseButtons.forEach(button => {
    button.addEventListener('click', () => {
      const id = parseInt(button.dataset.id);
      const item = cartItems.find(item => item.id === id);
      if (item && item.quantity > 1) {
        item.quantity--;
        saveCartToStorage();
        renderCartItems();
        updateCartTotals();
      }
    });
  });
  
  const increaseButtons = cartItemsEl.querySelectorAll('.quantity-button.increase');
  increaseButtons.forEach(button => {
    button.addEventListener('click', () => {
      const id = parseInt(button.dataset.id);
      const item = cartItems.find(item => item.id === id);
      if (item && item.quantity < 10) {
        item.quantity++;
        saveCartToStorage();
        renderCartItems();
        updateCartTotals();
      }
    });
  });
  
  const removeButtons = cartItemsEl.querySelectorAll('.remove-item-button');
  removeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const id = parseInt(button.dataset.id);
      removeFromCart(id);
    });
  });
  
  updateCartTotals();
}

// Update cart totals
function updateCartTotals(isOthers = false) {
  if (!subtotalEl || !deliveryTotalEl || !orderTotalEl) return;
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
  
  // Handle delivery fee
  let deliveryFee = 0;
  
  // Check if any delivery option is selected
  const deliveryOption = Array.from(deliveryOptionEls || []).find(opt => opt.checked);
  
  if (deliveryOption && deliveryOption.value === 'home-delivery') {
    // Apply delivery fee based on selected society/distance
    if (societyEl && societyEl.value) {
      const distanceValue = parseInt(societyEl.value);
      if (!isNaN(distanceValue)) {
        // Free delivery for orders above ₹1000
        deliveryFee = subtotal >= 1000 ? 0 : distanceValue * 10;
      }
    }
    
    // Show home delivery details
    if (homeDeliveryDetailsEl) {
      homeDeliveryDetailsEl.classList.remove('hidden');
    }
  } else {
    // Hide home delivery details
    if (homeDeliveryDetailsEl) {
      homeDeliveryDetailsEl.classList.add('hidden');
    }
  }
  
  // Update delivery fee display
  if (deliveryFeeEl) {
    deliveryFeeEl.textContent = deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`;
  }
  
  deliveryTotalEl.textContent = deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`;
  
  // Update total
  const total = subtotal + deliveryFee;
  orderTotalEl.textContent = `₹${total.toFixed(2)}`;
}

// Save cart to storage
function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cartItems));
}

// Load cart from storage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('cart');
  
  if (savedCart) {
    try {
      cartItems = JSON.parse(savedCart);
      updateCartQuantity();
    } catch (error) {
      console.error('Error parsing saved cart:', error);
      cartItems = [];
    }
  }
}

// Handle delivery option change
function handleDeliveryOptionChange() {
  const selectedOption = Array.from(deliveryOptionEls || []).find(opt => opt.checked);
  
  if (selectedOption && selectedOption.value === 'home-delivery') {
    if (homeDeliveryDetailsEl) {
      homeDeliveryDetailsEl.classList.remove('hidden');
    }
  } else {
    if (homeDeliveryDetailsEl) {
      homeDeliveryDetailsEl.classList.add('hidden');
    }
  }
  
  updateCartTotals();
}

// Handle society change
function handleSocietyChange() {
  updateCartTotals();
}

// Validate checkout form
function validateCheckoutForm() {
  let isValid = true;
  

  // Validate name if field exists
  if (nameEl) {
    if (!nameEl.value.trim()) {
      if (nameErrorEl) nameErrorEl.textContent = 'Please enter your name';
      isValid = false;
    } else {
      if (nameErrorEl) nameErrorEl.textContent = '';
    }
  }
  
  // Validate phone if field exists
  if (phoneEl) {
    const phoneRegex = /^\d{10}$/;
    if (!phoneEl.value.trim()) {
      if (phoneErrorEl) phoneErrorEl.textContent = 'Please enter your phone number';
      isValid = false;
    } else if (!phoneRegex.test(phoneEl.value.trim())) {
      if (phoneErrorEl) phoneErrorEl.textContent = 'Please enter a valid 10-digit phone number';
      isValid = false;
    } else {
      if (phoneErrorEl) phoneErrorEl.textContent = '';
    }
  }
  
  // Check if any delivery option is selected
  const deliveryOption = Array.from(deliveryOptionEls || []).find(opt => opt.checked);
  
  if (!deliveryOption) {
    if (deliveryOptionErrorEl) deliveryOptionErrorEl.textContent = 'Please select a delivery option';
    isValid = false;
  } else {
    if (deliveryOptionErrorEl) deliveryOptionErrorEl.textContent = '';
    
    // If home delivery selected, validate address and society
    if (deliveryOption.value === 'home-delivery') {
      if (addressEl && !addressEl.value.trim()) {
        if (addressErrorEl) addressErrorEl.textContent = 'Please enter your delivery address';
        isValid = false;
      } else {
        if (addressErrorEl) addressErrorEl.textContent = '';
      }
      
      if (societyEl && !societyEl.value) {
        if (societyErrorEl) societyErrorEl.textContent = 'Please select your society/locality';
        isValid = false;
      } else {
        if (societyErrorEl) societyErrorEl.textContent = '';
      }
    }
  }
  
  return isValid;
}

// Process checkout
async function processCheckout() {

  if (!validateCheckoutForm()) {
    return;
  }
  
  
  nextOrderID = Date.now();
  // Create order object
  const name = nameEl ? nameEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const address = addressEl ? addressEl.value.trim() : '';
  const deliveryOption = Array.from(deliveryOptionEls || []).find(opt => opt.checked).value;
  const society = societyEl ? societyEl.value : '';

  // Calculate subtotal and total
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let deliveryFee = 0;
  
  if (deliveryOption === 'home-delivery') {
    const distanceValue = parseInt(society);
    if (!isNaN(distanceValue)) {
      deliveryFee = subtotal >= 1000 ? 0 : distanceValue * 10;
    }
    
  }
  
  
  const total = subtotal + deliveryFee;
  console
  // Create user data
  const userData = {
  name,
  phoneNumber : phone,
  address,
  OrderID: nextOrderID,
  society: deliveryOption === 'home-delivery' ? society : '',
  lastOrderDate: new Date().toISOString()
};

  console.log(userData)
  // Create order data
const orderData = {
  orderId: nextOrderID, 
  customerDetails: {
    name: name || "",
    phoneNumber: phone || "",
    address: address || "",
    deliveryOption: deliveryOption || "pickup",
    society: deliveryOption === 'home-delivery' ? (society || "") : ""
  },
  items: cartItems.map(item => ({
    id: item.id,
    title: item.title,
    price: Number(item.price),
    quantity: Number(item.quantity)
  })),
  subtotal: Number(subtotal),
  deliveryFee: Number(deliveryFee),
  total: Number(total),
  orderDate: new Date().toISOString(),
  status: 'pending' // Default status
};


  
  try {
    // Save user data to API
    const userResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    }).catch(error => {
      console.warn('Could not save user data, but continuing with order:', error);
      // Continue with the order even if user save fails
    });
    console.log(userResponse);
    // Submit order to API
    const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    if (!orderResponse.ok) {
      throw new Error('Failed to place order');
    }
    
    const result = await orderResponse.json();
    
    // Clear cart
    clearCart();
    
    // Show confirmation
    openConfirmationModal(orderData, result.orderNumber);
  } catch (error) {
    console.error('Error processing checkout:', error);
    alert('There was an error processing your order. Please try again.');
  }
}

// Open confirmation modal
function openConfirmationModal(orderData  ) {
  // Close cart modal
  if (cartModalEl) {
    cartModalEl.classList.remove('show');
  }
  
  // Format order details
  if (confirmationDetailsEl) {
    confirmationDetailsEl.innerHTML = `
      <h4>Order Details</h4>
      <p><strong>Order Number:</strong> ${nextOrderID || 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Name:</strong> ${orderData.customerDetails.name}</p>
      <p><strong>Phone:</strong> ${orderData.customerDetails.phoneNumber}</p>
      <p><strong>Delivery Method:</strong> ${orderData.customerDetails.deliveryOption === 'store-pickup' ? 'Store Pickup' : 'Home Delivery'}</p>
      
      ${orderData.customerDetails.deliveryOption === 'home-delivery' ? 
        `<p><strong>Address:</strong> ${orderData.customerDetails.address}</p>
         <p><strong>Locality:</strong> ${getSocietyName(orderData.customerDetails.society)}</p>` : 
        '<p><strong>Pickup Location:</strong> label i002 ajnara integrity</p>'}
      
      <h4>Order Summary</h4>
      <ul class="order-summary-list">
        ${orderData.items.map(item => `
          <li>
            <span>${item.title} x ${item.quantity}</span>
            <span>₹${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        `).join('')}
        <li>
          <span>Subtotal</span>
          <span>₹${orderData.subtotal.toFixed(2)}</span>
        </li>
        <li>
          <span>Delivery</span>
          <span>${orderData.deliveryFee === 0 ? 'Free' : `₹${orderData.deliveryFee.toFixed(2)}`}</span>
        </li>
        <li style="font-weight: 700;">
          <span>Total</span>
          <span>₹${orderData.total.toFixed(2)}</span>
        </li>
      </ul>
    `;
  }
  
  // Show confirmation modal
  if (confirmationModalEl) {
    confirmationModalEl.classList.add('show');
  }
}

// Close confirmation modal
function closeConfirmationModal() {
  if (confirmationModalEl) {
    confirmationModalEl.classList.remove('show');
  
  }
  
  // Enable scrolling
  document.body.style.overflow = '';
}

// Get society name
function getSocietyName(value) {
  if (!value) return 'Not specified';
  
  const societies = {
    '2': 'Green Valley Apartments (2 km)',
    '4': 'Sunshine Enclave (4 km)',
    '7': 'Royal Heights (7 km)',
    '10': 'Golden Park Colony (10 km)',
    '13': 'Silver Oaks Society (13 km)',
    'others': 'Other'
  };
  
  return societies[value] || value;
}

// Update URL with product ID
function updateURLWithProductId(productId) {
  const url = new URL(window.location);
  url.searchParams.set('product', productId);
  window.history.pushState({}, '', url);
}

// Update URL without product ID
function updateURLWithoutProductId() {
  const url = new URL(window.location);
  url.searchParams.delete('product');
  window.history.pushState({}, '', url);
}

// Share product
async function shareProduct(product) {
  const url = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
  
  // Create the complete message text with all product details
  const fullMessage = `🛍️ ${product.title}\n\n${product.description}\n\n💰 Price: ₹${product.price}\n\n🔗 ${url}`;
  
  // Try to share with image if available
  if (product.images && product.images.length > 0) {
    try {
      // Fetch the image as blob
      const imageResponse = await fetch(product.images[0]);
      const imageBlob = await imageResponse.blob();
      
      // Create a file from the blob
      const imageFile = new File([imageBlob], `${product.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`, {
        type: imageBlob.type
      });
      
      // Share with image and complete text
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          text: fullMessage,  // Put everything in text field
          files: [imageFile]
        });
        showShareNotification('Product shared successfully!');
        return;
      }
    } catch (error) {
      console.log('Failed to share with image:', error);
    }
  }
  
  // Fallback to text-only sharing
  if (navigator.share) {
    try {
      await navigator.share({
        text: fullMessage
      });
      showShareNotification('Product shared successfully!');
    } catch (error) {
      createShareFallbackOptions(url, product.title, fullMessage);
    }
  } else {
    createShareFallbackOptions(url, product.title, fullMessage);
  }
}
// Create share fallback options
function createShareFallbackOptions(url, title, text) {
  // Copy URL to clipboard
  copyToClipboard(url);
  showShareNotification('Product link copied to clipboard!');
}

// Copy to clipboard
function copyToClipboard(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

// Show share notification
function showShareNotification(message) {
  // Use the existing notification element
  const notification = document.getElementById('shareNotification');
  const text = document.getElementById('shareNotificationText');
  
  if (!notification || !text) {
    console.error("Share notification elements not found");
    return;
  }
  
  // Set the text
  text.textContent = message;
  
  // Show the notification
  notification.style.display = "block";
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}
// Show "Added to cart" notification
function showAddedToCartNotification(productTitle) {
  // Use the existing notification element
  const notification = document.getElementById('simpleNotification');
  const text = document.getElementById('notificationText');
  
  if (!notification || !text) {
    console.error("Notification elements not found");
    return;
  }
  
  // Set the text
  text.textContent = productTitle + " added to cart!";
  
  // Show the notification
  notification.style.display = "block";
  
  // Hide after 3 seconds
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}
// Helper function: Capitalize first letter
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Set up event listeners
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  
  if (searchInput && searchButton) {
    // Search when button is clicked
    searchButton.addEventListener('click', () => {
      performSearch(searchInput.value);
    });
    
    // Search when Enter key is pressed
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch(searchInput.value);
      }
    });
    
    // Search as you type (after 3 characters)
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      if (query.length >= 3) {
        performSearch(query);
      } else if (query.length === 0) {
        // Reset to show all products when search is cleared
        filterAndRenderProducts();
      }
    });
  }
  // Cart icon click
  if (cartIconEl) {
    cartIconEl.addEventListener('click', () => {
      if (cartModalEl) {
        cartModalEl.classList.add('show');
        renderCartItems();
        document.body.style.overflow = 'hidden';
      }
    });
  }
  
  // Close cart modal
  if (closeCartButtonEl) {
    closeCartButtonEl.addEventListener('click', () => {
      if (cartModalEl) {
        cartModalEl.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }
  
  // Close product modal
  if (closeProductButtonEl) {
    closeProductButtonEl.addEventListener('click', closeProductModal);
  }
  
  // Product quantity controls
  if (decreaseQuantityEl && productQuantityEl) {
    decreaseQuantityEl.addEventListener('click', () => {
      let value = parseInt(productQuantityEl.value);
      if (value > 1) {
        productQuantityEl.value = value - 1;
      }
    });
  }
  
  if (increaseQuantityEl && productQuantityEl) {
    increaseQuantityEl.addEventListener('click', () => {
      let value = parseInt(productQuantityEl.value);
      if (value < 10) {
        productQuantityEl.value = value + 1;
      }
    });
  }
  
  // Add to cart button in product modal
  if (addToCartButtonEl) {
    addToCartButtonEl.addEventListener('click', () => {
      if (selectedProduct && productQuantityEl) {
        const quantity = parseInt(productQuantityEl.value);
        addToCart(selectedProduct, quantity);
        showAddedToCartNotification(selectedProduct.title);
        
        // Close modal after adding to cart
        if (productModalEl) {
          setTimeout(() => {
            productModalEl.classList.remove('show');
            document.body.style.overflow = '';
          }, 1000);
        }
      }
    });
  }
  
  // Share product button
  if (shareProductButtonEl) {
    shareProductButtonEl.addEventListener('click', () => {
      if (selectedProduct) {
        shareProduct(selectedProduct);
      }
    });
  }
  
  // Image navigation in product modal
  const prevImageButton = document.getElementById('prevImageButton');
  const nextImageButton = document.getElementById('nextImageButton');
  
  if (prevImageButton) {
    prevImageButton.addEventListener('click', navigateToPreviousImage);
  }
  
  if (nextImageButton) {
    nextImageButton.addEventListener('click', navigateToNextImage);
  }
  
  // Delivery option change
  if (deliveryOptionEls && deliveryOptionEls.length > 0) {
    Array.from(deliveryOptionEls).forEach(radio => {
      radio.addEventListener('change', handleDeliveryOptionChange);
    });
  }
  
  // Society select change
  if (societyEl) {
    societyEl.addEventListener('change', handleSocietyChange);
  }
  
  // Checkout button
  if (checkoutButtonEl) {
    checkoutButtonEl.addEventListener('click', processCheckout);
  }
  
  // Confirmation modal close
  if (closeConfirmationButtonEl) {
    closeConfirmationButtonEl.addEventListener('click', closeConfirmationModal);
  }
  
  // Continue shopping button
  if (continueShoppingEl) {
    continueShoppingEl.addEventListener('click', closeConfirmationModal);
    
  }
  
  // Load more button
  if (loadMoreBtnEl) {
    loadMoreBtnEl.addEventListener('click', () => {
      visibleProductCount += 8;
      filterAndRenderProducts();
    });
  }
}

// Add window resize event to update the grid layout
window.addEventListener('resize', () => {
  // Throttle the resize event to prevent too many updates
  clearTimeout(window.resizeTimeout);
  window.resizeTimeout = setTimeout(() => {
    filterAndRenderProducts();
  }, 250);
});

// Start fetching products when the page loads
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts().catch(err => console.error("Fetch error:", err));
});

// Add this function to your scripthome.js file
function performSearch(query) {
  if (!query || query.trim() === '') {
    // If empty query, show all products
    filterAndRenderProducts();
    return;
  }
  
  query = query.toLowerCase().trim();
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.title?.toLowerCase().includes(query) || 
    product.description?.toLowerCase().includes(query) ||
    product.category?.toLowerCase().includes(query)
  );
  
  // Display search results
  if (productGridEl) {
    if (filteredProducts.length === 0) {
      productGridEl.innerHTML = `
        <div class="no-results" style="text-align: center; padding: 2rem; width: 100%;">
          <p>No products found for "${query}"</p>
          <button class="button" onclick="filterAndRenderProducts()">Show All Products</button>
        </div>
      `;
    } else {
      // Clear current products
      productGridEl.innerHTML = '';
      
      // Render filtered products
      filteredProducts.forEach(product => {
        const productCard = renderProductCard(product);
        productGridEl.appendChild(productCard);
      });
    }
  }
}
