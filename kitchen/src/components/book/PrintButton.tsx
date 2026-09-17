"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn rounded-xl border border-line bg-white px-4 py-2"
    >
      Print or save as PDF
    </button>
  );
}
