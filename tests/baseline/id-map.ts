// Part ids of the original app (commit 7885117) -> part ids of this app.
// Identity for ids that did not change.
export const ID_MAP: Record<string, string> = {};

export const mapId = (oldId: string) => ID_MAP[oldId] ?? oldId;
