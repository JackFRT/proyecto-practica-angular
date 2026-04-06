import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.html',
})
export class ProfileComponent implements OnInit {
  pestanaActiva = 'info';
  mensaje = '';
  tipoMensaje = '';

  // Datos del cliente
  usuario: any = { nombre: '', correo: '', password: '', visitas_presenciales: 0 };
  historial: any[] = [];
  cuponesActivos: any[] = [];
  
  // Variables de progreso
  plantasAcumuladas = 0;
  porcentajeProgreso = 0;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const id = localStorage.getItem('id_usuario');
    if (!id) {
      this.router.navigate(['/login']); // Si no hay sesión, lo botamos al login
      return;
    }
    this.cargarDatos(id);
  }

  cargarDatos(id: string) {
    // 1. Cargar datos del usuario
    this.http.get(`http://localhost:3000/usuarios/${id}`).subscribe((user: any) => {
      this.usuario = user;
    });

    // 2. Cargar historial de compras del usuario
    const nombreCliente = localStorage.getItem('nombre');
    this.http.get(`http://localhost:3000/reservas?cliente=${nombreCliente}`).subscribe((res: any) => {
      this.historial = res;
      
      // Calcular la barra de progreso de fidelidad
      let acumuladas = 0;
      this.historial.forEach(r => {
        if (r.estado !== 'cancelado') acumuladas += Number(r.cantidad || 1);
      });
      this.plantasAcumuladas = acumuladas % 4; 
      this.porcentajeProgreso = (this.plantasAcumuladas / 4) * 100;
    });

    // 3. Cargar cupones
    this.http.get('http://localhost:3000/cupones').subscribe((cups: any) => {
      this.cuponesActivos = cups; 
    });
  }

  cambiarPestana(pestana: string) {
    this.pestanaActiva = pestana;
    this.mensaje = '';
  }

  actualizarPerfil() {
    const id = localStorage.getItem('id_usuario');
    this.http.patch(`http://localhost:3000/usuarios/${id}`, {
      nombre: this.usuario.nombre,
      correo: this.usuario.correo,
      password: this.usuario.password
    }).subscribe(() => {
      localStorage.setItem('nombre', this.usuario.nombre); // Actualizamos la memoria
      this.tipoMensaje = 'exito';
      this.mensaje = 'Tus datos han sido actualizados correctamente.';
      setTimeout(() => this.mensaje = '', 4000);
    });
  }

  eliminarCuenta() {
    if(confirm('¿ESTÁS SEGURO? Esta acción es irreversible.')) {
      const id = localStorage.getItem('id_usuario');
      this.http.delete(`http://localhost:3000/usuarios/${id}`).subscribe(() => {
        localStorage.clear();
        this.router.navigate(['/galeria']); // Adiós cuenta, hola tienda pública
      });
    }
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}