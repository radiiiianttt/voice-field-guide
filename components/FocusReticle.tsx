"use client";

/** Camera-focus brackets shown in the viewfinder while aiming/analyzing. */
export function FocusReticle({ active }: { active?: boolean }) {
  return (
    <div className="reticle" data-active={active}>
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
