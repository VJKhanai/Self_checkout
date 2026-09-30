const round2 = (n) => Math.round(n * 100) / 100;

/** Server-side truth: totals are always recomputed from DB product rows. */
function buildOrderLines(products, items) {
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const lines = items.map(({ product, qty }) => {
    const p = byId.get(String(product));
    if (!p) throw new Error('Product missing while pricing cart');
    const lineNet = round2(p.price * qty);
    const gstAmount = round2((lineNet * p.gstPercent) / 100);
    return {
      product: p._id,
      name: p.name,
      price: p.price,
      qty,
      gstPercent: p.gstPercent,
      gstAmount,
      image: p.image,
      size: p.size,
      lineNet,
    };
  });
  const subtotal = round2(lines.reduce((s, l) => s + l.lineNet, 0));
  const gstTotal = round2(lines.reduce((s, l) => s + l.gstAmount, 0));
  return { lines, subtotal, gstTotal, total: round2(subtotal + gstTotal) };
}

module.exports = { buildOrderLines, round2 };
