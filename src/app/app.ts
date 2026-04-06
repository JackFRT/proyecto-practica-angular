import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'] // Si no tienes app.css, puedes borrar esta línea
})
export class AppComponent {
  title = 'museo-ang';
}