import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './checkout.html',
})
export class CheckoutComponent implements OnInit {
  // Datos del producto y cálculo
  producto: any = null;
  cantidad = 1;
  precioBase = 0;
  total = 0;

  // Cupones
  codigoInput = '';
  codigoAplicado = '';
  descuentoActual = 0;
  mensajeCupon = '';
  estadoCupon: 'ninguno' | 'cargando' | 'exito' | 'error' = 'ninguno';

  // Formulario de pago
  tipoComprobante = 'boleta';
  dniOpcional = '';
  nombreArchivoComprobante = '';
  
  // Estado de éxito y fidelidad
  reservaExitosa = false;
  numeroOrden = '';
  cuponRegalo = '';
  mensajeFidelidad = '';
  plantasAcumuladas = 0;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    // 1. Verificamos la sesión
    const idUsuario = localStorage.getItem('id_usuario');
    if (!idUsuario || idUsuario === 'undefined' || idUsuario === 'null') {
      this.router.navigate(['/login']);
      return;
    }

    // 2. Extraemos el carrito de forma segura
    const carritoGuardado = localStorage.getItem('carrito_museo');
    if (carritoGuardado) {
      try {
        this.producto = JSON.parse(carritoGuardado);
        this.precioBase = Number(this.producto.precio) || 0; // Evitamos que sea undefined
        this.actualizarTotal();
      } catch (error) {
        console.error('Error al leer el carrito:', error);
        this.router.navigate(['/galeria']);
      }
    } else {
      this.router.navigate(['/galeria']);
    }
  }

  actualizarTotal() {
    let subtotal = this.precioBase * this.cantidad;
    let cantidadDescontada = subtotal * (this.descuentoActual / 100);
    this.total = subtotal - cantidadDescontada;
  }

  aplicarCupon() {
    const codigo = this.codigoInput.trim().toUpperCase();
    if (codigo === '') {
      this.estadoCupon = 'error';
      this.mensajeCupon = 'Ingresa un código primero.';
      return;
    }

    this.estadoCupon = 'cargando';
    this.mensajeCupon = 'Consultando a Moka...';

    // Buscamos el cupón en la base de datos
    this.http.get<any[]>(`http://localhost:3000/cupones?codigo=${codigo}`).subscribe(cupones => {
      if (cupones.length > 0) {
        const cupon = cupones[0];
        
        // Verificamos si tiene límite de usos
        if (cupon.usos_actuales >= cupon.limite_usos) {
          this.estadoCupon = 'error';
          this.mensajeCupon = 'Este cupón ya alcanzó su límite de usos.';
          this.descuentoActual = 0;
        } else {
          this.descuentoActual = cupon.dcto || cupon.descuento_porcentaje;
          this.codigoAplicado = cupon.codigo;
          this.estadoCupon = 'exito';
          this.mensajeCupon = `¡Cupón del ${this.descuentoActual}% aplicado exitosamente!`;
          
          // Sumamos un uso al cupón en la base de datos
          this.http.patch(`http://localhost:3000/cupones/${cupon.id}`, { usos_actuales: (cupon.usos_actuales || 0) + 1 }).subscribe();
        }
      } else {
        this.estadoCupon = 'error';
        this.mensajeCupon = 'Código no válido o expirado.';
        this.descuentoActual = 0;
      }
      this.actualizarTotal();
    });
  }

  confirmarPago() {
    if (!this.nombreArchivoComprobante) {
      alert('Por favor, ingresa el nombre de tu captura (simulación).');
      return;
    }

    const idUsuario = localStorage.getItem('id_usuario');

    // 1. Calculamos la fidelidad antes de guardar la reserva
    this.http.get<any[]>(`http://localhost:3000/reservas?id_usuario=${idUsuario}&recompensa_procesada=false`).subscribe(reservasPrevias => {
      
      // Filtramos las canceladas y sumamos la cantidad
      let totalAcumulado = 0;
      reservasPrevias.forEach(r => {
        if (r.estado !== 'cancelado') totalAcumulado += Number(r.cantidad);
      });
      
      totalAcumulado += this.cantidad; // Sumamos lo que está comprando ahora
      let procesarRecompensa = false;

      // 2. Verificamos si gana el premio
      if (totalAcumulado >= 4) {
        procesarRecompensa = true;
        this.plantasAcumuladas = 4;
        this.cuponRegalo = "MOKA-" + Math.random().toString(36).substring(2,7).toUpperCase();
        
        // Guardamos el premio en la BD
        this.http.post('http://localhost:3000/cupones', {
          codigo: this.cuponRegalo,
          descuento_porcentaje: 25,
          id_usuario: idUsuario,
          usos_actuales: 0,
          limite_usos: 1
        }).subscribe();
        
      } else {
        this.plantasAcumuladas = totalAcumulado;
        let faltantes = 4 - totalAcumulado;
        this.mensajeFidelidad = `¡Vas por buen camino! Te faltan solo ${faltantes} cactus para obtener tu próximo premio.`;
      }

      // 3. Guardamos la nueva reserva
      const nuevaReserva = {
        id_usuario: idUsuario,
        cliente: localStorage.getItem('nombre') || 'Cliente',
        producto_nombre: this.producto.nombre,
        cantidad: this.cantidad,
        total_pagado: this.total,
        codigo_cupon: this.codigoAplicado,
        tipo_comprobante: this.tipoComprobante,
        dni_opcional: this.dniOpcional,
        comprobante_img: this.nombreArchivoComprobante,
        estado: 'pendiente',
        fecha_reserva: new Date().toISOString(),
        recompensa_procesada: procesarRecompensa
      };

      this.http.post('http://localhost:3000/reservas', nuevaReserva).subscribe((res: any) => {
        this.numeroOrden = res.id;
        
        // Descontamos el stock
        const nuevoStock = this.producto.stock - this.cantidad;
        this.http.patch(`http://localhost:3000/productos/${this.producto.id}`, { stock: nuevoStock }).subscribe();

        // Limpiamos el carrito y mostramos la pantalla final
        localStorage.removeItem('carrito_museo');
        this.reservaExitosa = true;
      });
    });
  }
}