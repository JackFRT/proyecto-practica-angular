import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class LoginComponent {
  modoRegistro = false; 

  nombre = '';
  email = '';
  password = '';
  
  error = '';
  exito = '';

  constructor(private router: Router, private http: HttpClient) {}

  toggleModo(event: Event) {
    event.preventDefault(); 
    this.modoRegistro = !this.modoRegistro;
    this.error = ''; this.exito = '';
    this.email = ''; this.password = ''; this.nombre = '';
  }

  procesarFormulario() {
    this.error = '';
    this.exito = '';

    if (this.modoRegistro) {
      if (!this.nombre || !this.email || !this.password) {
        this.error = 'Necesitas completar esos campos.';
        return;
      }

      const nuevoUsuario = {
        nombre: this.nombre,
        correo: this.email,
        password: this.password,
        rol: 'Cliente',
        visitas: 0
      };

      this.http.post('http://localhost:3000/usuarios', nuevoUsuario).subscribe({
        next: () => {
          this.exito = '¡Bienvenido al Museo! Tu cuenta ha sido creada. Inicia sesión.';
          setTimeout(() => {
            this.modoRegistro = false;
            this.exito = '';
            this.password = ''; 
          }, 2500);
        },
        error: () => this.error = 'Error de conexión con la base de datos.'
      });

    } else {
      if (!this.email || !this.password) {
        this.error = 'Por favor, completa todos los campos.';
        return;
      }

      // MAGIA AQUÍ: Traemos a TODOS los usuarios y Angular hace la validación exacta
      this.http.get<any[]>('http://localhost:3000/usuarios').subscribe({
        next: (usuarios) => {
          // Buscamos coincidencia estricta
          const usuarioConfirmado = usuarios.find(u => u.correo === this.email && u.password === this.password);

          if (usuarioConfirmado) {
            localStorage.setItem('id_usuario', usuarioConfirmado.id);
            localStorage.setItem('rol', usuarioConfirmado.rol);
            localStorage.setItem('nombre', usuarioConfirmado.nombre);

            const rol = usuarioConfirmado.rol.toLowerCase();
            if (rol === 'admin') this.router.navigate(['/admin']);
            else if (rol === 'empleado') this.router.navigate(['/empleado']);
            else this.router.navigate(['/galeria']);
          } else {
            this.error = 'Correo o contraseña incorrectos. Moka te está juzgando.';
          }
        },
        error: () => this.error = 'Error de conexión con el servidor.'
      });
    }
  }
}