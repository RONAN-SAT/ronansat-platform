"use client";

import { useSession } from "next-auth/react";

import Loading from "@/components/Loading";
import { FixBoardProvider } from "@/components/fix/FixBoardProvider";
import { FixColumn } from "@/components/fix/FixColumn";
import { FixInboxColumn } from "@/components/fix/FixInboxColumn";
import { FixPageHeader } from "@/components/fix/FixPageHeader";
import { useFixPageController } from "@/components/fix/useFixPageController";
import { VocabAddColumnPanel } from "@/components/vocab/VocabAddColumnPanel";

function isFixCard<T>(value: T | undefined | null): value is T {
  return Boolean(value);
}

function FixBoardScreen() {
  const {
    board,
    hydrated,
    inboxCards,
    draggingColumnId,
    dropIndicator,
    isAddingColumn,
    newColumnTitle,
    editingColumnId,
    editingColumnTitle,
    openMenuColumnId,
    expandedCardIds,
    menuRef,
    boardScrollRef,
    setDraggingCardId,
    setEditingColumnTitle,
    setIsAddingColumn,
    setNewColumnTitle,
    handleCreateColumn,
    cancelCreateColumn,
    startEditColumn,
    saveColumnEdit,
    cancelColumnEdit,
    toggleColumnMenu,
    handleChangeColumnColor,
    handleRemoveColumn,
    handleDropCardToBucket,
    handleColumnDragStart,
    clearColumnDragState,
    handleColumnDragOver,
    handleColumnDrop,
    handleBoardDragOver,
    handleBoardDrop,
    removeCard,
    toggleExpandedCard,
  } = useFixPageController();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_rgba(232,240,247,0.88)_26%,_rgba(225,233,241,0.96)_100%)] px-4 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1640px]">
        <FixPageHeader />

        <section className="rounded-[28px] border border-white/75 bg-white/38 p-3 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-400">Collections</div>
            </div>
            <div className="text-[12px] text-slate-500">{board.columns.length} lists</div>
          </div>

          <div
            ref={boardScrollRef}
            className="flex gap-4 overflow-x-auto pb-2"
            onDragOver={handleBoardDragOver}
            onDrop={handleBoardDrop}
          >
            <FixInboxColumn
              hydrated={hydrated}
              cards={inboxCards}
              expandedCardIds={expandedCardIds}
              onCardDragStart={setDraggingCardId}
              onDropCard={() => handleDropCardToBucket("inbox")}
              onToggleExpanded={toggleExpandedCard}
              onResolve={removeCard}
            />

            {board.columns.map((column) => {
              const columnCards = column.cardIds.map((cardId) => board.cards[cardId]).filter(isFixCard);
              const showBefore =
                dropIndicator?.columnId === column.id &&
                dropIndicator.position === "before" &&
                draggingColumnId !== column.id;
              const showAfter =
                dropIndicator?.columnId === column.id &&
                dropIndicator.position === "after" &&
                draggingColumnId !== column.id;

              return (
                <FixColumn
                  key={column.id}
                  column={column}
                  cards={columnCards}
                  showBefore={showBefore}
                  showAfter={showAfter}
                  isDragging={draggingColumnId === column.id}
                  editingColumnId={editingColumnId}
                  editingColumnTitle={editingColumnTitle}
                  openMenuColumnId={openMenuColumnId}
                  menuRef={menuRef}
                  onCardDragStart={setDraggingCardId}
                  onColumnTitleChange={setEditingColumnTitle}
                  onSaveColumnEdit={saveColumnEdit}
                  onCancelColumnEdit={cancelColumnEdit}
                  onStartColumnEdit={() => startEditColumn(column)}
                  onToggleMenu={toggleColumnMenu}
                  onUpdateColumnColor={handleChangeColumnColor}
                  onRemoveColumn={handleRemoveColumn}
                  onDropCard={() => handleDropCardToBucket(column.id)}
                  onHeaderDragStart={handleColumnDragStart}
                  onHeaderDragEnd={clearColumnDragState}
                  onHeaderDragOver={handleColumnDragOver}
                  onHeaderDrop={(event, columnId) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleColumnDrop(columnId);
                  }}
                  onResolveCard={removeCard}
                />
              );
            })}

            <VocabAddColumnPanel
              isAddingColumn={isAddingColumn}
              newColumnTitle={newColumnTitle}
              onNewColumnTitleChange={setNewColumnTitle}
              onCreateColumn={handleCreateColumn}
              onCancel={cancelCreateColumn}
              onStart={() => setIsAddingColumn(true)}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function FixPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Loading />;
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-lg border border-slate-200 bg-white p-8 font-bold text-red-600">
          Unauthorized. Admin access required.
        </div>
      </div>
    );
  }

  return (
    <FixBoardProvider>
      <FixBoardScreen />
    </FixBoardProvider>
  );
}
