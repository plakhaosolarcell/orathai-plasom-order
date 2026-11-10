// ข้อมูลเมนูปลาส้ม
const menuItems = [
    {
        id: 1,
        name: 'ปลาส้มปลาตะเพียน',
        description: '180 บาท / Kg (ขายตัว)',
        price: 180,
        icon: '🐟',
        unit: 'Kg',
        image: 'images/plasom-tapeian-1.jpg'
    },
    {
        id: 2,
        name: 'ปลาส้มปลาจีน',
        description: '180 บาท / Kg (ขายชิ้น)',
        price: 180,
        icon: '🐠',
        unit: 'Kg',
        image: 'images/plasom-chin.jpg'
    },
    {
        id: 3,
        name: 'ปลาส้มน้อย',
        description: '180 บาท / Kg',
        price: 180,
        icon: '🐟',
        unit: 'Kg',
        image: 'images/plasom-noi.png'
    }
];

const SHIPPING_PRICE_PER_KG = 35;

// ConstPromptPay ธนาคารเกษตร
const PROMPTPAY_PHONE = '0909999999'; // เบอร์โทร PromptPay (ตัวอย่าง)
const ACCOUNT_NAME = 'อรทัย โมฬีชาติ';
const BANK_NAME = 'ธนาคารเกษตรและสหกรณ์การเกษตร';

// เก็บตัวแปร QR Code
let qrcodeInstance = null;

// ตะกร้าสินค้า
let cart = [];

// ข้อมูลการส่ง
let deliveryData = {
    items: [],
    subtotal: 0,
    shippingCost: 0,
    totalWeight: 0,
    total: 0,
    slipImage: null,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    timestamp: ''
};

// เรนเดอร์เมนูสินค้า
function renderMenu() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    menuItems.forEach(item => {
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-card';

        const imageHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}">`
            : `<div class="menu-card-image-placeholder">${item.icon}</div>`;

        menuCard.innerHTML = `
            <div class="menu-card-image" id="image-${item.id}">
                ${imageHtml}
                <input type="file" class="image-upload-input" accept="image/*" onchange="handleImageUpload(event, ${item.id})">
                <div class="upload-overlay">📷 คลิกเพื่ออัพโหลดรูป</div>
            </div>
            <div class="menu-card-name">${item.name}</div>
            <div class="menu-card-description">${item.description}</div>
            <div class="menu-card-price">${item.price} บาท</div>
            <div class="menu-card-quantity">
                <input type="number" class="quantity-input" value="1" min="0.1" step="0.1" id="qty-${item.id}" placeholder="กรุณาใส่น้ำหนัก (kg)">
                <button class="btn-add" onclick="addToCart(${item.id})">เพิ่มลงตะกร้า</button>
            </div>
        `;

        menuGrid.appendChild(menuCard);
    });
}

// เพิ่มสินค้าลงตะกร้า
function addToCart(itemId) {
    const quantityInput = document.getElementById(`qty-${itemId}`);
    const quantity = parseFloat(quantityInput.value);

    if (quantity <= 0) {
        alert('กรุณาใส่น้ำหนักที่ถูกต้อง (kg)');
        return;
    }

    const item = menuItems.find(i => i.id === itemId);
    
    // ตรวจสอบว่าสินค้านี้มีในตะกร้าแล้วหรือไม่
    const existingItem = cart.find(c => c.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...item,
            quantity: quantity
        });
    }

    // รีเซ็ต quantity input
    quantityInput.value = 1;

    // อัพเดตการแสดงผลตะกร้า
    renderCart();

    // แสดงข้อความสั้น ๆ
    showNotification(`เพิ่ม ${item.name} ${quantity} kg ลงตะกร้าแล้ว!`);
}

