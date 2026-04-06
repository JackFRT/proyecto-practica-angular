import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboardComponent implements OnInit {
  adminNombre = '';
  usuarios: any[] = [];
  mensaje = '';
  tipoMensaje = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const rol = localStorage.getItem('rol');
    if (!rol || rol.toLowerCase() !== 'admin') {
      this.router.navigate(['/galeria']);
      return;
    }
    
    this.adminNombre = localStorage.getItem('nombre') || 'Administrador';
    this.cargarUsuarios();
  }

  mostrarAlerta(msg: string, tipo: 'exito' | 'error') {
    this.mensaje = msg;
    this.tipoMensaje = tipo;
    setTimeout(() => this.mensaje = '', 4000);
  }

  cargarUsuarios() {
    this.http.get('http://localhost:3000/usuarios').subscribe((datos: any) => {
      this.usuarios = datos;
    });
  }

  guardarRol(usuario: any) {
    // Actualizamos el rol en json-server
    this.http.patch(`http://localhost:3000/usuarios/${usuario.id}`, { rol: usuario.rol }).subscribe(() => {
      this.mostrarAlerta(`Rol de ${usuario.nombre} actualizado a ${usuario.rol}.`, 'exito');
    }, () => {
      this.mostrarAlerta('Error al actualizar el rol.', 'error');
    });
  }

  resetearRuleta(usuario: any) {
    // Como el bloqueo de la ruleta lo guardamos en localStorage con el ID del usuario:
    localStorage.removeItem(`ultimoGiro_${usuario.id}`);
    this.mostrarAlerta(`Ruleta reseteada. ${usuario.nombre} ya puede girar de nuevo hoy.`, 'exito');
  }

  cerrarSesion() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}