// --- VARIABLES GLOBALES ---
let carrito = [];
let productoTemporal = {}; // Objeto para guardar datos mientras estás en el modal del "+"

// --- 1. MODAL DETALLE (Se activa al dar click en el botón +) ---
function abrirDetalle(nombre, precio, imagen) {
    // Inicializamos el producto temporal con cantidad 1
    productoTemporal = {
        nombre: nombre,
        precioBase: precio,
        imagen: imagen,
        cantidad: 1,
        observacion: ''
    };

    // Llenamos la información en el HTML del modal
    document.getElementById('det-titulo').innerText = nombre;
    document.getElementById('det-precio').innerText = '$' + precio.toLocaleString('es-CL');
    document.getElementById('det-img').src = imagen;
    
    // Reseteamos inputs visuales
    document.getElementById('det-cantidad').innerText = 1;
    document.getElementById('det-obs').value = ''; 
    
    // Calculamos el total inicial (precio base * 1)
    actualizarTotalModal();

    // Mostramos el modal
    document.getElementById('modal-detalle').style.display = 'flex';
}

function cerrarDetalle() {
    document.getElementById('modal-detalle').style.display = 'none';
}

// Botones de + y - dentro del modal
function cambiarCantidad(delta) {
    const nuevaCant = productoTemporal.cantidad + delta;
    if (nuevaCant >= 1) {
        productoTemporal.cantidad = nuevaCant;
        document.getElementById('det-cantidad').innerText = nuevaCant;
        actualizarTotalModal();
    }
}

function actualizarTotalModal() {
    const total = productoTemporal.precioBase * productoTemporal.cantidad;
    document.getElementById('det-total-calc').innerText = '$' + total.toLocaleString('es-CL');
}

// --- 2. CONFIRMAR AGREGAR AL CARRITO (Botón morado del modal) ---
function confirmarAgregarAlCarrito() {
    // Guardamos lo que escribió el usuario en observación
    productoTemporal.observacion = document.getElementById('det-obs').value;

    // Agregamos una COPIA del objeto al array del carrito
    carrito.push({ ...productoTemporal }); 

    // Actualizamos contadores y vista
    actualizarContadorHeader();
    renderizarSidebar();
    
    // Cerramos el modal de detalle
    cerrarDetalle();
    
    // Opcional: Abrir el sidebar automáticamente para dar feedback visual
    abrirSidebar();
}

// --- 3. SIDEBAR CARRITO (Menú deslizante derecho) ---
function toggleCarrito() {
    const sidebar = document.getElementById('sidebar-carrito');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    } else {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    }
}

function abrirSidebar() {
    document.getElementById('sidebar-carrito').classList.add('active');
    document.getElementById('sidebar-overlay').classList.add('active');
}

function renderizarSidebar() {
    const contenedor = document.getElementById('carrito-items');
    contenedor.innerHTML = ''; // Limpiar lista anterior
    
    let totalGlobal = 0;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; color:#999; margin-top:2rem;">Tu carrito está vacío 🍃</p>';
    }

    carrito.forEach((item, index) => {
        const subtotal = item.precioBase * item.cantidad;
        totalGlobal += subtotal;

        contenedor.innerHTML += `
            <div class="item-carrito">
                <img src="${item.imagen}" class="item-img">
                <div class="item-info">
                    <h4>${item.cantidad}x ${item.nombre}</h4>
                    <small class="item-obs">${item.observacion ? 'Nota: '+item.observacion : ''}</small>
                    <div class="item-actions">
                        <span class="item-price">$${subtotal.toLocaleString('es-CL')}</span>
                        <i class="fas fa-trash" style="color:#ff4757; cursor:pointer;" onclick="eliminarItem(${index})"></i>
                    </div>
                </div>
            </div>
        `;
    });

    // Actualizar Total en el Sidebar
    document.getElementById('sidebar-total').innerText = '$' + totalGlobal.toLocaleString('es-CL');
    // Actualizar burbuja roja en el Header
    document.getElementById('cart-count').innerText = carrito.length;
}

function eliminarItem(index) {
    carrito.splice(index, 1); // Quitar del array
    renderizarSidebar();      // Redibujar
    actualizarContadorHeader();
}

function actualizarContadorHeader() {
    document.getElementById('cart-count').innerText = carrito.length;
}

// --- 4. LIGHTBOX (Ver foto grande al hacer click en imagen) ---
function verFotoGrande(src) {
    document.getElementById('lightbox-img').src = src;
    document.getElementById('lightbox').style.display = 'flex';
}
function cerrarFotoGrande() {
    document.getElementById('lightbox').style.display = 'none';
}

// Cerrar lightbox con ESC
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        cerrarFotoGrande();
        cerrarDetalle();
        const sidebar = document.getElementById('sidebar-carrito');
        if(sidebar.classList.contains('active')) toggleCarrito();
    }
});

// --- 5. BUSCADOR (Filtrado en tiempo real) ---
function filtrarProductos() {
    const texto = document.getElementById('buscador').value.toUpperCase();
    const items = document.getElementsByClassName('producto');
    
    for (let item of items) {
        const titulo = item.querySelector('h3').innerText.toUpperCase();
        if (titulo.includes(texto)) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    }
}

// --- 6. CHECKOUT (Guardar y Continuar) ---
function irACheckout() {
    if(carrito.length === 0) { 
        alert("Tu carrito está vacío. Agrega productos primero."); 
        return; 
    }
    
    // Guardamos el pedido en memoria para la siguiente página
    localStorage.setItem('pedidoArvinea', JSON.stringify(carrito));
    
    // Aquí redirigirías a tu archivo checkout.html
    // window.location.href = 'checkout.html';
    alert("¡Pedido guardado! Redirigiendo a formulario de pago...");
}