// แสดงการแจ้งเตือน
function showNotification(message) {
    // สร้าง notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // ลบ notification หลังจาก 2 วินาที
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// เรนเดอร์ตะกร้า
function renderCart() {
    const cartItemsDiv = document.getElementById('cartItems');
    const subtotalPriceDiv = document.getElementById('subtotalPrice');
    const shippingPriceDiv = document.getElementById('shippingPrice');
    const totalPriceDiv = document.getElementById('totalPrice');
    const orderBtn = document.getElementById('orderBtn');

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart">ตะกร้าว่างเปล่า</p>';
        subtotalPriceDiv.textContent = '0 บาท';
        shippingPriceDiv.textContent = '0 บาท';
        totalPriceDiv.textContent = '0 บาท';
        orderBtn.disabled = true;
        return;
    }

    cartItemsDiv.innerHTML = '';
    let subtotal = 0;
    let totalWeight = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        totalWeight += item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.icon} ${item.name}</div>
                <div class="cart-item-details">น้ำหนัก: ${item.quantity.toFixed(2)} kg × ${item.price} บาท</div>
            </div>
            <div class="cart-item-price">${itemTotal.toFixed(2)} บาท</div>
            <button class="btn-remove" onclick="removeFromCart(${index})">ลบ</button>
        `;

        cartItemsDiv.appendChild(cartItem);
    });

    const shippingCost = totalWeight * SHIPPING_PRICE_PER_KG;
    const total = subtotal + shippingCost;

    subtotalPriceDiv.textContent = `${subtotal.toFixed(2)} บาท`;
    shippingPriceDiv.textContent = `${shippingCost.toFixed(2)} บาท (${totalWeight.toFixed(2)} kg)`;
    totalPriceDiv.textContent = `${total.toFixed(2)} บาท`;
    orderBtn.disabled = false;
}

// ลบสินค้าจากตะกร้า
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    showNotification('ลบสินค้าจากตะกร้าแล้ว!');
}

// ส่งคำสั่งซื้อ
function placeOrder() {
    if (cart.length === 0) {
        alert('กรุณาเลือกสินค้าก่อนสั่งซื้อ');
        return;
    }

    // คำนวณรวมทั้งสิ้น
    let subtotal = 0;
    let totalWeight = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        totalWeight += item.quantity;
    });

    const shippingCost = totalWeight * SHIPPING_PRICE_PER_KG;
    const total = subtotal + shippingCost;

    // แสดงหน้า Payment
    showPaymentPage(subtotal, shippingCost, totalWeight, total);
}

// แสดงหน้า Payment
function showPaymentPage(subtotal, shippingCost, totalWeight, total) {
    // ลบ active class จากหน้าเมนู เพิ่ม active class ให้หน้า payment
    document.getElementById('menuPage').classList.remove('active');
    document.getElementById('paymentPage').classList.add('active');

    // แสดงรายละเอียดการสั่งซื้อ
    const orderDetailsDiv = document.getElementById('paymentOrderDetails');
    let detailsHtml = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        detailsHtml += `
            <div class="order-detail-item">
                <span class="detail-label">${item.name}</span><br>
                <span>${item.quantity.toFixed(2)} kg × ${item.price} บาท = ${itemTotal.toFixed(2)} บาท</span>
            </div>
        `;
    });

    detailsHtml += `
        <div class="order-detail-item" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd;">
            <span class="detail-label">ราคาสินค้า:</span> ${subtotal.toFixed(2)} บาท<br>
            <span class="detail-label">ค่าจัดส่ง (35 บาท/kg):</span> ${shippingCost.toFixed(2)} บาท<br>
            <span class="detail-label" style="font-size: 1.1rem;">ยอดรวมทั้งสิ้น:</span> <span style="color: #ff6b6b; font-size: 1.2rem;">${total.toFixed(2)} บาท</span>
        </div>
    `;

    orderDetailsDiv.innerHTML = detailsHtml;

    // แสดงยอดชำระ
    document.getElementById('paymentAmount').textContent = `${total.toFixed(2)} บาท`;

    // เลื่อนไปยังส่วน payment
    window.scrollTo(0, 0);
}

// ย้อนกลับไปหน้าเมนู
function backToMenu() {
    document.getElementById('paymentPage').classList.remove('active');
    document.getElementById('menuPage').classList.add('active');
    window.scrollTo(0, 0);
}

// ยืนยันการชำระเงินเสร็จสิ้น
function completePayment() {
    // ไปหน้า Delivery Form
    showDeliveryPage();
}

// จัดการอัพโหลดรูป
function handleImageUpload(event, itemId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const item = menuItems.find(i => i.id === itemId);
        if (item) {
            item.image = e.target.result;
            renderMenu();
        }
    };
    reader.readAsDataURL(file);
}

// Event Listener สำหรับปุ่มสั่งซื้อ
document.addEventListener('DOMContentLoaded', () => {
    const orderBtn = document.getElementById('orderBtn');
    orderBtn.addEventListener('click', placeOrder);

    // เรนเดอร์เมนูเมื่อหน้าเว็บโหลดเสร็จ
    renderMenu();
    renderCart();

    // จัดการ Delivery Form Submission
    const deliveryForm = document.getElementById('deliveryForm');
    if (deliveryForm) {
        deliveryForm.addEventListener('submit', handleDeliverySubmit);
    }

    // จัดการการอัพโหลดสลิป
    const slipImage = document.getElementById('slipImage');
    if (slipImage) {
        slipImage.addEventListener('change', handleSlipUpload);
    }

    // เพิ่ม CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});

// แสดงหน้า Delivery Form
function showDeliveryPage() {
    // คำนวณข้อมูลการสั่งซื้อ
    let subtotal = 0;
    let totalWeight = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        totalWeight += item.quantity;
    });

    const shippingCost = totalWeight * SHIPPING_PRICE_PER_KG;
    const total = subtotal + shippingCost;

    // เก็บข้อมูลการส่ง
    deliveryData = {
        items: [...cart],
        subtotal: subtotal,
        shippingCost: shippingCost,
        totalWeight: totalWeight,
        total: total,
        slipImage: null
    };

    // เตรียมรูป delivery order summary
    const deliverySummaryDiv = document.getElementById('deliverySummary');
    let summaryHtml = '<h4>📦 สรุปการสั่งซื้อ</h4>';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        summaryHtml += `<p>${item.name} : ${item.quantity.toFixed(2)} kg = ${itemTotal.toFixed(2)} บาท</p>`;
    });

    summaryHtml += `<p style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
        <strong>ราคาสินค้า:</strong> ${subtotal.toFixed(2)} บาท<br>
        <strong>ค่าจัดส่ง:</strong> ${shippingCost.toFixed(2)} บาท<br>
        <strong>ยอดรวมทั้งสิ้น:</strong> <span style="color: #ff6b6b; font-weight: 700;">${total.toFixed(2)} บาท</span>
    </p>`;

    deliverySummaryDiv.innerHTML = summaryHtml;

    // เปลี่ยนไปหน้า delivery
    document.getElementById('paymentPage').classList.remove('active');
    document.getElementById('deliveryPage').classList.add('active');

    // เคลียร์ฟอร์ม
    document.getElementById('deliveryForm').reset();
    const slipPreview = document.getElementById('slipPreview');
    if (slipPreview) {
        slipPreview.innerHTML = '';
    }

    window.scrollTo(0, 0);
}

// กลับจากหน้า Delivery ไปหน้า Payment
function backToPayment() {
    document.getElementById('deliveryPage').classList.remove('active');
    document.getElementById('paymentPage').classList.add('active');
    window.scrollTo(0, 0);
}

// จัดการอัพโหลดสลิป
function handleSlipUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        alert('กรุณาอัพโหลดไฟล์ภาพหรือ PDF เท่านั้น');
        return;
    }

    // ตรวจสอบขนาดไฟล์ (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('ไฟล์ใหญ่เกินไป กรุณาอัพโหลดไฟล์ที่เล็กกว่า 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        deliveryData.slipImage = e.target.result;

        // แสดง preview สลิป
        const slipPreview = document.getElementById('slipPreview');
        if (file.type.startsWith('image/')) {
            slipPreview.innerHTML = `<img src="${e.target.result}" alt="สลิปโอนจ่าย">`;
        } else {
            slipPreview.innerHTML = `<p>✅ ไฟล์ PDF ได้รับการอัพโหลด (${(file.size / 1024).toFixed(2)} KB)</p>`;
        }
    };
    reader.readAsDataURL(file);
}

// จัดการส่งฟอร์ม Delivery
function handleDeliverySubmit(event) {
    event.preventDefault();

    // รับข้อมูลจากฟอร์ม
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();

    // ตรวจสอบว่ากรอกข้อมูลครบ
    if (!customerName) {
        alert('กรุณากรอกชื่อลูกค้า');
        return;
    }

    if (!customerPhone) {
        alert('กรุณากรอกเบอร์โทรศัพท์');
        return;
    }

    if (!customerAddress) {
        alert('กรุณากรอกที่อยู่');
        return;
    }

    // เก็บข้อมูลลูกค้า (สลิปเป็น optional)
    const orderData = {
        customerName: customerName,
        customerPhone: customerPhone,
        customerAddress: customerAddress,
        items: cart,
        subtotal: deliveryData.subtotal,
        shippingCost: deliveryData.shippingCost,
        total: deliveryData.total,
        slipImage: deliveryData.slipImage || null,
        timestamp: new Date().toLocaleString('th-TH')
    };

    // แสดงหน้า Success
    showSuccessPage(orderData);
}

// แสดงหน้า Success
function showSuccessPage(orderData) {
    // เปลี่ยนไปหน้า success
    document.getElementById('deliveryPage').classList.remove('active');
    document.getElementById('successPage').classList.add('active');

    // เก็บข้อมูลลำดับที่ในแต่ละฟังก์ชัน - รวมราคาและสินค้า
    deliveryData = {
        ...deliveryData,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        timestamp: orderData.timestamp,
        items: orderData.items,
        subtotal: orderData.subtotal,
        shippingCost: orderData.shippingCost,
        total: orderData.total
    };

    // แสดงข้อมูลใน success page
    document.getElementById('successName').textContent = orderData.customerName;
    document.getElementById('successPhone').textContent = orderData.customerPhone;
    document.getElementById('successAddress').textContent = orderData.customerAddress;
    document.getElementById('successAmount').textContent = `${orderData.total.toFixed(2)} บาท`;

    // แสดง timestamp
    const successDetails = document.getElementById('successDetails');
    successDetails.innerHTML += `<div class="detail-row"><span class="label">วันเวลา:</span><span class="value">${orderData.timestamp}</span></div>`;

    // บันทึกข้อมูลลงใน localStorage (เพื่อใช้อ้างอิงได้)
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.push({
        ...orderData,
        slipImage: undefined // ไม่บันทึกรูปใน localStorage
    });
    localStorage.setItem('orders', JSON.stringify(existingOrders));

    window.scrollTo(0, 0);
}

// ดาวน์โหลด PDF (แสดงภาษาไทยถูกต้อง)
async function downloadOrderPDF() {
    try {
        if (!deliveryData.customerName) {
            alert('❌ ไม่มีข้อมูลการสั่งซื้อ');
            return;
        }
        
        const items = deliveryData.items || [];
        const subtotal = Number(deliveryData.subtotal || 0);
        const shippingCost = Number(deliveryData.shippingCost || 0);
        const total = Number(deliveryData.total || 0);
        
        console.log(`📄 PDF: ${items.length} items, Total: ${total} บาท`);
        items.forEach((item, i) => console.log(`  Item ${i}: ${item.name} x ${item.quantity} kg @ ${item.price} บาท`));
        
        // สร้าง HTML template
        const htmlContent = `
