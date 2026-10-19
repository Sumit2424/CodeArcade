/** User preferences. Stored in VS Code's own settings (see package.json "configuration"). */
export interface Settings {
  /** Pause the game when the panel loses focus or is hidden. */
  readonly pauseWhenPanelLosesFocus: boolean;
  /** Pause the game when the assistant needs the user (e.g. a permission prompt). */
  readonly pauseWhenClaudeNeedsAttention: boolean;
  /** Pause the game when the assistant finishes its turn. */
  readonly pauseWhenClaudeFinishes: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  pauseWhenPanelLosesFocus: true,
  pauseWhenClaudeNeedsAttention: true,
  pauseWhenClaudeFinishes: true,
};
