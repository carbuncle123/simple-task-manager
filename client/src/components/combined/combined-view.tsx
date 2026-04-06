import { useState } from "react";
import { ShortTermPanel } from "./short-term-panel";
import { MidTermPanel } from "./mid-term-panel";

export function CombinedView() {
  const [isLeftOpen, setIsLeftOpen] = useState(true);

  return (
    <>
      {/* Desktop: side-by-side */}
      <div
        className="hidden md:grid gap-5 transition-[grid-template-columns] duration-300 ease-in-out"
        style={{
          gridTemplateColumns: isLeftOpen ? "1fr 2fr" : "0fr 1fr",
          height: "calc(100svh - 180px)",
        }}
      >
        <ShortTermPanel isOpen={isLeftOpen} />
        <MidTermPanel
          isLeftOpen={isLeftOpen}
          onToggleLeft={() => setIsLeftOpen((prev) => !prev)}
        />
      </div>

      {/* Mobile: stacked */}
      <div className="md:hidden space-y-4">
        <ShortTermPanel isOpen={true} />
        <MidTermPanel
          isLeftOpen={true}
          onToggleLeft={() => {}}
        />
      </div>
    </>
  );
}
