import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common'; 
import { RouterLink, Router } from '@angular/router'; 
import { HttpClient } from '@angular/common/http'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterLink, NgClass, FormsModule],
  templateUrl: './gallery.html',
})
export class GalleryComponent implements OnInit, OnDestroy {
  productos: any[] = [];
  
  // --- ESTADO DE SESIÓN ---
  isLoggedIn = false;
  nombreUsuario = '';
  rolUsuario = '';
  idUsuario = '';
  mostrarMenuPerfil = false;

  mostrarMapa = false;
  mostrarContacto = false;

  // --- ESTADO DE MOKA (Normal) ---
  mokaVozActiva = true;
  mokaMensaje = '¡Hola! Soy Moka. ¡Haz clic en mí!';
  mokaImagen = 'images/barista/barista.png';
  mokaClaseAnimacion = '';
  burbujaClaseAnimacion = '';
  
  config = { clicksSeguidos: 0, intervaloCharla: 15000, isAnimando: false, isEscribiendo: false, enCastigo: false, haSaludado: false };
  timers: any = { charla: null, escritura: null };

  dialogos = {
    bienvenida: ["¡Bienvenido! ¿Te apetece un Latte hoy?", "¡Oh, una visita! Pasa, pasa."],
    normal: ["El aroma a café molido y tierra húmeda es la mejor combinación del mundo.", "Este ambiente es perfecto para estudiar."],
    incomodidad: ["Eh... disculpa, ¿por qué me interrumpes?"],
    disculpa: ["Perdón por el silencio. Supongo que los dos necesitábamos... espacio."]
  };

  // --- ESTADO DE MOKA (RULETA) ---
  mokaRuletaMensaje = '¡HOLA! ¡DALE UN GIRO A TU SUERTE!';
  mokaRuletaImagen = 'images/barista/barista.png';
  dialogosRuleta = [
    "Ese puntero me pone nerviosa...", "¡Con fe! Tal vez ganes algo bueno.", "Si ganas el premio mayor, invítame un postre.", "Esta ruleta la construyó el jefe... yo solo la pinto."
  ];

  // --- ESTADO DE RULETA ---
  mostrarModalRuleta = false;
  ruletaGirando = false;
  rotacionAcumulada = 0;
  ultimoPremioHTML = "¿SERÁ HOY TU DÍA DE SUERTE?";
  colorMensajeRuleta = 'var(--terracota)';
  premiosRuleta: any[] = [];
  estiloFondoRuleta = '';
  etiquetasRuleta: any[] = [];
  yaJugoEstaSemana = false;

  // --- MODAL PRODUCTO ---
  productoSeleccionado: any = null;
  imagenPrincipalModal: string = '';

  constructor(private router: Router, private http: HttpClient, private cdr: ChangeDetectorRef) {} 

  ngOnInit() {
    this.verificarSesion();
    this.iniciarTimers();
    this.cargarInventarioPublico();
    this.cargarPremiosRuleta(); 
  }

  ngOnDestroy() {
    clearTimeout(this.timers.charla);
    clearInterval(this.timers.escritura);
  }

  // --- LÓGICA DE SESIÓN ---
  verificarSesion() {
    const id = localStorage.getItem('id_usuario');
    if (id) {
      this.isLoggedIn = true;
      this.idUsuario = id;
      this.nombreUsuario = localStorage.getItem('nombre') || 'Fan';
      this.rolUsuario = (localStorage.getItem('rol') || 'cliente').toLowerCase();
      this.mokaRuletaMensaje = `¡HOLA, ${this.nombreUsuario.toUpperCase()}! ¡DALE UN GIRO A TU SUERTE!`;
      
      // Comprobamos si el usuario ya giró hoy (Simulamos la lógica de semana guardando la fecha local)
      const ultimoGiro = localStorage.getItem(`ultimoGiro_${id}`);
      if (ultimoGiro && new Date(ultimoGiro).toDateString() === new Date().toDateString()) {
          this.yaJugoEstaSemana = true;
      }
    }
  }

  toggleMenuPerfil() { this.mostrarMenuPerfil = !this.mostrarMenuPerfil; }
  toggleMapa() { this.mostrarMapa = !this.mostrarMapa; }
  toggleContacto() { this.mostrarContacto = !this.mostrarContacto; }
  
  cerrarSesion() {
    localStorage.clear();
    this.isLoggedIn = false;
    this.mostrarMenuPerfil = false;
    this.router.navigate(['/login']);
  }

  toggleMokaVoz() {
    if (this.mokaVozActiva) {
      this.mokaImagen = 'images/barista/barista.png';
      this.iniciarTimers();
      this.mostrarTextoDeGolpe("¡Qué bueno que me escuchas de nuevo!");
    } else {
      this.mokaImagen = 'images/barista/barista_sad.png';
      this.mostrarTextoDeGolpe("...");
      clearTimeout(this.timers.charla);
      clearInterval(this.timers.escritura);
    }
  }

