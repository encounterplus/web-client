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
  PlayerEffect,
  playerEffects,
} from 'src/app/shared/player-tools';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-player-panel',
  templateUrl: './player-panel.component.html',
  styleUrls: ['./player-panel.component.scss'],
  standalone: false,
})
export class PlayerPanelComponent implements OnInit, DoCheck {
  @Input() state!: AppState;
  @Input() stateRevision = 0;
  @Output() closePanel = new EventEmitter<void>();
  @Output() showSheet = new EventEmitter<string>();
  @Output() showEffect = new EventEmitter<PlayerEffect>();

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

  get activeEffects(): PlayerEffect[] {
    // Encounter+ keeps the live status-effect collection on the token's combatant copy.
    return playerEffects(this.token?.combatant ?? this.combatant);
  }

  get canSetInitiative(): boolean {
    return !this.state.game.started && Boolean(this.combatant);
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

  effectHasDetails(effect: PlayerEffect): boolean {
    return Boolean(effect.reference || effect.description);
  }

  effectLabel(effect: PlayerEffect): string {
    return effect.value ? `${effect.name} ${effect.value}` : effect.name;
  }

  effectIconUrl(effect: PlayerEffect): string | undefined {
    const icon = effect.icon;
    if (!icon || !/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(icon)) return undefined;
    if (/^(?:data:|https?:)/i.test(icon)) return icon;
    return `${this.dataService.baseURL}/${icon.replace(/^\//, '')}`;
  }

  openEffect(effect: PlayerEffect): void {
    if (this.effectHasDetails(effect)) this.showEffect.emit(effect);
  }
}
