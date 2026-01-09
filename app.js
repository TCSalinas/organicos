// --- VARIABLES GLOBALES ---
let carrito = [];
let productoTemporal = {};
let tipoEntrega = 'delivery'; 

// URL de SheetMonkey (Para el Excel) - ¡CÁMBIALA POR LA TUYA!
const SHEET_API = 'https://script.google.com/macros/s/AKfycbw7Wjr72Ri9STq8c4gRF_hQKEW-cpbR19boRMRjKylxcqeIW_ry0Ag8DLHEV5_PImPXMQ/exec';

// --- ARREGLO ESC LISTENER (Global y Robusto) ---
document.addEventListener('keydown', function(event) {
    if (event.key === "Escape") {
        document.getElementById('lightbox').style.display = 'none';
        document.getElementById('modal-detalle').style.display = 'none';
        
        const sidebar = document.getElementById('sidebar-carrito');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }
});

// --- NAVEGACIÓN SUAVE ---
function irASeccion(id) {
    const elemento = document.getElementById(id);
    if(elemento) {
        elemento.scrollIntoView({ behavior: 'smooth' });
    }
}

// --- LÓGICA DE NAVEGACIÓN (FLUJO DE 3 PASOS) ---

// Paso 1 -> Paso 2 (De Pedido a Datos)
function irADatos() {
    if(carrito.length === 0) { alert("Tu carrito está vacío 🍃"); return; }
    cambiarPestaña('tab-checkout', 'vista-checkout', 'btns-paso-2');
}

// Paso 2 -> Paso 3 (De Datos a Pago)
function irAPago() {
    // Validar datos básicos
    const nombre = document.getElementById('cliente-nombre').value;
    const fono = document.getElementById('cliente-telefono').value;
    
    if(!nombre || !fono) { 
        alert("Por favor completa tu nombre y teléfono para poder contactarte."); 
        return; 
    }

    // Calcular y mostrar resumen final en la vista de pago
    let total = 0;
    carrito.forEach(i => total += (i.precioBase * i.cantidad));
    document.getElementById('total-final-pago').innerText = '$' + total.toLocaleString('es-CL');

    cambiarPestaña('tab-pago', 'vista-pago', 'btns-paso-3');
    // Ocultamos el total del footer porque ya se muestra grande en la caja de banco
    document.getElementById('footer-total-row').style.display = 'none'; 
}

// Volver atrás
function volverAPedido() { 
    cambiarPestaña('tab-pedido', 'vista-pedido', 'btn-paso-1'); 
    document.getElementById('footer-total-row').style.display = 'flex';
}

function volverADatos() { 
    cambiarPestaña('tab-checkout', 'vista-checkout', 'btns-paso-2');
    document.getElementById('footer-total-row').style.display = 'flex';
}

// Función auxiliar para cambiar vistas
function cambiarPestaña(tabId, vistaId, btnGroupId) {
    // Resetear clases y ocultar todo
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sidebar-body').forEach(v => v.style.display = 'none');
    
    // Ocultar todos los botones del footer
    document.getElementById('btn-paso-1').style.display = 'none';
    document.getElementById('btns-paso-2').style.display = 'none';
    document.getElementById('btns-paso-3').style.display = 'none';

    // Activar lo seleccionado
    document.getElementById(tabId).classList.add('active');
    document.getElementById(vistaId).style.display = 'block';
    
    // Mostrar el grupo de botones correspondiente (si existe)
    const btnGroup = document.getElementById(btnGroupId);
    if(btnGroup) btnGroup.style.display = (btnGroupId === 'btns-paso-2' || btnGroupId === 'btns-paso-3') ? 'flex' : 'block';
}

// --- PROCESO FINAL (Excel + Correo) ---
async function procesarPedidoFinal() {
    const btn = document.getElementById('btn-enviar-final');
    const fileInput = document.getElementById('input-comprobante');

    // Validación de comprobante (opcional, pero recomendada)
    if (fileInput.files.length === 0) {
        if(!confirm("No has subido el comprobante de transferencia. ¿Deseas enviar el pedido de todas formas?")) return;
    }

    btn.innerText = "Enviando...";
    btn.disabled = true;

    // Recopilar Datos
    const datos = {
        fecha: new Date().toLocaleString(),
        cliente: document.getElementById('cliente-nombre').value,
        telefono: document.getElementById('cliente-telefono').value,
        direccion: document.getElementById('cliente-direccion').value,
        rut: document.getElementById('cliente-rut').value,
        entrega: tipoEntrega,
        total: document.getElementById('sidebar-total').innerText,
        pedido: carrito.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')
    };

    try {
        // A. ENVIAR A EXCEL (SheetMonkey)
        await fetch(SHEET_API, {
            method: 'POST',
            body: JSON.stringify(datos)
        });

        // B. ENVIAR CORREO CON ADJUNTO (FormSubmit)
        // Pasamos los datos al formulario oculto
        document.getElementById('real-pedido').value = datos.pedido;
        document.getElementById('real-total').value = datos.total;
        document.getElementById('real-cliente').value = datos.cliente;
        document.getElementById('real-telefono').value = datos.telefono;
        document.getElementById('real-direccion').value = datos.direccion + " (" + datos.entrega + ")";

        // Clonar el archivo al input oculto
        const realFileInput = document.getElementById('real-file');
        realFileInput.files = fileInput.files;

        // Enviar el formulario nativo
        document.getElementById('form-real').submit();

    } catch (error) {
        console.error(error);
        alert("Hubo un error de conexión. Intenta nuevamente.");
        btn.innerText = "Reintentar";
        btn.disabled = false;
    }
}