  // --- LÓGICA DE INVENTARIO Y MODAL ---
  cargarInventarioPublico() {
    this.http.get('http://localhost:3000/productos').subscribe({
      next: (datos: any) => { this.productos = datos; this.cdr.detectChanges(); },
      error: (error) => console.error('Error:', error)
    });
  }

  abrirDetalles(producto: any) {
    this.productoSeleccionado = producto;
    this.imagenPrincipalModal = producto.imagen_url;
  }
  cambiarImagenModal(imgUrl: string) { this.imagenPrincipalModal = imgUrl; }
  cerrarModal() { this.productoSeleccionado = null; }

  comprarCactus() {
    if (!this.isLoggedIn) {
      alert('Para reservar un cactus, por favor inicia sesión primero.');
      this.router.navigate(['/login']);
      return;
    }
    localStorage.setItem('carrito_museo', JSON.stringify(this.productoSeleccionado));
    this.router.navigate(['/checkout']);
  }

  // --- LÓGICA DE MOKA NORMAL ---
  iniciarTimers() {
    if (!this.mokaVozActiva) return;
    clearTimeout(this.timers.charla);
    this.timers.charla = setTimeout(() => this.charlaAleatoria(), this.config.intervaloCharla);
  }

  charlaAleatoria() {
    if (!this.mokaVozActiva || this.config.isAnimando || this.config.isEscribiendo || this.config.enCastigo) return;
    const frase = this.dialogos.normal[Math.floor(Math.random() * this.dialogos.normal.length)];
    this.escribirLetraPorLetra(frase);
    this.timers.charla = setTimeout(() => this.charlaAleatoria(), this.config.intervaloCharla);
  }

  interactuarMoka() {
    if (!this.mokaVozActiva || this.config.isAnimando || this.config.enCastigo) return;
    this.iniciarTimers();

    if (this.config.isEscribiendo) {
      this.config.clicksSeguidos++;
      if (this.config.clicksSeguidos === 1) this.mostrarTextoDeGolpe(this.dialogos.incomodidad[0], true);
      else if (this.config.clicksSeguidos >= 3) this.activarCastigo();
    } else {
      this.config.clicksSeguidos = 0;
      let frase = !this.config.haSaludado ? this.dialogos.bienvenida[0] : this.dialogos.normal[0];
      this.config.haSaludado = true;
      this.escribirLetraPorLetra(frase);
    }
  }

  escribirLetraPorLetra(texto: string) {
    const caracteres = texto.split('');
    let i = 0;
    clearInterval(this.timers.escritura);
    this.mokaMensaje = "";
    this.config.isEscribiendo = true;
    this.cdr.detectChanges(); 

    this.timers.escritura = setInterval(() => {
      if (i < caracteres.length) { this.mokaMensaje += caracteres[i]; this.cdr.detectChanges(); i++; } 
      else { clearInterval(this.timers.escritura); this.config.isEscribiendo = false; this.cdr.detectChanges(); }
    }, 30);
  }

  mostrarTextoDeGolpe(texto: string, agitar: boolean = false) {
    clearInterval(this.timers.escritura);
    this.config.isEscribiendo = false;
    this.mokaMensaje = texto;
    this.cdr.detectChanges(); 
    if (agitar) {
      this.burbujaClaseAnimacion = 'shake-anim';
      setTimeout(() => { this.burbujaClaseAnimacion = ''; this.cdr.detectChanges(); }, 300);
    }
  }

  activarCastigo() {
    this.config.enCastigo = true; this.config.isAnimando = true;
    clearTimeout(this.timers.charla);
    this.mokaClaseAnimacion = 'jump-attack'; 
    this.mostrarTextoDeGolpe("¡¡SE ACABÓ!! ¡NO TE HABLO MÁS!", true);

    setTimeout(() => {
      this.mokaClaseAnimacion = ''; this.config.enCastigo = false; this.config.isAnimando = false; this.config.clicksSeguidos = 0;
      this.escribirLetraPorLetra(this.dialogos.disculpa[0]);
      this.iniciarTimers();
    }, 4000); 
  }

  // ==========================================
  // LÓGICA DE LA RULETA (NUEVO)
  // ==========================================
  abrirRuletaModal() {
    if (!this.isLoggedIn) {
      alert('Inicia sesión para girar la ruleta y ganar premios.');
      this.router.navigate(['/login']);
      return;
    }
    this.mostrarModalRuleta = true;
  }

  cerrarRuletaModal() {
    if(this.ruletaGirando) return alert("¡Espera a que la ruleta se detenga!");
    this.mostrarModalRuleta = false;
  }

  interactuarMokaRuleta() {
    if(this.ruletaGirando) return;
    this.mokaRuletaMensaje = this.dialogosRuleta[Math.floor(Math.random() * this.dialogosRuleta.length)];
    this.mokaRuletaImagen = 'images/barista/barista_normal.png';
  }

