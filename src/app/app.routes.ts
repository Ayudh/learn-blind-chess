import { Routes } from '@angular/router';
import { QuadrantTrainerComponent } from './quadrant-trainer/quadrant-trainer.component';

export const routes: Routes = [
  { path: 'quadrant-trainer', component: QuadrantTrainerComponent },
  { path: '', redirectTo: 'quadrant-trainer', pathMatch: 'full' },
];
