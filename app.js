const API_URL = 'http://localhost:5000';

// Estados locales temporales para la vista de ventas
let carritoActual = [];
let productosCache = [];

// Al cargar el documento, jalar la información inicial del Servidor
document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
  cargarClientes();
  cargarHistorialVentas();
  cargarReporteAgregacion();
});

// ==========================================
// MÓDULO 1: GESTIÓN DE PRODUCTOS
// ==========================================
async function cargarProductos() {
  try {
    const res = await fetch(`${API_URL}/productos`);
    const productos = await res.json();
    productosCache = productos; // Guardar copia para consultas del punto de venta

    const tabla = document.getElementById('tablaProductos');
    const selectProd = document.getElementById('selectProducto');
    
    tabla.innerHTML = '';
    selectProd.innerHTML = '<option value="">-- Elige un producto --</option>';

    productos.forEach(p => {
      // Inyectar en tabla
      tabla.innerHTML += `
        <tr>
          <td><strong class="text-primary">${p.nombre}</strong></td>
          <td><span class="badge bg-secondary">${p.categoria}</span></td>
          <td class="fw-bold">$${p.precio.toLocaleString()}</td>
          <td>
            <span class="badge ${p.stock > 5 ? 'bg-success' : 'bg-danger'}">
              ${p.stock} pz
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto('${p._id}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
      // Inyectar en select de ventas si cuenta con inventario disponible
      if(p.stock > 0) {
        selectProd.innerHTML += `<option value="${p._id}">${p.nombre} ($${p.precio} | Disp: ${p.stock})</option>`;
      }
    });
  } catch (err) {
    console.error('Error cargando productos:', err);
  }
}

document.getElementById('formProducto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoProd = {
    nombre: document.getElementById('prodNombre').value,
    categoria: document.getElementById('prodCategoria').value,
    precio: parseFloat(document.getElementById('prodPrecio').value),
    stock: parseInt(document.getElementById('prodStock').value)
  };

  const res = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoProd)
  });

  if (res.ok) {
    document.getElementById('formProducto').reset();
    cargarProductos();
    alert('✅ Producto insertado en el inventario de Atlas!');
  }
});

async function eliminarProducto(id) {
  if (confirm('¿Seguro que deseas eliminar este producto?')) {
    await fetch(`${API_URL}/productos/${id}`, { method: 'DELETE' });
    cargarProductos();
  }
}

// ==========================================
// MÓDULO 2: GESTIÓN DE CLIENTES
// ==========================================
async function cargarClientes() {
  try {
    const res = await fetch(`${API_URL}/clientes`);
    const clientes = await res.json();
    const tabla = document.getElementById('tablaClientes');
    const selectCli = document.getElementById('selectCliente');

    tabla.innerHTML = '';
    selectCli.innerHTML = '<option value="">-- Elige un cliente --</option>';

    clientes.forEach(c => {
      tabla.innerHTML += `
        <tr>
          <td>${c.nombre}</td>
          <td>${c.correo}</td>
          <td>${c.telefono}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarCliente('${c._id}')">
                <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
      selectCli.innerHTML += `<option value="${c._id}">${c.nombre}</option>`;
    });
  } catch (err) {
    console.error('Error cargando clientes:', err);
  }
}

document.getElementById('formCliente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoCli = {
    nombre: document.getElementById('cliNombre').value,
    correo: document.getElementById('cliCorreo').value,
    telefono: document.getElementById('cliTelefono').value
  };

  const res = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoCli)
  });

  if (res.ok) {
    document.getElementById('formCliente').reset();
    cargarClientes();
    alert('✅ Cliente registrado exitosamente.');
  } else {
    alert('❌ Error: El correo podría ya estar registrado.');
  }
});

async function eliminarCliente(id) {
  if (confirm('¿Seguro que deseas eliminar este cliente?')) {
    await fetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' });
    cargarClientes();
  }
}