  cargarPremiosRuleta() {
    this.http.get('http://localhost:3000/premios').subscribe((premios: any) => {
      this.premiosRuleta = premios;
      if (this.premiosRuleta.length > 0) this.dibujarRuleta();
    });
  }

  dibujarRuleta() {
    const gradosPorRebanada = 360 / this.premiosRuleta.length;
    let coloresGradient: string[] = [];
    this.etiquetasRuleta = [];

    this.premiosRuleta.forEach((premio, index) => {
      let inicio = index * gradosPorRebanada;
      let fin = (index + 1) * gradosPorRebanada;
      coloresGradient.push(`${premio.color_seccion || premio.color} ${inicio}deg ${fin}deg`);
      
      let anguloTexto = inicio + (gradosPorRebanada / 2) - 90;
      let rotacionTextoExtra = (anguloTexto + 360) % 360 > 90 && (anguloTexto + 360) % 360 < 270 ? 'rotate(180deg)' : 'rotate(0deg)';

      let tituloVisual = premio.titulo.length > 13 ? premio.titulo.replace(' ', '<br>') : premio.titulo;

      this.etiquetasRuleta.push({ titulo: tituloVisual, transformPadre: `translateY(-50%) rotate(${anguloTexto}deg)`, transformHijo: rotacionTextoExtra });
    });
    this.estiloFondoRuleta = `conic-gradient(${coloresGradient.join(', ')})`;
  }

  girarRuleta() {
    if (this.ruletaGirando) return;
    
    if (this.yaJugoEstaSemana) {
      this.colorMensajeRuleta = 'var(--terracota)';
      this.ultimoPremioHTML = "¡Ya jugaste esta semana!";
      this.mokaRuletaMensaje = "¡No intentes engañarme, ya jugaste! Vuelve la próxima semana.";
      this.mokaRuletaImagen = 'images/barista/barista_manosextendidas.png';
      return;
    }

    this.ruletaGirando = true;
    this.colorMensajeRuleta = 'var(--verde-oliva)';
    this.ultimoPremioHTML = "CONSULTANDO A MOKA...";
    this.mokaRuletaMensaje = "¡Rueda, rueda, rueda! ¡Cruza los dedos!";
    this.mokaRuletaImagen = 'images/barista/barista_aprobando.png';

    // 1. Simular la probabilidad
    const random = Math.floor(Math.random() * 100) + 1;
    let acumulado = 0;
    let premioGanado = this.premiosRuleta[0];

    for (let premio of this.premiosRuleta) {
      acumulado += Number(premio.probabilidad);
      if (random <= acumulado) { premioGanado = premio; break; }
    }

    // 2. Calcular animación física
    const indicePremio = this.premiosRuleta.findIndex(p => p.id === premioGanado.id);
    const gradosPorRebanada = 360 / this.premiosRuleta.length;
    let anguloTarget = 270 - ((indicePremio * gradosPorRebanada) + (gradosPorRebanada / 2));
    if (anguloTarget < 0) anguloTarget += 360;
    
    let gradosRestantesVuelta = 360 - (this.rotacionAcumulada % 360);
    this.rotacionAcumulada += gradosRestantesVuelta + 3600 + anguloTarget; // 10 vueltas + destino

    // 3. Resultado al detenerse
    setTimeout(() => {
      this.ruletaGirando = false;
      this.yaJugoEstaSemana = true;
      localStorage.setItem(`ultimoGiro_${this.idUsuario}`, new Date().toISOString());

      if (premioGanado.descuento_porcentaje > 0 || premioGanado.dcto > 0) {
        // GANÓ
        const codigo = "RUL-" + Math.random().toString(36).substring(2,7).toUpperCase();
        this.colorMensajeRuleta = 'var(--verde-pino)';
        this.ultimoPremioHTML = `¡${premioGanado.titulo.toUpperCase()}! CÓDIGO: <strong>${codigo}</strong>`;
        this.mokaRuletaMensaje = "¡Qué suerte! Acabo de guardar tu ticket en tu Perfil.";
        this.mokaRuletaImagen = 'images/barista/barista.png';

        // Guardamos el premio en Base de Datos (json-server)
        this.http.post('http://localhost:3000/cupones', {
          codigo: codigo, descuento_porcentaje: premioGanado.descuento_porcentaje || premioGanado.dcto, id_usuario: this.idUsuario, usos_actuales: 0, limite_usos: 1
        }).subscribe();

      } else {
        // PERDIÓ
        this.colorMensajeRuleta = 'var(--cafe-tierra)';
        this.ultimoPremioHTML = premioGanado.titulo.toUpperCase();
        this.mokaRuletaMensaje = "Bueno, siempre habrá una próxima vez.";
        this.mokaRuletaImagen = 'images/barista/barista_confundida.png';
      }
    }, 5000);
  }
}