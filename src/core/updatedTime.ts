// Detect a concurrent update on the edit screen (FR-11). Compares the record's
// UPDATED_TIME field, not the client clock, so a skewed device does not
// produce a false warning.

/**
 * True when the record was updated after the draft was saved, meaning restoring
 * risks overwriting someone else's change. Null draft time (create screen) or a
 * missing current time yields false. Equal times count as no change.
 */
export function isUpdatedByOthers(
  draftUpdatedTime: string | null,
  currentUpdatedTime: string | null,
): boolean {
  if (!draftUpdatedTime || !currentUpdatedTime) {
    return false;
  }
  return new Date(currentUpdatedTime).getTime() > new Date(draftUpdatedTime).getTime();
}