// --- BUSCADOR ---
function filtrarProductos() {
    const input = document.getElementById('buscador');
    if (!input) return;
    
    const filtro = input.value.toUpperCase().trim();
    const items = document.getElementsByClassName('producto');

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const tituloTag = item.querySelector('h3');
        
        if (tituloTag) {
            const textoTitulo = tituloTag.innerText || tituloTag.textContent;
            if (textoTitulo.toUpperCase().indexOf(filtro) > -1) {
                item.style.display = "";
            } else {
                item.style.display = "none";
            }
        }
    }
}

// Listener para el buscador
document.addEventListener("DOMContentLoaded", function() {
    const inputBuscador = document.getElementById('buscador');
    if(inputBuscador) {
        inputBuscador.addEventListener('keyup', filtrarProductos);
    }
});

// --- FUNCIONES DEL CARRITO Y MODAL ---
function abrirDetalle(nombre, precio, imagen) {
    productoTemporal = { nombre, precioBase: precio, imagen, cantidad: 1, observacion: '' };
    document.getElementById('det-titulo').innerText = nombre;
    document.getElementById('det-precio').innerText = '$' + precio.toLocaleString('es-CL');
    document.getElementById('det-img').src = imagen;
    document.getElementById('det-cantidad').innerText = 1;
    document.getElementById('det-obs').value = ''; 
    actualizarTotalModal();
    document.getElementById('modal-detalle').style.display = 'flex';
}

function cerrarDetalle() { document.getElementById('modal-detalle').style.display = 'none'; }

function cambiarCantidad(delta) {
    if (productoTemporal.cantidad + delta >= 1) {
        productoTemporal.cantidad += delta;
        document.getElementById('det-cantidad').innerText = productoTemporal.cantidad;
        actualizarTotalModal();
    }
}

function actualizarTotalModal() {
    const total = productoTemporal.precioBase * productoTemporal.cantidad;
    document.getElementById('det-total-calc').innerText = '$' + total.toLocaleString('es-CL');
}

function confirmarAgregarAlCarrito() {
    productoTemporal.observacion = document.getElementById('det-obs').value;
    carrito.push({ ...productoTemporal });
    actualizarCarritoUI();
    cerrarDetalle();
    toggleCarrito(); // Abrir sidebar para mostrar
}

// --- LÓGICA DEL SIDEBAR ---

function toggleCarrito() {
    const sidebar = document.getElementById('sidebar-carrito');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Si se está abriendo, asegurar que empiece en la vista 1
    if (!sidebar.classList.contains('active')) {
        volverAPedido();
    }
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function actualizarCarritoUI() {
    const contenedor = document.getElementById('carrito-items');
    contenedor.innerHTML = '';
    let total = 0;
    
    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px">Tu carrito está vacío 🍃</p>';
    }

    carrito.forEach((item, index) => {
        const subtotal = item.precioBase * item.cantidad;
        total += subtotal;
        contenedor.innerHTML += `
            <div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #f0f0f0; padding-bottom:10px;">
                <img src="${item.imagen}" style="width:60px; height:60px; object-fit:contain; border:1px solid #eee; border-radius:6px;">
                <div style="flex:1;">
                    <div style="font-weight:600; font-size:0.9rem;">${item.cantidad}x ${item.nombre}</div>
                    <div style="font-size:0.8rem; color:#888;">${item.observacion || ''}</div>
                    <div style="display:flex; justify-content:space-between; margin-top:5px;">
                        <span style="color:var(--primary); font-weight:bold;">$${subtotal.toLocaleString('es-CL')}</span>
                        <i class="fas fa-trash" style="color:#ff4757; cursor:pointer;" onclick="eliminarItem(${index})"></i>
                    </div>
                </div>
            </div>
        `;
    });

    const totalTexto = '$' + total.toLocaleString('es-CL');
    
    // Actualizar Botón Flotante
    document.getElementById('float-count').innerText = carrito.length;
    document.getElementById('float-total').innerText = totalTexto;
    const btnFlotante = document.getElementById('btn-flotante-carrito');
    if (carrito.length > 0) btnFlotante.style.display = 'flex';
    
    // Actualizar Footer Sidebar
    document.getElementById('sidebar-total').innerText = totalTexto;
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    actualizarCarritoUI();
}

function setEntrega(tipo) {
    tipoEntrega = tipo;
    const btns = document.querySelectorAll('.btn-toggle');
    btns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const inputDir = document.getElementById('cliente-direccion');
    if(tipo === 'pickup') {
        inputDir.value = "Retiro en tienda (Valle Escondido)";
        inputDir.disabled = true;
    } else {
        inputDir.value = "";
        inputDir.disabled = false;
        inputDir.focus();
    }
}

// --- EXTRAS ---
function verFotoGrande(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox').style.display = 'flex'; }
function cerrarFotoGrande() { document.getElementById('lightbox').style.display = 'none'; }

window.onscroll = function() {
    const btn = document.getElementById('btn-subir');
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btn.style.display = "flex";
    } else {
        btn.style.display = "none";
    }
};