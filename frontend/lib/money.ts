/** NFR-U7: prices always display as "GH₵ 380.00", never raw pesewas. */
export function formatMoney(pesewas: number): string {
  return (
    "GH₵ " +
    (pesewas / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
