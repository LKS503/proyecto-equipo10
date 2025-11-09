/* ===========================
   MercadoKids - Lógica principal
   =========================== */

const products = [
  {id:1,nombre:"Pelota infantil arcoíris",categoria:"articulos",imagen:"https://images.pexels.com/photos/296301/pexels-photo-296301.jpeg",price:5.00,stock:50,descripcion:"Pelota suave y colorida para niños."},
  {id:2,nombre:"Juego didáctico 20 piezas",categoria:"articulos",imagen:"https://images.pexels.com/photos/159823/toys-children-game-child-159823.jpeg",price:15.00,stock:20,descripcion:"Juego para aprender formas y colores."},
  {id:3,nombre:"Jugo natural naranja 250ml",categoria:"bebidas",imagen:"https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg",price:1.50,stock:100,descripcion:"Jugo natural sin azúcares añadidos."}
];

let cart = {};

function renderProducts(list){
  const container = document.getElementById('productContainer');
  container.innerHTML = '';
  list.forEach(p=>{
    const html = `
      <div class="item">
        <img src="${p.imagen}" alt="${p.nombre}">
        <div class="info">
          <h4>${p.nombre}</h4>
          <div class="price">$${p.price.toFixed(2)}</div>
          <div class="actions">
            <button class="btn btn-dark" onclick="addToCart(${p.id})">Agregar</button>
          </div>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
  });
}

function addToCart(id){
  cart[id] = (cart[id] || 0) + 1;
  updateCartUI();
}

function updateCartUI(){
  const count = Object.values(cart).reduce((s,n)=>s+n,0);
  document.getElementById('cart-count').innerText = count;
  renderCartItems();
}

function renderCartItems(){
  const el = document.getElementById('cart-items');
  el.innerHTML = '';
  if(Object.keys(cart).length === 0){
    el.innerHTML = '<p>Carrito vacío</p>';
    document.getElementById('cart-total').innerText = '0.00';
    return;
  }
  let total = 0;
  Object.keys(cart).forEach(pid=>{
    const p = products.find(x=>x.id == pid);
    const qty = cart[pid];
    const sub = p.price * qty;
    total += sub;
    el.insertAdjacentHTML('beforeend', `<p>${p.nombre} x${qty} = $${sub.toFixed(2)}</p>`);
  });
  document.getElementById('cart-total').innerText = total.toFixed(2);
}

/* Abrir/Cerrar carrito */
document.getElementById('open-cart').addEventListener('click', ()=> document.getElementById('modal-cart').style.display = 'flex');
document.getElementById('close-cart').addEventListener('click', ()=> document.getElementById('modal-cart').style.display = 'none');

/* ===========================
   Pago con LNbits
   =========================== */
document.getElementById('checkout-sats').addEventListener('click', async ()=>{
  const totalUSD = Object.keys(cart).reduce((s,id)=>{
    const p = products.find(x=>x.id==id);
    return s + (p.price * cart[id]);
  },0);

  if(totalUSD <= 0){ alert("Carrito vacío"); return; }

  const walletId = document.getElementById('target-wallet').value;

  try{
    const res = await fetch('backend/create_invoice.php', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ total_usd: totalUSD, wallet_id: walletId })
    });
    const json = await res.json();

    if(!json.ok){ alert('Error creando factura'); return; }

    document.getElementById('invoice-qr').src = json.qr;
    document.getElementById('invoice-bolt').innerText = json.payment_request;
    document.getElementById('modal-invoice').style.display = 'flex';

    pollInvoiceStatus(json.invoice_id);
  }catch(e){
    alert('Error al conectar con backend: '+e.message);
  }
});

document.getElementById('close-invoice').addEventListener('click', ()=> document.getElementById('modal-invoice').style.display = 'none');
document.getElementById('copy-bolt').addEventListener('click', ()=>{
  navigator.clipboard.writeText(document.getElementById('invoice-bolt').innerText);
  alert('BOLT11 copiado');
});

/* Verificar estado del pago */
let pollTimer = null;
function pollInvoiceStatus(id){
  if(pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async ()=>{
    const r = await fetch('backend/check_invoice.php?id='+id);
    const j = await r.json();
    if(j.ok && j.paid){
      clearInterval(pollTimer);
      alert('✅ Pago recibido — ¡gracias!');
      cart = {};
      updateCartUI();
      document.getElementById('modal-invoice').style.display='none';
      document.getElementById('modal-cart').style.display='none';
    }
  }, 3000);
}

/* Inicio */
renderProducts(products);
updateCartUI();
