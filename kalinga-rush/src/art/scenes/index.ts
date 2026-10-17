// Registry of composed scenes. Each act file exports SCENES: id → SceneDef factory.
import type { SceneDef } from '../engine';

const mods = import.meta.glob<{ SCENES: Record<string, () => SceneDef> }>('./act*.ts', { eager: true });

export const SCENE_DEFS: Record<string, () => SceneDef> = Object.assign({}, ...Object.values(mods).map((m) => m.SCENES));
