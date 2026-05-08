# Офелия

Демо-магазин домашней техники на `React + Tailwind + Express + Prisma + Supabase`.

## Что внутри

- витрина, каталог, карточка товара, блог, корзина, тарифы, профиль и 404
- админ-панель с CRUD для товаров, публикаций, заказов и тарифных заявок
- `Supabase PostgreSQL` для данных
- `Supabase Storage` для изображений товаров и блога
- `Prisma` для схемы, миграций и seed-скрипта

## Переменные окружения

Создайте `.env` по образцу `.env.example`.

Обязательные переменные:

```env
PORT=3001
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`DATABASE_URL` используется приложением во время работы.

`DIRECT_DATABASE_URL` используется Prisma CLI для миграций и seed, чтобы при необходимости можно было идти не через runtime pooler.

Для Supabase удобнее всего брать точную строку из `Connect -> Session pooler` в панели проекта. Не стоит угадывать `aws-0`/`aws-1` и регион вручную: у разных проектов хост может отличаться.

## Установка

```bash
npm install
```

## Prisma и база данных

Сгенерировать Prisma Client:

```bash
npm run prisma:generate
```

Применить миграции:

```bash
npm run migrate
```

Заполнить базу стартовыми данными:

```bash
npm run seed
```

Seed создает:

- администратора `admin@admin.com / password`
- демо-пользователя `hello@ophelia.store / ophelia123`
- категории каталога
- 3 демо-товара
- 1 публикацию блога
- 1 тарифную заявку

## Локальный запуск

Запустить API и фронтенд вместе:

```bash
npm run dev
```

Приложение будет доступно:

- фронтенд: `http://127.0.0.1:4173`
- API: `http://127.0.0.1:3001`

## Production

Собрать фронтенд:

```bash
npm run build
```

Запустить production-сервер:

```bash
npm run start
```

## Railway

Для Railway задайте переменные окружения:

- `PORT`
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Перед первым запуском выполните миграции и seed:

```bash
npm run prisma:generate
npm run migrate
npm run seed
```

После этого приложение можно запускать через:

```bash
npm run start
```
