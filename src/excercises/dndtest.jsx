import React, { useState, useRef } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
// Jednotlivý item (vizuál ve slotu)


// Dragovatelná položka
function Draggable({ id }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${
          isDragging ? 1.05 : 1
        })`
      : undefined,
    transition: "transform 100ms ease",
    touchAction: "none",
    willChange: "transform",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="item draggable"
      {...listeners}
      {...attributes}
    >
      {id}
    </div>
  );
}

// Slot (místo, kam to táhneš)
function Droppable({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`slot ${isOver ? "slot--over" : ""}`}>
      {children}
    </div>
  );
}

export default function MatchExercise({ options, labels, onAnswered }) {
  const answeredItems = useRef(new Set());

function ItemRenderer({ id, correct }) {
  return (
    <div
      className={`item bounce ${correct === true ? "correct" : ""} ${
        correct === false ? "wrong" : ""
      }`}
    >
      {id}
    </div>
  );
}



  // stav: co je kde
  const [slots, setSlots] = useState(
    Object.fromEntries(labels.map((_, i) => [`slot${i}`, null]))
  );

  const handleDragEnd = (event) => {
    const { over, active } = event;
    if (!over) return;

    setSlots((previousSlots) => {
      // zkontroluj, jestli item byl v nějakém slotu
      const wasInSlot = Object.values(previousSlots).includes(active.id);
      
      // odstraní item z původního slotu
      const nextState = Object.fromEntries(
        Object.entries(previousSlots).map(([key, value]) => [key, value === active.id ? null : value])
      );
      // vloží do nového slotu
      nextState[over.id] = active.id;

      // vyhodnocení správnosti pouze pokud item přichází z poolu (ne z jiného slotu)
      if (!wasInSlot && !answeredItems.current.has(active.id)) {
        answeredItems.current.add(active.id);
        const slotIndex = Number(over.id.replace("slot", ""));
        const isCorrectDrop = active.id === options[slotIndex];
        onAnswered && onAnswered(isCorrectDrop, 1);
      }

      // pokud jsou všechny sloty zaplněny, vyhodnoť celkový výsledek
      const allFilled = Object.values(nextState).every((v) => v != null);
      if (allFilled) {
        // Always pass true to avoid double HP deduction (HP already deducted for mistakes during drops)
        onAnswered && onAnswered(true, 0);
      }

      return nextState;
    });
  };

  const freeItems = options.filter((id) => !Object.values(slots).includes(id));

  // senzory pro drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 0 } })
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="container">
        <p className="question">Přiřaď správně:</p>

        {/* Pool s volnými možnostmi */}
        <div className="pool">
          {freeItems.map((id) => (
            <Draggable key={id} id={id} />
          ))}
        </div>

        {/* Sloty s popiskama */}
        <div className="slots">
          {labels.map((label, i) => {
            const slotId = `slot${i}`;
            const item = slots[slotId];
            const correct =
              item != null ? item === options[i] : null; // kontrola správnosti
              
            return (
              <div key={slotId}>
                <p className="textytext">{label}</p>
                <Droppable id={slotId}>
                  {item && <ItemRenderer id={item} correct={correct} />}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
