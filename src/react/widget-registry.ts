import type { CvcWidget as ICvcWidget } from "capacitor-hyperswitch";

const registry = new Map<string, ICvcWidget>();

export function registerWidget(id: string, widget: ICvcWidget): void {
  registry.set(id, widget);
}

export function unregisterWidget(id: string): void {
  registry.delete(id);
}

export function getWidget(id: string): ICvcWidget | undefined {
  return registry.get(id);
}
