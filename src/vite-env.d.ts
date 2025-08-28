/// <reference types="vite/client" />
// node_modules/tinykeys/dist/tinykeys.d.ts
declare module "tinykeys" {
  /**
   * A single press of a keybinding sequence
   */
  export type KeyBindingPress = [mods: string[], key: string | RegExp];

  /**
   * A map of keybinding strings to event handlers.
   */
  export interface KeyBindingMap {
    [keybinding: string]: (event: KeyboardEvent) => void;
  }

  export interface KeyBindingHandlerOptions {
    /**
     * Keybinding sequences will wait this long between key presses before
     * cancelling (default: 1000).
     *
     * **Note:** Setting this value too low (i.e. `300`) will be too fast for many
     * of your users.
     */
    timeout?: number;
  }

  /**
   * Options to configure the behavior of keybindings.
   */
  export interface KeyBindingOptions extends KeyBindingHandlerOptions {
    /**
     * Key presses will listen to this event (default: "keydown").
     */
    event?: "keydown" | "keyup";
    /**
     * Key presses will use a capture listener (default: false)
     */
    capture?: boolean;
  }

  /**
   * Parses a "Key Binding String" into its parts
   */
  export function parseKeybinding(str: string): KeyBindingPress[];

  /**
   * This tells us if a single keyboard event matches a single keybinding press.
   */
  export function matchKeyBindingPress(event: KeyboardEvent, press: KeyBindingPress): boolean;

  /**
   * Creates an event listener for handling keybindings.
   */
  export function createKeybindingsHandler(
    keyBindingMap: KeyBindingMap,
    options?: KeyBindingHandlerOptions
  ): EventListener;

  /**
   * Subscribes to keybindings.
   *
   * Returns an unsubscribe method.
   */
  export function tinykeys(
    target: Window | HTMLElement,
    keyBindingMap: KeyBindingMap,
    options?: KeyBindingOptions
  ): () => void;
}
