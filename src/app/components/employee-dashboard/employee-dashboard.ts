import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './employee-dashboard.html',
})
export class EmployeeDashboardComponent implements OnInit {
  empleadoNombre = '';
  idEmpleado = '';
  pestanaActiva = 'ordenes'; 
  mensaje = '';
  tipoMensaje = '';

  // --- DATOS DE LA BASE DE DATOS ---
  reservasPendientes: any[] = [];
  inventario: any[] = [];
  inventarioFiltrado: any[] = [];
  categorias: string[] = ['Cactus Variegados', 'Opuntias', 'Agaves', 'Aloes', 'Suculentas', 'Cactus de Colección', 'Otros'];
  cupones: any[] = [];
  premios: any[] = [];
  usuariosClientes: any[] = [];
  ordenesAtendidas = 0;

  // --- FILTROS Y BÚSQUEDAS ---
  busquedaNombre = '';
  busquedaCategoria = 'todos';
  emailClienteBuscar = '';
  sugerenciasClientes: any[] = [];

  // --- ESTADOS DE MODALES ---
  modalComprobante = false;
  comprobanteActual = '';
  
  modalCactus = false;
  productoActual: any = {}; // Almacena los datos del form

  modalCupon = false;
  cuponActual: any = {};

  modalRuleta = false;
  premioActual: any = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.idEmpleado = localStorage.getItem('id_usuario') || '';
    this.empleadoNombre = localStorage.getItem('nombre') || 'Empleado';
    
