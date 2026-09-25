export interface StatusEffect {
  id: string
  name?: string
  type?: string
  reference?: string
  color?: string
  /** A game icon name (`gi-poisoned`), or the path of an image in a system, module or campaign. */
  icon?: string
  enabled?: boolean
}
