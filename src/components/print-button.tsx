"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn btn-sun" onClick={() => window.print()}>
      🖨️ Print / gem som PDF
    </button>
  );
}
