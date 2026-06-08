const API_URL = 'https://techstore-backend-e1nq.onrender.com';

const formLogin = document.getElementById('formLogin');
const formRegistro = document.getElementById('formRegistro');
const authSubtitle = document.getElementById('authSubtitle');

// Intercambio visual de Formularios (Login <-> Registro)
document.getElementById('linkIrARegistro').addEventListener('click', (e) => {
  e.preventDefault();
  formLogin.classList.add('hidden');
  formRegistro.classList.remove('hidden');
  authSubtitle.innerText = 'Regístrate para obtener credenciales de administrador';
});

document.getElementById('linkIrALogin').addEventListener('click', (e) => {
  e.preventDefault();
  formRegistro.classList.add('hidden');
  formLogin.classList.remove('hidden');
  authSubtitle.innerText = 'Inicia sesión para gestionar el inventario';
});

// EVENTO: PROCESAR REGISTRO (POST a /auth/register)
formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    nombre: document.getElementById('regNombre').value,
    correo: document.getElementById('regCorreo').value,
    contrasena: document.getElementById('regPass').value
  };

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      alert('🎉 ' + data.mensaje);
      formRegistro.reset();
      document.getElementById('linkIrALogin').click(); // Te regresa al login de forma automática
    } else {
      alert('❌ ' + data.mensaje);
    }
  } catch (err) {
    console.error(err);
    alert('Error conectando al servidor');
  }
});

// EVENTO: PROCESAR INICIO DE SESIÓN (POST a /auth/login)
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    correo: document.getElementById('loginCorreo').value,
    contrasena: document.getElementById('loginPass').value
  };

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      // Guardamos el token generado por JWT en el almacenamiento del navegador
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuarioNombre', data.usuario.nombre);
      
      alert(`Bienvenido al sistema, ${data.usuario.nombre}!`);
      window.location.href = 'index.html'; // Te redirige al panel de control de TechStore
    } else {
      alert('❌ ' + data.mensaje);
    }
  } catch (err) {
    console.error(err);
    alert('Error conectando al servidor');
  }
});