import { Component, DoCheck, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { Combatant } from 'src/app/shared/models/combatant';
import { Token } from 'src/app/shared/models/token';
import { WSEventName } from 'src/app/shared/models/wsevent';
import {
  assignedPlayerCombatant,
  assignedPlayerReference,
  assignedPlayerToken,
  combatantWithHitPoints,
  combatantWithInitiative,
  hitPoints,
} from 'src/app/shared/player-tools';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-player-panel',
  templateUrl: './player-panel.component.html',
  styleUrls: ['./player-panel.component.scss'],
  standalone: false,
})
export class PlayerPanelComponent implements OnInit, DoCheck {
  @Input() state: AppState;
  @Output() closePanel = new EventEmitter<void>();
  @Output() showSheet = new EventEmitter<string>();

  currentHP: number | null = 0;
  temporaryHP: number | null = 0;
  initiativeValue: number | null = 0;

  hpDirty = false;
  initiativeDirty = false;

  private trackedTokenId?: string;
  private trackedCurrentHP?: number;
  private trackedTemporaryHP?: number;
  private trackedInitiative?: number;

  constructor(private dataService: DataService) {}

  get token(): Token | undefined {
    return assignedPlayerToken(this.state);
  }

  get combatant(): Combatant | undefined {
    return assignedPlayerCombatant(this.state);
  }

  get hp() {
    return hitPoints(this.combatant);
  }

  get sheetReference(): string | undefined {
    return assignedPlayerReference(this.state);
  }

  get canSetInitiative(): boolean {
    return !this.state.game.started && this.hasInitiative;
  }

  get hasInitiative(): boolean {
    return Boolean(this.combatant?.initiative?.length);
  }

  get hitPointInputsValid(): boolean {
    return this.currentHP !== null && this.temporaryHP !== null
      && Number.isFinite(Number(this.currentHP)) && Number.isFinite(Number(this.temporaryHP));
  }

  get initiativeInputValid(): boolean {
    return this.initiativeValue !== null && Number.isFinite(Number(this.initiativeValue));
  }

  get currentInitiative(): number | undefined {
    const value = this.combatant?.initiative?.[0]?.value;
    return value !== null && value !== undefined && Number.isFinite(Number(value)) ? Number(value) : undefined;
  }

  ngOnInit(): void {
    this.synchronizeDrafts(true);
  }

  ngDoCheck(): void {
    this.synchronizeDrafts(false);
  }

  private synchronizeDrafts(force: boolean): void {
    const tokenChanged = this.trackedTokenId !== this.token?.id;
    const hp = this.hp;
    const initiative = this.currentInitiative;

    if (force || tokenChanged || (!this.hpDirty && (
      this.trackedCurrentHP !== hp?.current || this.trackedTemporaryHP !== hp?.temporary
    ))) {
      this.currentHP = hp?.current ?? 0;
      this.temporaryHP = hp?.temporary ?? 0;
      this.hpDirty = false;
    }

    if (force || tokenChanged || (!this.initiativeDirty && this.trackedInitiative !== initiative)) {
      this.initiativeValue = initiative ?? 0;
      this.initiativeDirty = false;
    }

    this.trackedTokenId = this.token?.id;
    this.trackedCurrentHP = hp?.current;
    this.trackedTemporaryHP = hp?.temporary;
    this.trackedInitiative = initiative;
  }

  saveHitPoints(): void {
    const combatant = this.combatant;
    if (!combatant || !this.hp || !this.hitPointInputsValid) return;

    const patch = combatantWithHitPoints(combatant, Number(this.currentHP), Number(this.temporaryHP));
    Object.assign(combatant, patch);
    this.hpDirty = false;
    this.synchronizeDrafts(true);
    this.dataService.send({ name: WSEventName.updateCombatant, data: patch });
  }

  saveInitiative(): void {
    const combatant = this.combatant;
    if (!combatant || !this.canSetInitiative || !this.initiativeInputValid) return;

    const patch = combatantWithInitiative(combatant, Number(this.initiativeValue));
    Object.assign(combatant, patch);
    this.initiativeDirty = false;
    this.synchronizeDrafts(true);
    this.dataService.send({ name: WSEventName.updateCombatant, data: patch });
  }

  openSheet(): void {
    if (this.sheetReference) this.showSheet.emit(this.sheetReference);
  }
}