    if (!this.idEmpleado) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.cargarDatosAPI();
  }

  mostrarAlerta(msg: string, tipo: 'exito' | 'error') {
    this.mensaje = msg;
    this.tipoMensaje = tipo;
    setTimeout(() => this.mensaje = '', 4000);
  }

  cargarDatosAPI() {
    // 1. Reservas pendientes
    this.http.get('http://localhost:3000/reservas?estado=pendiente').subscribe((res: any) => this.reservasPendientes = res);
    
    // 2. Inventario
    this.http.get('http://localhost:3000/productos').subscribe((res: any) => {
      this.inventario = res;
      this.filtrarInventario();
    });

    // 3. Cupones y Premios
    this.http.get('http://localhost:3000/cupones').subscribe((res: any) => this.cupones = res);
    this.http.get('http://localhost:3000/premios').subscribe((res: any) => this.premios = res);

    // 4. Clientes (para el autocompletado de Fidelidad)
    this.http.get('http://localhost:3000/usuarios?rol=Cliente').subscribe((res: any) => this.usuariosClientes = res);

    // 5. Estadísticas del empleado
    this.http.get(`http://localhost:3000/reservas?atendido_por=${this.idEmpleado}&estado=recogido`).subscribe((res: any) => {
      this.ordenesAtendidas = res.length;
    });
  }

  cambiarPestana(pestana: string) {
    this.pestanaActiva = pestana;
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ==========================================
  // LÓGICA DE RESERVAS (NOTIFICACIONES)
  // ==========================================
  verComprobante(img: string) {
    this.comprobanteActual = img;
    this.modalComprobante = true;
  }

  atenderReserva(reserva: any) {
    this.http.patch(`http://localhost:3000/reservas/${reserva.id}`, { estado: 'recogido', atendido_por: this.idEmpleado }).subscribe(() => {
      this.mostrarAlerta(`Orden #${reserva.id} aprobada y entregada.`, 'exito');
      this.cargarDatosAPI();
    });
  }

  cancelarReserva(reserva: any) {
    if(confirm('¿Cancelar esta orden? El stock será devuelto a la tienda.')) {
      // 1. Devolver stock
      const producto = this.inventario.find(p => p.nombre === reserva.producto_nombre);
      if (producto) {
        this.http.patch(`http://localhost:3000/productos/${producto.id}`, { stock: Number(producto.stock) + Number(reserva.cantidad) }).subscribe();
      }
      // 2. Cancelar reserva
      this.http.patch(`http://localhost:3000/reservas/${reserva.id}`, { estado: 'cancelado', atendido_por: this.idEmpleado }).subscribe(() => {
        this.mostrarAlerta('Orden cancelada. Stock devuelto.', 'error');
        this.cargarDatosAPI();
      });
    }
  }

  reportarUsuario(reserva: any) {
    if(confirm('ALERTA: ¿Reportar a este usuario por comprobante falso? La orden se cancelará.')) {
      // Devolver stock y cancelar
      const producto = this.inventario.find(p => p.nombre === reserva.producto_nombre);
      if (producto) {
        this.http.patch(`http://localhost:3000/productos/${producto.id}`, { stock: Number(producto.stock) + Number(reserva.cantidad) }).subscribe();
      }
      this.http.patch(`http://localhost:3000/reservas/${reserva.id}`, { estado: 'cancelado', atendido_por: this.idEmpleado }).subscribe(() => {
        this.mostrarAlerta('¡Cuenta reportada y orden cancelada!', 'error');
        this.cargarDatosAPI();
      });
    }
  }

  // ==========================================
  // LÓGICA DE INVENTARIO
  // ==========================================
  filtrarInventario() {
    this.inventarioFiltrado = this.inventario.filter(item => {
      const pasaNombre = item.nombre.toLowerCase().includes(this.busquedaNombre.toLowerCase());
      const pasaCategoria = this.busquedaCategoria === 'todos' || item.categoria === this.busquedaCategoria;
      return pasaNombre && pasaCategoria;
    });
  }

  abrirModalCactus(producto?: any) {
    if (producto) {
      this.productoActual = { ...producto }; // Clonamos para editar
    } else {
      this.productoActual = { categoria: 'Cactus Variegados', stock: 1, precio: 10 }; // Nuevo
    }
    this.modalCactus = true;
  }

  guardarProducto() {
    if (this.productoActual.id) {
      this.http.patch(`http://localhost:3000/productos/${this.productoActual.id}`, this.productoActual).subscribe(() => {
        this.mostrarAlerta('Datos del cactus actualizados.', 'exito');
        this.modalCactus = false;
        this.cargarDatosAPI();
      });
    } else {
      this.http.post('http://localhost:3000/productos', this.productoActual).subscribe(() => {
        this.mostrarAlerta('Cactus agregado al catálogo.', 'exito');
        this.modalCactus = false;
        this.cargarDatosAPI();
      });
    }
  }

  eliminarProducto(id: string) {
    if(confirm('¿Seguro que deseas eliminar este cactus?')) {
      this.http.delete(`http://localhost:3000/productos/${id}`).subscribe(() => {
        this.mostrarAlerta('Producto eliminado permanentemente.', 'exito');
        this.cargarDatosAPI();
      });
    }
  }

  // ==========================================
  // LÓGICA DE FIDELIDAD
  // ==========================================
  buscarClienteTeclado() {
    if (this.emailClienteBuscar.length > 2) {
      this.sugerenciasClientes = this.usuariosClientes.filter(u => u.correo.toLowerCase().includes(this.emailClienteBuscar.toLowerCase()));
    } else {
      this.sugerenciasClientes = [];
    }
  }

  seleccionarCliente(email: string) {
    this.emailClienteBuscar = email;
    this.sugerenciasClientes = [];
  }

  registrarVisita() {
    const cliente = this.usuariosClientes.find(u => u.correo === this.emailClienteBuscar);
    if (cliente) {
      this.http.patch(`http://localhost:3000/usuarios/${cliente.id}`, { visitas_presenciales: (cliente.visitas_presenciales || 0) + 1 }).subscribe(() => {
        this.mostrarAlerta(`Visita registrada para ${cliente.correo}.`, 'exito');
        this.emailClienteBuscar = '';
        this.cargarDatosAPI();
      });
    } else {
      this.mostrarAlerta('No se encontró ningún cliente con ese correo.', 'error');
    }
  }

  // ==========================================
  // LÓGICA DE MARKETING Y RULETA
  // ==========================================
  abrirModalCupon() {
    this.cuponActual = { usos_actuales: 0, limite_usos: 50, dias_validez: 7 };
    this.modalCupon = true;
  }

  guardarCupon() {
    this.http.post('http://localhost:3000/cupones', this.cuponActual).subscribe(() => {
      this.mostrarAlerta('Cupón creado exitosamente.', 'exito');
      this.modalCupon = false;
      this.cargarDatosAPI();
    });
  }

  eliminarCupon(id: string) {
    if(confirm('¿Eliminar cupón?')) {
      this.http.delete(`http://localhost:3000/cupones/${id}`).subscribe(() => {
        this.mostrarAlerta('Cupón eliminado.', 'exito');
        this.cargarDatosAPI();
      });
    }
  }

  abrirModalRuleta(premio?: any) {
    if (premio) {
      this.premioActual = { ...premio };
    } else {
      this.premioActual = { descuento_porcentaje: 0, probabilidad: 10, color_seccion: '#A3B18A' };
    }
    this.modalRuleta = true;
  }

  guardarPremio() {
    if (this.premioActual.id) {
      this.http.patch(`http://localhost:3000/premios/${this.premioActual.id}`, this.premioActual).subscribe(() => {
        this.mostrarAlerta('Premio actualizado.', 'exito');
        this.modalRuleta = false;
        this.cargarDatosAPI();
      });
    } else {
      this.http.post('http://localhost:3000/premios', this.premioActual).subscribe(() => {
        this.mostrarAlerta('Nuevo premio agregado.', 'exito');
        this.modalRuleta = false;
        this.cargarDatosAPI();
      });
    }
  }

  eliminarPremio(id: string) {
    if(confirm('¿Eliminar premio?')) {
      this.http.delete(`http://localhost:3000/premios/${id}`).subscribe(() => {
        this.mostrarAlerta('Premio eliminado.', 'exito');
        this.cargarDatosAPI();
      });
    }
  }

  get probabilidadTotal() {
    return this.premios.reduce((sum, p) => sum + Number(p.probabilidad || 0), 0);
  }

  cerrarTodosModales() {
    this.modalComprobante = false;
    this.modalCactus = false;
    this.modalCupon = false;
    this.modalRuleta = false;
  }
}