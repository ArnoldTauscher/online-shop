export const calcPrices = (orderItems) => {
  // Die reduce() Methode von Array Instanzen führt eine vom Benutzer bereitgestellte "Reducer"-Callback-Funktion auf jedem Element des Arrays in Reihenfolge aus und übergibt dabei den Rückgabewert der Berechnung des vorhergehenden Elements.
  // The accumulator is the value that is returned by the callback function and passed as the first argument in the next iteration.
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const shippingPrice = itemsPrice > 100 ? 0 : 10;

  const taxRate = 0.19;
  const taxPrice = (itemsPrice * taxRate).toFixed(2);

  const totalPrice = (
    itemsPrice +
    shippingPrice +
    parseFloat(taxPrice)
  ).toFixed(2);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice,
    totalPrice,
  };
};