<html>
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Prompt', 'Sarabun', sans-serif;
            line-height: 1.4;
            color: #000;
            padding: 0;
            background: white;
            width: 210mm;
            margin: 0 auto;
        }
        .document-container {
            border: 3px solid #000;
            margin: 10mm;
            padding: 15mm 20mm;
            min-height: 277mm;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 5mm; 
            margin-bottom: 6mm;
        }
        .header h1 { font-size: 24px; margin: 0 0 3px 0; font-weight: 700; }
        .header p { font-size: 12px; margin: 0; font-weight: 400; }
        .section { margin-bottom: 5mm; }
        .section-title { 
            background: #f0f0f0; 
            font-weight: 600; 
            padding: 3.5mm 4mm; 
            font-size: 12px;
            margin-bottom: 3mm;
            border-radius: 2px;
            text-align: left;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 2mm 2mm;
            font-size: 11px;
            border-bottom: 1px solid #f0f0f0;
        }
        .info-row strong { font-weight: 600; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 11px;
            margin: 0;
        }
        th {
            background: #f0f0f0; 
            font-weight: 600; 
            padding: 3mm;
            text-align: left;
            border: 1px solid #ddd;
        }
        td {
            padding: 2.5mm;
            border: 1px solid #ddd;
        }
        td.number { text-align: center; }
        td.right { text-align: right; }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 3mm 2mm;
            font-size: 11px;
            border-bottom: 1px solid #ddd;
        }
        .summary-row.total {
            font-weight: 700;
            font-size: 13px;
            color: #d32f2f;
            padding: 4mm 2mm;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
        }
        .footer {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 6mm;
            padding-top: 3mm;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="document-container">
        <div class="header">
            <h1>อรทัยปลาส้ม ออเดอร์</h1>
            <p>ปลาส้มโนนกาหลง สิรินธร บริการส่งถึงบ้านคุณ</p>
        </div>
        
        <!-- ข้อมูลลูกค้า -->
        <div class="section">
            <div class="section-title">ข้อมูลลูกค้า</div>
            <div class="info-row"><strong>ชื่อ:</strong> <span>${deliveryData.customerName || '-'}</span></div>
            <div class="info-row"><strong>โทร:</strong> <span>${deliveryData.customerPhone || '-'}</span></div>
            <div class="info-row"><strong>ที่อยู่:</strong> <span>${deliveryData.customerAddress || '-'}</span></div>
            <div class="info-row"><strong>เวลา:</strong> <span>${deliveryData.timestamp || '-'}</span></div>
        </div>
        
        <!-- รายการสินค้า -->
        <div class="section">
            <div class="section-title">รายการสินค้า</div>
            <table>
                <thead>
                    <tr>
                        <th>สินค้า</th>
                        <th class="number">จำนวน (kg)</th>
                        <th class="number">ราคา/kg</th>
                        <th class="right">รวม</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.length > 0 ? items.map(item => {
                        const qty = Number(item.quantity || 0);
                        const price = Number(item.price || 0);
                        const itemTotal = qty * price;
                        return `<tr>
                            <td>${item.name || ''}</td>
                            <td class="number">${qty.toFixed(2)}</td>
                            <td class="number">${price.toFixed(2)}</td>
                            <td class="right">${itemTotal.toFixed(2)}</td>
                        </tr>`;
                    }).join('') : '<tr><td colspan="4" style="text-align: center;">ไม่มีรายการ</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <!-- สรุปราคา -->
        <div class="section">
            <div class="section-title">สรุปราคา</div>
            <div class="summary-row">
                <strong>ราคาสินค้า:</strong>
                <span>${subtotal.toFixed(2)} บาท</span>
            </div>
            <div class="summary-row">
                <strong>ค่าจัดส่ง (35 บาท/kg):</strong>
                <span>${shippingCost.toFixed(2)} บาท</span>
            </div>
            <div class="summary-row total">
                <strong>ยอดรวมทั้งสิ้น</strong>
                <strong>${total.toFixed(2)} บาท</strong>
            </div>
        </div>
        
        <!-- ข้อมูลการชำระเงิน -->
        <div class="section">
            <div class="section-title">ข้อมูลการชำระเงิน</div>
            <div class="info-row"><strong>ธนาคาร:</strong> <span>ธนาคารกสิกรไทย (PromptPay)</span></div>
            <div class="info-row"><strong>ชื่อบัญชี:</strong> <span>อรทัย โมฬีชาติ</span></div>
            <div class="info-row" style="color: #d32f2f; font-weight: 700; font-size: 10px;">
                <strong>จำนวนชำระ:</strong>
                <span>${total.toFixed(2)} บาท</span>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>ขอบคุณที่ใช้บริการอรทัยปลาส้ม ออเดอร์</p>
            <p>เอกสารนี้เป็นหลักฐานการสั่งซื้อ</p>
        </div>
    </div>
</body>
</html>
        `;
        
        // สร้าง div เพื่อ render HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.background = 'white';
        document.body.appendChild(tempDiv);
        
        // รอให้ fonts โหลด
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Convert HTML เป็น canvas
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            logging: false,
            allowTaint: true,
            useCORS: true,
            backgroundColor: '#ffffff',
            fontFamily: 'Prompt, Sarabun, sans-serif'
        });
        
        // สร้าง PDF จาก canvas
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`order_${new Date().getTime()}.pdf`);
        
        // ลบ temp div
        document.body.removeChild(tempDiv);
        
        showNotification('✅ ดาวน์โหลด PDF สำเร็จ!');
        
    } catch (error) {
        console.error('❌ PDF Error:', error);
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
}

// สั่งซื้อใหม่
function startNewOrder() {
    // เคลียร์ตะกร้า
    cart = [];
    renderCart();

    // เคลียร์ข้อมูลการส่ง
    deliveryData = {
        items: [],
        subtotal: 0,
        shippingCost: 0,
        totalWeight: 0,
        total: 0,
        slipImage: null,
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        timestamp: ''
    };

    // กลับไปหน้าเมนู
    document.getElementById('successPage').classList.remove('active');
    document.getElementById('menuPage').classList.add('active');

    window.scrollTo(0, 0);

    showNotification('✅ พร้อมสั่งซื้อใหม่!');
}