// ==========================================
// MÓDULO 3: PROCESAMIENTO DE VENTAS Y REPORTES
// ==========================================
document.getElementById('btnAgregarCarrito').addEventListener('click', () => {
  const pId = document.getElementById('selectProducto').value;
  const cantidad = parseInt(document.getElementById('ventaCantidad').value);

  if (!pId || cantidad < 1) return alert('Seleccione un producto y cantidad válida');

  const prodObj = productosCache.find(p => p._id === pId);
  if (cantidad > prodObj.stock) return alert(`No puedes vender más de las existencias reales (${prodObj.stock} pz)`);

  // Validar si ya estaba metido en el carrito para solo sumar cantidades
  const existente = carritoActual.find(item => item.producto_id === pId);
  if (existente) {
    if ((existente.cantidad + cantidad) > prodObj.stock) return alert('La suma total sobrepasa el stock disponible');
    existente.cantidad += cantidad;
  } else {
    carritoActual.push({
      producto_id: pId,
      nombre: prodObj.nombre,
      precio: prodObj.precio,
      cantidad: cantidad
    });
  }

  document.getElementById('ventaCantidad').value = 1;
  actualizarVistaCarrito();
});

function actualizarVistaCarrito() {
  const lista = document.getElementById('listaCarrito');
  const txtTotal = document.getElementById('totalVentaTxt');
  lista.innerHTML = '';
  let totalCalculado = 0;

  carritoActual.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    totalCalculado += subtotal;
    lista.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center sm-text">
        <div>
          <strong>${item.nombre}</strong><br>
          <small class="text-muted">${item.cantidad} pz x $${item.precio}</small>
        </div>
        <span class="badge bg-primary rounded-pill">$${subtotal}</span>
      </li>
    `;
  });

  txtTotal.innerText = `$${totalCalculado.toLocaleString()}`;
}

document.getElementById('formVenta').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cId = document.getElementById('selectCliente').value;

  if (!cId) return alert('Por favor, selecciona un cliente para la factura');
  if (carritoActual.length === 0) return alert('El carrito está vacío. Agregue componentes primero');

  const payloadVenta = {
    cliente_id: cId,
    productos: carritoActual.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad }))
  };

  const res = await fetch(`${API_URL}/ventas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadVenta)
  });

  if (res.ok) {
    alert('🚀 ¡Venta procesada con éxito! Se calculó el total y se descontó el Stock en Atlas.');
    carritoActual = [];
    actualizarVistaCarrito();
    document.getElementById('formVenta').reset();
    
    // Recargar toda la info cruzada de la pantalla
    cargarProductos();
    cargarHistorialVentas();
    cargarReporteAgregacion();
  } else {
    const errData = await res.json();
    alert(`❌ Error al transaccionar: ${errData.mensaje}`);
  }
});

async function cargarHistorialVentas() {
  try {
    const res = await fetch(`${API_URL}/ventas`);
    const ventas = await res.json();
    const tabla = document.getElementById('tablaHistorialVentas');
    tabla.innerHTML = '';

    ventas.reverse().forEach(v => {
      const fechaFormateada = new Date(v.fecha).toLocaleDateString('es-MX', {hour: '2-digit', minute:'2-digit'});
      tabla.innerHTML += `
        <tr>
          <td><small class="text-muted">${fechaFormateada}</small></td>
          <td><strong>${v.cliente_id ? v.cliente_id.nombre : 'Cliente General'}</strong></td>
          <td class="text-success fw-bold">$${v.total.toLocaleString()}</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarVenta('${v._id}')">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Error de historial:', err);
  }
}

async function eliminarVenta(id) {
  if (confirm('¿Seguro que deseas cancelar esta venta?')) {
    await fetch(`${API_URL}/ventas/${id}`, { method: 'DELETE' });
    // Recarga todo en cadena para actualizar stock e ingresos al instante
    cargarProductos();
    cargarHistorialVentas();
    cargarReporteAgregacion();
  }
}

// Consultar la ruta del Aggregation Pipeline de MongoDB para sumas totales
async function cargarReporteAgregacion() {
  try {
    const res = await fetch(`${API_URL}/ventas/reporte/total-acumulado`);
    const data = await res.json();
    document.getElementById('totalAcumuladoCaja').innerText = `$${data.total.toLocaleString()}`;
  } catch (err) {
    console.error('Error en agregación:', err);
  }
}