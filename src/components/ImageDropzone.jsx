import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл."));
    reader.readAsDataURL(file);
  });
}

export default function ImageDropzone({
  label,
  hint,
  value = [],
  onChange,
  maxFiles = 5,
  primaryLabel = "Главное фото"
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (!imageFiles.length) {
      setMessage("Можно загружать только изображения.");
      return;
    }

    const availableSlots = Math.max(0, maxFiles - value.length);

    if (availableSlots <= 0) {
      setMessage(`Можно добавить не более ${maxFiles} изображений.`);
      return;
    }

    const nextBatch = imageFiles.slice(0, availableSlots);

    if (imageFiles.length > availableSlots) {
      setMessage(`Загружены только первые ${availableSlots} файлов. Максимум: ${maxFiles}.`);
    } else {
      setMessage("");
    }

    try {
      const urls = await Promise.all(nextBatch.map(readFileAsDataUrl));
      onChange([...value, ...urls]);
    } catch (error) {
      setMessage(error.message || "Не удалось обработать изображения.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {label && <p className="text-sm font-medium text-stone-700">{label}</p>}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-6 py-8 text-center transition ${
          dragActive
            ? "border-lime-600 bg-lime-50"
            : "border-stone-300 bg-[var(--surface-muted)] hover:border-lime-500/60 hover:bg-lime-50/70"
        }`}
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-white text-lime-700 shadow-sm">
          <Upload className="size-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-stone-900">
          Перетащите изображения сюда или нажмите для выбора
        </p>
        <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">
          Поддерживается одновременная загрузка нескольких файлов. Максимум: {maxFiles}.
        </p>
        {hint && <p className="mt-2 text-xs uppercase tracking-[0.24em] text-lime-800">{hint}</p>}
      </label>

      {message && (
        <div className="rounded-[18px] bg-lime-100 px-4 py-3 text-sm text-lime-900">{message}</div>
      )}

      {value.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {value.map((image, index) => (
            <div key={`${image.slice(0, 20)}-${index}`} className="rounded-[22px] bg-white p-3 shadow-sm">
              <div className="relative overflow-hidden rounded-[18px]">
                <img src={image} alt={`Загруженное изображение ${index + 1}`} className="h-36 w-full object-cover" />
                {index === 0 && (
                  <div className="absolute left-3 top-3 rounded-full bg-lime-600 px-3 py-1 text-xs font-semibold text-white">
                    {primaryLabel}
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm text-stone-600">
                  <ImagePlus className="size-4 text-lime-700" />
                  <span>Изображение {index + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChange(value.filter((_, imageIndex) => imageIndex !== index));
                    setMessage("");
                  }}
                  className="rounded-full border border-stone-900/10 p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-600"
                  aria-label={`Удалить изображение ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
