import { Inbox } from "lucide-react";

import { FixCardTile } from "@/components/fix/FixCardTile";
import { type FixCard } from "@/components/fix/FixBoardProvider";
import { BoardColumnShell, BoardEmptyState, ColumnHeader } from "@/components/vocab/VocabBoardPrimitives";

type FixInboxColumnProps = {
  hydrated: boolean;
  cards: FixCard[];
  expandedCardIds: Record<string, boolean>;
  onCardDragStart: (cardId: string) => void;
  onDropCard: () => void;
  onToggleExpanded: (cardId: string) => void;
  onResolve: (cardId: string) => void;
};

export function FixInboxColumn({
  hydrated,
  cards,
  expandedCardIds,
  onCardDragStart,
  onDropCard,
  onToggleExpanded,
  onResolve,
}: FixInboxColumnProps) {
  return (
    <BoardColumnShell
      accentClass="bg-slate-200"
      shellClass="border-slate-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,250,252,0.94)_100%)]"
      widthClass="w-[375px]"
      title={<ColumnHeader icon={<Inbox className="h-4 w-4" />} title="Inbox" subtitle={`${cards.length} grouped reports`} hideDefaultMenu />}
      onDrop={onDropCard}
    >
      {!hydrated ? (
        <BoardEmptyState text="Loading..." />
      ) : cards.length === 0 ? (
        <BoardEmptyState text="No active reports." />
      ) : (
        cards.map((card) => (
          <FixCardTile
            key={card.id}
            card={card}
            expanded={!!expandedCardIds[card.id]}
            draggable
            showDetails
            onDragStart={onCardDragStart}
            onToggleExpanded={() => onToggleExpanded(card.id)}
            onResolve={() => onResolve(card.id)}
          />
        ))
      )}
    </BoardColumnShell>
  );
}
