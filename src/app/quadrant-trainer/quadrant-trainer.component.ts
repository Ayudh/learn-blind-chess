import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type Quadrant = 'TL' | 'TR' | 'BL' | 'BR' | 'ALL';
type Activity = 'GRID' | 'TEXT' | 'PAIR';

@Component({
  selector: 'app-quadrant-trainer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quadrant-trainer.component.html',
  styleUrl: './quadrant-trainer.component.css',
})
export class QuadrantTrainerComponent {
  selectedQuadrant = signal<Quadrant | null>(null);
  currentActivity = signal<Activity | null>(null);

  // Game State
  // For Grid: we just show the grid. Maybe highlight one cell?
  // "color guesser with 4*4 grid - where entire board is displayed without black/white colors - greyscale"
  // I assume this means we show the grid structure, pick a random cell, highlight it, and user guesses color.
  activeCell = signal<string | null>(null);

  // Text Activity
  currentCoordinate = signal<string>('');

  // Pair Activity
  pairCoordinates = signal<{ c1: string; c2: string } | null>(null);

  feedback = signal<string>('');
  score = signal<number>(0);

  constructor() {}

  selectQuadrant(q: Quadrant) {
    this.selectedQuadrant.set(q);
    this.currentActivity.set(null);
    this.feedback.set('');
    this.score.set(0);
  }

  startActivity(activity: Activity) {
    this.currentActivity.set(activity);
    this.score.set(0);
    this.nextChallenge();
  }

  nextChallenge() {
    this.feedback.set('');
    const coords = this.getCoordinatesForQuadrant(this.selectedQuadrant()!);

    if (this.currentActivity() === 'GRID' || this.currentActivity() === 'TEXT') {
      let randomCoord;
      do {
        randomCoord = coords[Math.floor(Math.random() * coords.length)];
      } while (randomCoord === this.currentCoordinate() && coords.length > 1);

      this.activeCell.set(randomCoord);
      this.currentCoordinate.set(randomCoord);
    } else if (this.currentActivity() === 'PAIR') {
      let c1, c2;
      const currentPair = this.pairCoordinates();
      do {
        c1 = coords[Math.floor(Math.random() * coords.length)];
        c2 = coords[Math.floor(Math.random() * coords.length)];
      } while (currentPair && c1 === currentPair.c1 && c2 === currentPair.c2 && coords.length > 1);

      this.pairCoordinates.set({ c1, c2 });
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.currentActivity()) return;

    if (event.key === 'ArrowLeft') {
      this.handleInput('LEFT');
    } else if (event.key === 'ArrowRight') {
      this.handleInput('RIGHT');
    }
  }

  handleInput(input: 'LEFT' | 'RIGHT') {
    // Logic:
    // GRID/TEXT: Left = Dark (Black), Right = Light (White)? Or user preference?
    // Let's standardize: Left = Dark, Right = Light.
    // PAIR: Left = Same, Right = Different.

    let correct = false;
    const activity = this.currentActivity();

    if (activity === 'GRID' || activity === 'TEXT') {
      const coord = this.currentCoordinate(); // For grid we also use this to track the active cell logic
      const isDark = this.isDark(coord);
      // Left (Dark) -> isDark
      // Right (Light) -> !isDark
      if (input === 'LEFT' && isDark) correct = true;
      if (input === 'RIGHT' && !isDark) correct = true;
    } else if (activity === 'PAIR') {
      const pair = this.pairCoordinates();
      if (!pair) return;
      const sameColor = this.isDark(pair.c1) === this.isDark(pair.c2);
      // Left = Same, Right = Different
      if (input === 'LEFT' && sameColor) correct = true;
      if (input === 'RIGHT' && !sameColor) correct = true;
    }

    if (correct) {
      this.feedback.set('Correct!');
      this.score.update((s) => s + 1);
      setTimeout(() => this.nextChallenge(), 500);
    } else {
      this.feedback.set('Wrong!');
    }
  }

  getCoordinatesForQuadrant(q: Quadrant): string[] {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
    let fileRange = [0, 7];
    let rankRange = [0, 7];

    if (q === 'BL') {
      fileRange = [0, 3];
      rankRange = [0, 3];
    }
    if (q === 'BR') {
      fileRange = [4, 7];
      rankRange = [0, 3];
    }
    if (q === 'TL') {
      fileRange = [0, 3];
      rankRange = [4, 7];
    }
    if (q === 'TR') {
      fileRange = [4, 7];
      rankRange = [4, 7];
    }

    const coords: string[] = [];
    for (let r = rankRange[0]; r <= rankRange[1]; r++) {
      for (let f = fileRange[0]; f <= fileRange[1]; f++) {
        coords.push(files[f] + ranks[r]);
      }
    }
    return coords;
  }

  isDark(coord: string): boolean {
    const files = 'abcdefgh';
    const file = files.indexOf(coord[0]);
    const rank = parseInt(coord[1]) - 1;
    return (file + rank) % 2 === 0;
  }

  // Helper for Grid View
  getGridRows() {
    // Always return 8x8, but we might mask/dim ones not in quadrant?
    // Or just show the 4x4 if a quadrant is selected?
    // "user can select one 4*4 quadrant... where entire board is displayed without black/white colors"
    // "entire board is displayed" -> Suggests we always show 8x8, but maybe zoom in or just highlight the active quadrant?
    // Let's show 8x8 for context, but maybe only active quadrant cells are interactive?
    // Actually, for "Grid" activity, it says "color guesser with 4*4 grid".
    // Maybe we just show the 4x4 grid for the quadrant?
    // But "entire board is displayed" is mentioned in the prompt: "where entire board is displayed without black/white colors".
    // So I will display the full 8x8 grid.

    const rows = [];
    for (let r = 7; r >= 0; r--) {
      // 8 down to 1
      const row = [];
      for (let f = 0; f < 8; f++) {
        const files = 'abcdefgh';
        const coord = files[f] + (r + 1);
        row.push(coord);
      }
      rows.push(row);
    }
    return rows;
  }

  isInQuadrant(coord: string): boolean {
    if (this.selectedQuadrant() === 'ALL') return true;
    const valid = this.getCoordinatesForQuadrant(this.selectedQuadrant()!);
    return valid.includes(coord);
  }
}
