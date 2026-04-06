import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { GalleryComponent } from './components/gallery/gallery';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { EmployeeDashboardComponent } from './components/employee-dashboard/employee-dashboard';
import { ProfileComponent } from './components/profile/profile';
import { CheckoutComponent } from './components/checkout/checkout';

export const routes: Routes = [
  { path: '', redirectTo: 'galeria', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'galeria', component: GalleryComponent }, // Vista para clientes
  { path: 'admin', component: AdminDashboardComponent }, // CRUD, usuarios, cupones
  { path: 'empleado', component: EmployeeDashboardComponent }, // Ventas, stock
  { path: 'perfil', component: ProfileComponent},
  {path: 'checkout', component: CheckoutComponent},
  { path: '**', redirectTo: 'login' } // Si escriben una ruta que no existe
];