export function handleRussianInvalid(event) {
  const field = event.target;

  if (field.validity.valueMissing) {
    if (field.type === "checkbox") {
      field.setCustomValidity("Подтвердите согласие, чтобы продолжить.");
      return;
    }

    field.setCustomValidity("Заполните это поле.");
    return;
  }

  if (field.validity.typeMismatch && field.type === "email") {
    field.setCustomValidity("Укажите корректный адрес эл. почты.");
    return;
  }

  field.setCustomValidity("Проверьте корректность заполнения поля.");
}

export function clearRussianValidity(event) {
  event.target.setCustomValidity("");
}
