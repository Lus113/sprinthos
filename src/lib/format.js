export function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: value % 1 === 0 ? 0 : 1
  }).format(value);
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function titleFromCategory(category) {
  const dictionary = {
    televisions: "Телевизоры",
    refrigerators: "Холодильники",
    "game-consoles": "Игровые консоли",
    telephones: "Телефоны",
    "vacuum-cleaners": "Пылесосы",
    irons: "Утюги"
  };

  return dictionary[category] || category;
}
