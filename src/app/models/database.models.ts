// src/app/models/database.models.ts

export interface Usuario {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: 'cliente' | 'empleado' | 'admin';
  visitas_presenciales: number;
  fecha_ultimo_giro: Date | null;
  giros_extra: number;
}

export interface ProductoCactus {
  id_cactus: number;
  nombre_comun: string;
  nombre_cientifico: string;
  categoria: string;
  precio: number;
  stock: number;
  descripcion_moka: string;
  imagen_url: string;
}

export interface PremioRuleta {
  id_premio: number;
  titulo: string;
  descuento_porcentaje: number;
  probabilidad: number;
  color_seccion: string;
  activo: boolean;
}