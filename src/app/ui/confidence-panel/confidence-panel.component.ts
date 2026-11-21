import { GeologyContextComponent } from '../../geology/geology-context.component';
import { MissionBriefingComponent } from '../../mission-briefing/mission-briefing.component';
import { MissionService } from '../../core/mission.service';
import { EnvironmentService } from '../../core/environment.service';
import { https } from '../../core/validation';
import { Component, inject } from '@angular/core';
import { ScienceContextComponent } from '../../science/science-context.component';
import { ExplorationConfidenceComponent } from '../../evidence/exploration-confidence.component';
import { ImagePassportComponent } from '../../evidence/image-passport.component';

@Component({
  selector: 'app-confidence-panel',
  standalone: true,
  imports: [
    GeologyContextComponent,
    MissionBriefingComponent,
    ScienceContextComponent,
    ExplorationConfidenceComponent,
    ImagePassportComponent,
  ],
  templateUrl: './confidence-panel.component.html',
  styleUrl: './confidence-panel.component.scss',
})
export class ConfidencePanelComponent {
  readonly mission = inject(MissionService);
  readonly environment = inject(EnvironmentService);
  sourceUrl(value: string): string | null {
    return https(value) ? value : null;
  }
}
