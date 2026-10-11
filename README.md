# Praxis Learn

Платформа для изучения Python, Git и DevOps в стиле Cyberpunk 2077.
Аккаунты, прогресс и черновики кода хранятся в JSON-файле рядом с проектом —
папку можно скопировать на флешку и продолжить на другом компьютере.

## Запуск

Нужен только Node.js 18+. Зависимостей нет.

```bash
node serve.mjs          # http://localhost:3000
node serve.mjs 8080     # другой порт
```

Сервер раздаёт статику и API, поэтому открывать `index.html` двойным
кликом не стоит — курсы и вход не заработают.

## Где данные

`data/db.json` — всё вместе:

```json
{
  "users":   [{ "id": "u_...", "email": "...", "name": "...", "salt": "...", "passwordHash": "..." }],
  "progress": { "u_...": { "python-basics-01": { "status": "completed", "tasks": {}, "quiz": {} } } },
  "drafts":   { "u_...": { "task-1": { "code": "print(1)" } } }
}
```

Пароли не хранятся в открытом виде — только SHA-256 с солью на запись.
Файл можно править руками при выключенном сервере, бэкапить копированием
или выгружать через `/api/export`.

## API

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/api/auth/register` | регистрация `{ name, email, password }` |
| POST | `/api/auth/login` | вход `{ email, password }` |
| GET/POST | `/api/progress` | прогресс по урокам |
| GET/POST | `/api/drafts` | черновики кода |
| GET | `/api/export` | дамп базы для переноса |
| POST | `/api/import` | восстановление из дампа |
| GET | `/api/health` | проверка живости |

## Как добавить курс

1. Записать уроки в `content/<course-id>/*.json`.
2. Добавить курс в `content/courses.json` и список уроков в
   `content/<course-id>/index.json`.

Структура урока: `sections` (теория), `tasks` (задания с тестами по
ожидаемому выводу), `quiz` (проверка знаний).
