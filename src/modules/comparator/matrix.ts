import type { Party, PartyId, PublicProposal, Theme } from "@/modules/corpus/types";

export const EMPTY_BLOCK_NOTICE = "Sin propuestas registradas en este bloque";

export interface ComparisonCell {
  partyId: PartyId;
  count: number;
  proposals: PublicProposal[];
  emptyMessage: string | null;
}

export interface ComparisonRow {
  theme: Theme;
  totalAcrossSelection: number;
  cells: Record<PartyId, ComparisonCell>;
}

export interface ComparisonMatrix {
  selectedParties: Party[];
  rows: ComparisonRow[];
}

export function buildComparisonMatrix({
  selectedPartyIds,
  parties,
  themes,
  proposals,
  hideEmptyThemes = false,
  themeFilter,
}: {
  selectedPartyIds: PartyId[];
  parties: Party[];
  themes: Theme[];
  proposals: PublicProposal[];
  hideEmptyThemes?: boolean;
  themeFilter?: string;
}): ComparisonMatrix {
  const uniqueIds = Array.from(new Set(selectedPartyIds)).slice(0, 4);
  const partyMap = new Map(parties.map((p) => [p.id, p]));
  const selectedParties = uniqueIds
    .map((id) => partyMap.get(id))
    .filter((p): p is Party => Boolean(p));

  const selectedSet = new Set(selectedParties.map((p) => p.id));

  // Indexar por `${theme_id}::${party_id}` una sola vez en O(N)
  const grouped = new Map<string, PublicProposal[]>();
  for (const proposal of proposals) {
    if (!selectedSet.has(proposal.party_id)) continue;
    const key = `${proposal.theme_id}::${proposal.party_id}`;
    const list = grouped.get(key) ?? [];
    list.push(proposal);
    grouped.set(key, list);
  }

  const orderedThemes = [...themes].sort((a, b) => a.order - b.order);
  const rows: ComparisonRow[] = [];

  for (const theme of orderedThemes) {
    if (themeFilter && themeFilter !== "all" && theme.id !== themeFilter) {
      continue;
    }

    const cells = {} as Record<PartyId, ComparisonCell>;
    let totalAcrossSelection = 0;

    for (const party of selectedParties) {
      const items = grouped.get(`${theme.id}::${party.id}`) ?? [];
      totalAcrossSelection += items.length;
      cells[party.id] = {
        partyId: party.id,
        count: items.length,
        proposals: items,
        emptyMessage: items.length === 0 ? EMPTY_BLOCK_NOTICE : null,
      };
    }

    if (hideEmptyThemes && totalAcrossSelection === 0) {
      continue;
    }

    rows.push({
      theme,
      totalAcrossSelection,
      cells,
    });
  }

  return {
    selectedParties,
    rows,
  };
}
