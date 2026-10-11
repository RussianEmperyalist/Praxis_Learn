#!/usr/bin/env node
const fs = require('fs');

function gen(cfg) {
    const filename = cfg.id.replace(/^python-/, '') + '.json';
    const fullPath = `content/python/${filename}`;
    fs.writeFileSync(fullPath, JSON.stringify(cfg, null, 2), 'utf8');
    console.log('OK: ' + fullPath);
}

const lessons = [
  // 22 - JSON
  {
    id: 'python-22-json',
    title: "JSON и сериализация",
    goal: 'Преобразовывать данные через json.dumps и json.loads',
    prereq: ['python-21-context-managers'],
    duration: 14,
    theory: [
      { type: "hook", content: "V должен отправить статус агента через сеть. Сеть понимает JSON, а не dict. json.dumps превращает dict в строку, json.loads — обратно." },
      { type: "heading", content: "Что такое JSON" },
      { type: "text", content: "JSON (JavaScript Object Notation) — текстовый формат данных. Используется для передачи данных по сети. Поддерживает: объекты, массивы, строки, числа, bool, null." },
      { type: "code", content: "import json\ndata = {'name': 'V', 'score': 95, 'active': True}\njson_str = json.dumps(data)\nprint(json_str)  # {\"name\": \"V\", \"score\": 95, \"active\": true}" },
      { type: "heading", content: "json.dumps: Python → JSON строка" },
      { type: "text", content: "json.dumps(obj) сериализует Python-объект в JSON-строку. dict → объект, list → массив, str → строка, int/float → число, True/False → true/false, None → null." },
      { type: "code", content: "import json\nagents = {'В': 95, 'Rex': 88, 'Nova': 92}\njson_str = json.dumps(agents, indent=2)\nprint(json_str)" },
      { type: "predict", code: "import json\nprint(json.dumps({'a': 1}))", question: "Что выведет?", options: ["{'a': 1}", '{"a": 1}', "[1, 'a']", "Ошибка"], answer: 1, explain: "json.dumps сериализует dict в JSON-строку с двойными кавычками: {\"a\": 1}." },
      { type: "heading", content: "json.loads: JSON строка → Python" },
      { type: "text", content: "json.loads(str) десериализует JSON-строку в Python-объект. Обратное преобразование dumps. Строки с двойными кавычками → str, true → True, null → None." },
      { type: "code", content: "import json\njson_str = '{\"name\": \"V\", \"score\": 95, \"active\": true}'\ndata = json.loads(json_str)\nprint(data['name'])  # V\nprint(data['active'])  # True" },
      { type: "predict", code: "import json\nd = json.loads('{\"x\": null}')\nprint(d['x'])", question: "Что выведет?", options: ["None", "null", "0", "Ошибка"], answer: 0, explain: "JSON null десериализуется в Python None. d['x'] = None. print(None) → None." },
      { type: "note", content: "json.dumps с indent=N делает красивый вывод с отступами. ensure_ascii=False сохраняет кириллицу вместо \\uXXXX." },
      { type: "heading", content: "Работа с файлами JSON" },
      { type: "text", content: "json.dump(obj, file) пишет в файл. json.load(file) читает из файла. Автоматически кодирует/декодирует UTF-8." },
      { type: "code", content: "import json\ndata = {'name': 'V', 'score': 95}\nwith open('data.json', 'w') as f:\n    json.dump(data, f)\n\nwith open('data.json', 'r') as f:\n    loaded = json.load(f)\nprint(loaded['name'])  # V" },
      { type: "warning", content: "• <b>Типы в JSON</b>: кортеж (tuple) сериализуется как массив (list). set — нельзя сериализовать → TypeError.<br>• <b>Кавычки</b>: JSON требует двойных кавычек. json.loads с одинарными кавычками → JSONDecodeError.<br>• <b>Экранирование</b>: обратный слеш в строке экранируется: json.dumps('a\\nb')." },
      { type: "note", content: "json.loads('...') — для строки. json.load(f) — для файлового объекта. Схожая путаница с load/loads и dump/dumps." },
      { type: "predict", code: "import json\nprint(json.dumps([1, 2, 3]))", question: "Что выведет?", options: ["[1, 2, 3]", '[1, 2, 3]', "(1, 2, 3)", "Ошибка"], answer: 1, explain: "json.dumps([1, 2, 3]) сериализует список в JSON-массив. Результат: [1, 2, 3] с двойными кавычками вокруг строковых элементов." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: data = {'name': 'V', 'score': 95}. Преобразуйте в JSON через dumps и выведите.",
        starter: "import json\ndata = {'name': 'V', 'score': 95}\n# json.dumps(data)\n# print(result)\n",
        hints: ["json_str = json.dumps(data)", "print(json_str) — выводит JSON"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "has-call", name: "json.dumps" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте JSON-строку json_str = '{\"count\": 5}'. Десериализуйте через loads. F-строкой выведите: 'Count: <count>'.",
        starter: "# json_str = '{\"count\": 5}'\n# loads и вывод f-строкой\n",
        hints: ["import json\ndata = json.loads('{\"count\": 5}')", "print(f'Count: {data[\"count\"]}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Count: 5" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: записать data = {'a': 1} в data.json через dump. Затем прочитать через load.",
        starter: "import json\ndata = {'a': 1}\n# with open('data.json', 'w') as f: json.dump(data, f)\n# with open('data.json', 'r') as f: loaded = json.load(f)\n# print(loaded['a'])\n",
        hints: ["json.dump(data, f) пишет в файл", "json.load(f) читает из файла"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "1" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "JSONDecodeError: одинарные кавычки вместо двойных. Исправьте json_str.",
        starter: "import json\njson_str = \"{'key': 'value'}\"\nloaded = json.loads(json_str)\nprint(loaded)",
        hints: ["JSON требует двойных кавычек", "json_str = '{\"key\": \"value\"}' — двойные кавычки"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Создайте dict config = {'host': 'localhost', 'port': 5432}. Сериализуйте через dumps с indent=2. F-строкой выведите: 'Config: <json>'.",
        starter: "# dict config\n# json.dumps с indent=2\n# Вывод f-строкой\n",
        hints: ["import json\nconfig = {'host': 'localhost', 'port': 5432}", "result = json.dumps(config, indent=2)\nprint(f'Config: {result}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "has-call", name: "json.dumps" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "json.dumps(obj) → JSON-строка. json.loads(str) → Python-объект",
      "dict → объект, list → массив. True → true, None → null, tuple → массив",
      "json.dump(obj, file) пишет в файл, json.load(file) читает. dump/loads — для файлов/строк",
      "indent=N для красивого вывода. ensure_ascii=False для кириллицы в JSON",
      "set нельзя сериализовать → TypeError. JSON требует двойных кавычек"
    ],
    quiz: [
      { q: "Что вернёт json.dumps({'a': 1})?", options: ["{'a': 1}", '{"a": 1}', "[1, 'a']", "Ошибка"], answer: 1, explain: "json.dumps сериализует dict в JSON-строку с двойными кавычками и типом true/false вместо Python-типов." },
      { q: "Что вернёт json.loads('null')?", options: ["None", "null", "0", "Ошибка"], answer: 0, explain: "JSON null десериализуется в Python None. JSON true → True, false → False." },
      { q: "Разница: json.dump vs json.dumps?", options: ["dump в файл, dumps в строку", "они одинаковы", "dumps в файл", "dump в строку"], answer: 0, explain: "json.dump пишет в файловый объект. json.dumps возвращает строку. Аналогично: json.load читает из файла, json.loads из строки." },
      { q: "Можно ли json.dumps({1, 2, 3})?", options: ["Да", "Нет — TypeError", "Да, как массив", "Ошибка синтаксиса"], answer: 1, explain: "set не сериализуется в JSON — json.dumps бросает TypeError: Object of type set is not JSON serializable." }
    ]
  },

  // 23 - Regex
  {
    id: 'python-23-regex',
    title: "Регулярные выражения",
    goal: 'Использовать re.match/re.search/re.findall, группы захвата',
    prereq: ['python-22-json'],
    duration: 17,
    theory: [
      { type: "hook", content: "V анализирует логи кибер-атаки. Нужно найти IP-адреса, email, токены. Регулярные выражения — маска поиска в строке." },
      { type: "heading", content: "Основы regex" },
      { type: "text", content: "Регулярное выражение — шаблон для поиска в строке. re — модуль. . — любой символ. * — ноль или больше. + — один или больше. ? — ноль или один." },
      { type: "code", content: "import re\npattern = r'\\d+'  # одна или больше цифр\nresult = re.findall(pattern, 'V9500')\nprint(result)  # ['9500']" },
      { type: "heading", content: "re.search vs re.match" },
      { type: "text", content: "re.match ищет в начале строки. re.search ищет в любом месте. re.match('abc', 'xabc') → None. re.search('abc', 'xabc') → Match." },
      { type: "code", content: "import re\ns = 'Привет, V!'\nm = re.search(r'V', s)\nprint(m.group())  # V\n\npos = re.search(r'V', s)\nprint(pos.start())  # 17 — позиция" },
      { type: "predict", code: "import re\nm = re.match(r'\\d+', 'abc123')\nprint(m)", question: "Что выведет?", options: ["Match", "None", "['123']", "Ошибка"], answer: 1, explain: "re.match ищет в начале строки. 'abc123' начинается с 'abc', а не цифры. match → None." },
      { type: "heading", content: "re.findall: все совпадения" },
      { type: "text", content: "re.findall(pattern, string) возвращает список всех совпадений. Если есть группы — возвращает список кортежей с захваченными группами." },
      { type: "code", content: "import re\nnums = re.findall(r'\\d+', '12 и 34 и 56')\nprint(nums)  # ['12', '34', '56']\n\ndates = re.findall(r'(\\d{2})/(\\d{2})/(\\d{4})', '15/08/2025')\nprint(dates)  # [('15', '08', '2025')]" },
      { type: "note", content: "r'...' — сырая строка. Обратный слеш не экранируется. r'\\d' = шаблон для цифры. Без r: '\\\\d' — двойной экранирование." },
      { type: "predict", code: "import re\nmails = re.findall(r'@\\w+', 'test@mail.ru')\nprint(mails)", question: "Что выведет?", options: ["['@mail']", "['mail.ru']", "['@mail.ru']", "[]"], answer: 2, explain: "r'@\\w+' ищет @ followed by word characters. '@mail' — \\w+ не захватывает точку. Но '\\w+' останавливается на '.'." },
      { type: "heading", content: "Группы захвата" },
      { type: "text", content: "() — группа захвата. Называется по номеру: group(1), group(2). ?P<name> — именованная группа." },
      { type: "code", content: "import re\ns = 'V:9500'\nm = re.search(r'(\\w+):(\\d+)', s)\nprint(m.group(1))  # V\nprint(m.group(2))  # 9500\n\n# Именованная группа\nm2 = re.search(r'(?P<name>\\w+):(?P<score>\\d+)', s)\nprint(m2.group('name'))  # V" },
      { type: "heading", content: "re.sub: замена по шаблону" },
      { type: "text", content: "re.sub(pattern, replacement, string) заменяет все совпадения. Можно использовать backreference: r'\\1' для первой группы." },
      { type: "code", content: "import re\nphone = '+1-555-123-4567'\n# Удалить все, кроме цифр и +\nmasked = re.sub(r'[^\\d+]', '', phone)\nprint(masked)  # +15551234567" },
      { type: "warning", content: "• <b>Экранирование</b>: r'\\d' (сырой строкой). '\\\\d' в обычной строке — тоже работает, но путан.<br>• <b>* и + жадные</b>: 'a+' в 'aaa' захватит все три. Для нежадного: 'a+?'<br>• <br>re.match ищет только с начала строки. Для поиска в любом месте используйте re.search." },
      { type: "note", content: "re.compile(pattern) компилирует шаблон для многократного использования. Быстрее при множественных поисках." },
      { type: "predict", code: "import re\nresult = re.sub(r'\\s+', '-', 'a b  c')\nprint(result)", question: "Что выведет?", options: ["a-b-c", "a -b - c", "abc", "a-b  c"], answer: 0, explain: "re.sub(r'\\s+', '-', 'a b  c') заменяет все пробельные символы на '-'. 'a b  c' → 'a-b-c'. Жадный + захватывает '  ' (два пробела) и заменяет на один '-'." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: найдите все цифры в строке 'V9500' через re.findall(r'\\d+', s). Выведите.",
        starter: "import re\ns = \"V9500\"\n# nums = re.findall(r'\\d+', s)\n# print(nums)\n",
        hints: ["re.findall ищет все совпадения", "print(nums) — выводит ['9500']"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "['9500']" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Найдите email в строке 'Контакт: admin@corp.io'. F-строкой выведите: 'Email: <email>'.",
        starter: "# import re\n# re.search для email\n# Вывод f-строкой\n",
        hints: ["import re\ns = 'Контакт: admin@corp.io'\nm = re.search(r'\\S+@\\S+', s)", "print(f'Email: {m.group()}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", "name": "print" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: извлеките имя и возраст из 'V:28' через re.search с группами. Выведите name.",
        starter: "import re\ns = \"V:28\"\n# m = re.search(r'(\\w+):(\\d+)', s)\n# print(m.group(1))\n",
        hints: ["m.group(1) — первая захваченная группа (имя)", "print(...) — выводит V"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "V" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "re.match не находит 'abc' в начале 'xabc'. Исправьте на re.search.",
        starter: "import re\ns = 'xabc'\nm = re.match(r'abc', s)\nif m:\n    print(m.group())",
        hints: ["re.match ищет с начала строки", "re.search ищет в любом месте строки"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "abc" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Замените все пробелы и лишние символы в строке 'V 95 00' через re.sub на '-'. F-строкой выведите: 'Очищено: <result>'.",
        starter: "# re.sub для замены пробелов\n# Вывод f-строкой\n",
        hints: ["import re\ns = 'V 95 00'\nresult = re.sub(r'\\s+', '-', s)", "print(f'Очищено: {result}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Очищено: V-95-00" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "re.findall(pattern, string) — все совпадения. re.search — первое в любом месте. re.match — только с начала",
      "Группы (): group(1) по номеру, ?P<name> по имени. Используются для извлечения данных",
      "re.sub(pattern, replacement, string) — замена всех совпадений",
      "r'...' — сырая строка. \\d — цифра, \\w — word char, \\s — пробел. Жадные квантипы * и +",
      "re.compile(pattern) для многократного использования. [] — класс символов, ^/для исключения"
    ],
    quiz: [
      { q: "Что вернёт re.search(r'\\d+', 'V9500')?", options: ["['9500']", "Match object", "9500", "None"], answer: 1, explain: "re.search возвращает объект Match, а не список. Для получения строки нужно .group()." },
      { q: "Чем match от search?", options: ["match быстрее", "match ищет с начала строки", "они одинаковы", "search не работает с regex"], answer: 1, explain: "re.match ищет ТОЛЬКО в начале строки. re.search ищет в любом месте. re.match('abc', 'xabc') → None." },
      { q: "Что вернёт r'\\d+'?", options: ["Одна цифра", "Одна или больше цифр", "Строго две цифры", "Ни одной цифры"], answer: 1, explain: "Дио: \\d — одна цифра. + — одна или больше. Поэтому \\d+ соответствует одной или более цифрам." },
      { q: "Для чего re.sub?", options: ["Поиск", "Замена совпадений", "Компиляция", "Группы"], answer: 1, explain: "re.sub(pattern, replacement, string) заменяет все совпадения шаблона на replacement." }
    ]
  },

  // 24 - datetime
  {
    id: 'python-24-datetime',
    title: "Работа с датами",
    goal: 'Использовать datetime для работы с датами, временем, timedelta',
    prereq: ['python-23-regex'],
    duration: 15,
    theory: [
      { type: "hook", content: "V должен знать время последней синхронизации кибер-ядра. Python datetime: datetime.now(), timedelta для интервалов." },
      { type: "heading", content: "datetime: дата и время" },
      { type: "text", content: "datetime — модуль для работы с датами и временем. datetime.now() — текущие дата и время. datetime(year, month, day) — создание." },
      { type: "code", content: "from datetime import datetime\nnow = datetime.now()\nprint(now)\nprint(now.year)\nprint(now.month)\nprint(now.day)" },
      { type: "heading", content: "strftime: форматирование" },
      { type: "text", content: "strftime(format) форматирует datetime в строку. %Y — год, %m — месяц, %d — день, %H:%M:%S — время." },
      { type: "code", content: "from datetime import datetime\nnow = datetime.now()\nprint(now.strftime('%Y-%m-%d'))\nprint(now.strftime('%H:%M:%S'))" },
      { type: "predict", code: "from datetime import datetime\nd = datetime(2025, 1, 15)\nprint(d.strftime('%d.%m.%Y'))", question: "Что выведет?", options: ["15.01.2025", "2025-01-15", "15/01/2025", "Ошибка"], answer: 0, explain: "datetime(2025, 1, 15) — 15 января 2025. strftime('%d.%m.%Y') → '15.01.2025'." },
      { type: "heading", content: "strptime: парсинг строк" },
      { type: "text", content: "datetime.strptime(string, format) парсит строку в datetime. Обратная операция strftime. Требует точного формата." },
      { type: "code", content: "from datetime import datetime\ns = '2025-08-15'\nd = datetime.strptime(s, '%Y-%m-%d')\nprint(d.year)  # 2025\nprint(d.month)  # 8" },
      { type: "note", content: "strptime — string parse TIME. strftime — string format TIME. Буквы меняются местами: strptime читает, strftime пишет." },
      { type: "heading", content: "timedelta: временные интервалы" },
      { type: "text", content: "timedelta(days=, hours=, minutes=, seconds=) — интервал времени. Можно складывать с datetime, вычитать." },
      { type: "code", content: "from datetime import datetime, timedelta\nnow = datetime.now()\ntomorrow = now + timedelta(days=1)\nyesterday = now - timedelta(hours=24)\nprint(tomorrow > now)  # True\nprint(yesterday < now)  # True" },
      { type: "predict", code: "from datetime import datetime, timedelta\nd = datetime(2025, 1, 10)\nd2 = d + timedelta(days=5)\nprint(d2.day)", question: "Что выведет?", options: ["5", "10", "15", "Ошибка"], answer: 2, explain: "10 января + 5 дней = 15 января. d2.day = 15." },
      { type: "heading", content: "date и time: отдельные типы" },
      { type: "text", content: "date — только дата (year, month, day). time — только время (hour, minute, second). datetime — и то, и другое." },
      { type: "code", content: "from datetime import date, time, datetime\nd = date(2025, 8, 15)\nt = time(14, 30, 0)\nprint(d)  # 2025-08-15\nprint(t)  # 14:30:00" },
      { type: "warning", content: "• <b>Неправильный формат strptime</b>: '15.01.2025' с format '%Y-%m-%d' → ValueError. Строка и формат должны совпадать.<br>• <b>Сравнение datetime</b>: можно сравнивать через < >. datetime.now() обновляется при каждом вызове.<br>• <b>Часовой пояс</b>: datetime.now() без tz — naive. Для timezone нужен pytz." },
      { type: "note", content: "datetime.now() возвращает naive datetime (без часового пояса). Для aware: datetime.now(timezone.utc)." },
      { type: "predict", code: "from datetime import datetime\nd1 = datetime(2025, 1, 1)\nd2 = datetime(2025, 1, 1)\nprint(d1 == d2)", question: "Что выведет?", options: ["True", "False", "None", "Ошибка"], answer: 0, "explain": "Две переменных с одинаковой датой. datetime == datetime сравнивает по значениям. d1 == d2 → True." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: from datetime import datetime. Получите now и выведите год через print.",
        starter: "from datetime import datetime\nnow = datetime.now()\n# print(now.year)\n",
        hints: ["now.year — текущий год", "print(now.year) — выводит текущий год"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте datetime(2025, 6, 15). Отформатируйте через strftime('%d.%m.%Y'). F-строкой выведите: 'Дата: <formatted>'.",
        starter: "# from datetime import datetime\n# d = datetime(2025, 6, 15)\n# strftime и вывод f-строкой\n",
        hints: ["d = datetime(2025, 6, 15)", "print(f'Дата: {d.strftime(\"%d.%m.%Y\")}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Дата: 15.06.2025" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: сложите datetime(2025, 1, 10) с timedelta(days=5). Выведите .day.",
        starter: "from datetime import datetime, timedelta\nd = datetime(2025, 1, 10)\n# d2 = d + timedelta(days=5)\n# print(d2.day)\n",
        hints: ["timedelta(days=5) прибавляет 5 дней", "d2.day = 15. print(15)"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "15" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "ValueError: strptime с неправильным форматом. Исправьте формат для строки '15.01.2025'.",
        starter: "from datetime import datetime\ns = '15.01.2025'\nd = datetime.strptime(s, '%Y-%m-%d')\nprint(d)",
        hints: ["Формат для '15.01.2025' — '%d.%m.%Y'", "d, m, Y — в том же порядке что и строка"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Запросите дату рождения через input() в формате 'ГГГГ-ММ-ДД'. Распарсите через strptime. F-строкой выведите: 'Возраст: <diff.days> дней'.",
        starter: "# input() и strptime\n# (datetime.now() - birth).days\n# Вывод f-строкой\n",
        hints: ["from datetime import datetime, timedelta\nnow = datetime.now()\nbirth = datetime.strptime(input(), '%Y-%m-%d')", "diff = now - birth\nprint(f'Возраст: {diff.days} дней')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", "name": "input" }, { kind: "has-call", "name": "strptime" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "datetime.now() — текущие дата/время. datetime(year, month, day) — создание",
      "strftime(format) → строка. strptime(string, format) → datetime. %Y-%m-%d, %H:%M:%S",
      "timedelta(days=, hours=...) — интервал. datetime + timedelta работает",
      "date — только дата, time — только время, datetime — оба",
      "datetime == datetime сравнивает по значениям. < > для сравнения дат"
    ],
    quiz: [
      { q: "Что вернёт: datetime.now().year?", options: ["2024", "2025", "int", "str"], answer: 2, explain: "datetime.now().year возвращает целочисленный год (int). В 2026 году это 2026." },
      { q: "strptime или strftime?", options: ["strptime читает, strftime пишет", "оба читают", "оба пишут", "они одинаковы"], answer: 0, explain: "strptime = string PARSE time (читает строку → datetime). strftime = string FORMAT time (datetime → строка)." },
      { q: "Что вернёт: datetime(2025,1,10) + timedelta(days=5)?", options: ["15 января", "10 января", "5 января", "Ошибка"], answer: 0, explain: "10 января + 5 дней = 15 января. timedelta прибавляет дни к datetime." },
      { q: "Для чего format в strptime?", options: ["Цвет текста", "Паттерн для парсинга", "Размер шрифта", "Кодировка"], answer: 1, explain: "strptime(string, format) требует format, описывающего структуру строки. '%Y-%m-%d' для '2025-01-15'." }
    ]
  },

  // 25 - Collections
  {
    id: 'python-25-collections',
    title: "Модуль collections",
    goal: 'Использовать Counter, defaultdict, deque из модуля collections',
    prereq: ['python-24-datetime'],
    duration: 16,
    theory: [
      { type: "hook", content: "V анализирует 10000 логов. Сколько раз каждый IP встречается? Counter подсчитывает. defaultdict не бросает KeyError для новых ключей." },
      { type: "heading", content: "Counter: счётчик элементов" },
      { type: "text", content: "Counter(iterable) считает количество каждого элемента. Возвращает словарь {элемент: количество}. most_common(n) — топ-N." },
      { type: "code", content: "from collections import Counter\nnums = [1, 2, 2, 3, 3, 3]\nc = Counter(nums)\nprint(c)  # Counter({3: 3, 2: 2, 1: 1})\nprint(c.most_common(2))  # [(3, 3), (2, 2)]" },
      { type: "predict", code: "from collections import Counter\nc = Counter('hello')\nprint(c['l'])", question: "Что выведет?", options: ["1", "2", "0", "None"], answer: 1, explain: "Counter('hello') подсчитывает: h=1, e=1, l=2, o=1. c['l'] = 2." },
      { type: "heading", content: "defaultdict: словарь без KeyError" },
      { type: "text", content: "defaultdict(default_factory) создаёт значения по умолчанию для новых ключей. defaultdict(list) → []. defaultdict(int) → 0." },
      { type: "code", content: "from collections import defaultdict\ngroups = defaultdict(list)\ngroups['admins'].append('V')\ngroups['users'].append('Rex')\nprint(groups['admins'])  # ['V']\nprint(groups['missing'])  # [] — без KeyError" },
      { type: "note", content: "defaultdict(int) удобен для подсчётов: counts[word] += 1 не бросает KeyError для новых слов." },
      { type: "predict", code: "from collections import defaultdict\nd = defaultdict(int)\nd['a'] += 1\nd['a'] += 1\nprint(d['a'])", question: "Что выведет?", options: ["0", "1", "2", "Ошибка"], answer: 2, explain: "defaultdict(int) создаёт 0 для новых ключей. d['a'] += 1 дважды: 0 → 1 → 2. Результат: 2." },
      { type: "heading", content: "deque: двусторонняя очередь" },
      { type: "text", content: "deque — двусторонняя очередь. append/appendleft, pop/popleft. Быстрее list для добавления/удаления в начало." },
      { type: "code", content: "from collections import deque\nq = deque([1, 2, 3])\nq.appendleft(0)\nq.append(4)\nprint(list(q))  # [0, 1, 2, 3, 4]\n\nq.pop()\nq.popleft()\nprint(list(q))  # [1, 2, 3]" },
      { type: "heading", content: "namedtuple: именованный кортеж" },
      { type: "text", content: "namedtuple('Name', ['field1', 'field2']) создаёт класс-кортеж с именованными полями. Доступ по имени и по индексу." },
      { type: "code", content: "from collections import namedtuple\nPoint = namedtuple('Point', ['x', 'y'])\np = Point(100, 200)\nprint(p.x)  # 100\nprint(p[0])  # 100\nprint(p)  # Point(x=100, y=200)" },
      { type: "warning", content: "• <b>Counter vs dict</b>: Counter возвращает 0 для несуществующих ключей. dict бросает KeyError.<br>• <b>deque ограниченный</b>: maxlen=N — очередь с фиксированной длиной. Старые элементы удаляются.<br>• <b>namedtuple неизменяем</b>: как и кортеж, неизменяем после создания." },
      { type: "predict", code: "from collections import Counter\nc = Counter('mississippi')\nprint(c.most_common(1))", question: "Что выведет?", options: ["[('i', 4)]", "[('s', 4)]", "[('p', 2)]", "[]"], answer: 0, explain: "Counter('mississippi'): i=4, s=4, p=2, m=1. most_common(1) возвращает топ-1: [('i', 4)] или [('s', 4)] (оба 4, зависит от порядка)." },
      { type: "note", content: "Counter поддерживает арифметику: c1 + c2 объединяет, c1 - c2 вычитает. Полезно для сравнения распределений." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: создайте Counter из 'hello'. Выведите количество 'l'.",
        starter: "from collections import Counter\nc = Counter('hello')\n# print(c['l'])\n",
        hints: ["c['l'] — количество символов l", "print(c['l']) — выводит 2"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "2" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте defaultdict(list). Добавьте 'V' в группу 'admins' через append. F-строкой выведите: 'Админ: <list>'.",
        starter: "# from collections import defaultdict\ndd = defaultdict(list)\n# Добавьте 'V' в 'admins'\n# Вывод f-строкой\n",
        hints: ["dd['admins'].append('V')", "print(f\"Админ: {dd['admins']}\")"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Админ: ['V']" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: создайте deque из [1,2,3]. appendleft(0), append(4). Выведите через list() и print().",
        starter: "from collections import deque\nq = deque([1, 2, 3])\n# q.appendleft(0)\n# q.append(4)\n# print(list(q))\n",
        hints: ["appendleft(0) добавляет в начало, append(4) — в конец", "print(list(q)) — [0, 1, 2, 3, 4]"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "[0, 1, 2, 3, 4]" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "KeyError: dict['new'] падает. Исправьте через defaultdict(int), чтобы counts['new'] += 1 работало.",
        starter: "counts = {}\ncounts['new'] += 1\nprint(counts['new'])",
        hints: ["defaultdict(int) создаёт 0 для новых ключей", "from collections import defaultdict\ncounts = defaultdict(int)"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "1" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Создайте Counter из слов 'cat dog cat bird cat'. F-строкой выведите: 'Счётчик: <Counter>', затем most_common(2).",
        starter: "# Counter из строки со словами\n# Вывод f-строкой\n# most_common(2)\n",
        hints: ["from collections import Counter\nwords = 'cat dog cat bird cat'.split()\nc = Counter(words)", "print(f'Счётчик: {c}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "has-call", name: "Counter" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "Counter(iterable) считает элементы. most_common(n) — топ-N. Возвращает 0 для новых ключей",
      "defaultdict(factory) создаёт значения по умолчанию. list → [], int → 0. Нет KeyError",
      "deque — двусторонняя очередь. appendleft/append, popleft/pop. Быстрее list для начала списка",
      "namedtuple('Name', ['x', 'y']) — именованный кортеж. Доступ по имени и индексу",
      "Counter поддерживает арифметику: + объединяет, - вычитает. defaultdict удобен для группировки"
    ],
    quiz: [
      { q: "Что вернёт Counter('aab')?", options: ["Counter({'a': 2, 'b': 1})", "Counter({'b': 1, 'a': 2})", "['a', 'a', 'b']", "{'a': 2, 'b': 1}"], answer: 0, explain: "Counter('aab') считает: a=2, b=1. Возвращает Counter({'a': 2, 'b': 1}). Порядок может варьироваться." },
      { q: "Для чего defaultdict(list)?", options: ["Список по умолчанию", "Избегает KeyError для новых ключей, создаёт []", "Сортировка", "Фильтр"], answer: 1, explain: "defaultdict(list) создаёт пустой список [] для новых ключей. dd['new'].append(x) работает без KeyError." },
      { q: "Что быстрее: list.insert(0, x) или deque.appendleft(x)?", options: ["list", "deque", "одинаково", "list быстрее"], answer: 1, "explain": "deque оптимизирован для двусторонних операций. list.insert(0, x) сдвигает все элементы — O(n). deque.appendleft — O(1)." },
      { q: "Что возвращает namedtuple?", options: ["Класс", "Словарь", "Список", "Функция"], answer: 0, explain: "namedtuple возвращает класс, похожий на кортеж. Можно создавать экземпляры: Point = namedtuple('Point', ['x', 'y']); p = Point(1, 2)." }
    ]
  },

  // 26 - pathlib
  {
    id: 'python-26-pathlib',
    title: "Модуль pathlib",
    goal: 'Работать с путями через pathlib.Path',
    prereq: ['python-25-collections'],
    duration: 14,
    theory: [
      { type: "hook", content: "V ищет конфиг в каталоге проекта. Где он? os.path.join ручной. pathlib.Path — объектно-ориентированный путь к файлам." },
      { type: "heading", content: "Path: объект пути" },
      { type: "text", content: "pathlib.Path(path) создаёт объект пути. Автоматически использует правильный разделитель (/ или \\). Работает одинаково на всех ОС." },
      { type: "code", content: "from pathlib import Path\np = Path('data')\nprint(p / 'file.txt')  # data/file.txt (или data\\file.txt на Windows)\nprint(p.exists())  # True/False\nprint(p.is_dir())  # True" },
      { type: "heading", content: "Операции с путями" },
      { type: "text", content: "Оператор / объединяет пути: Path('data') / 'file.txt'. Атрибуты: .name, .stem, .suffix, .parent. Методы: .exists(), .is_file(), .is_dir()." },
      { type: "code", content: "from pathlib import Path\np = Path('data/report.txt')\nprint(p.name)   # report.txt\nprint(p.stem)   # report\nprint(p.suffix)  # .txt\nprint(p.parent)  # data" },
      { type: "predict", code: "from pathlib import Path\np = Path('data/file.txt')\nprint(p.suffix)", question: "Что выведет?", options: [".txt", "file.txt", "file", "Ошибка"], answer: 0, explain: "Path('data/file.txt').suffix возвращает расширение файла: '.txt'." },
      { type: "heading", content: "Чтение и запись файлов" },
      { type: "text", content: "Path.read_text() читает всё в строку. Path.read_text(encoding='utf-8') для кириллицы. Path.write_text('data') пишет. Path.write_text поверхностно перезаписывает." },
      { type: "code", content: "from pathlib import Path\np = Path('test.txt')\np.write_text('Hello, World!')\ncontent = p.read_text()\nprint(content)  # Hello, World!" },
      { type: "predict", code: "from pathlib import Path\np = Path('file.txt')\np.write_text('data')\nresult = p.read_text()\nprint(result)", question: "Что выведет?", options: ["data", "file.txt", "Ошибка", "None"], answer: 0, explain: "write_text('data') записывает 'data' в файл. read_text() читает 'data'. print('data') → data." },
      { type: "heading", content: "Итерация по каталогу: glob и iterdir" },
      { type: "text", content: "Path.glob('*.py') ищет файлы по шаблону. Path.iterdir() — все файлы в каталоге. Рекурсивный glob: rglob('*.py')." },
      { type: "code", content: "from pathlib import Path\np = Path('.')\nfor f in p.glob('*.json'):\n    print(f.name)\n\n# Рекурсивно\nfor f in p.rglob('*.py'):\n    print(f)" },
      { type: "note", content: "glob возвращает итератор. Можно использовать list(p.glob('*.json')) для списка." },
      { type: "warning", content: "• <b>write_text перезаписывает</b>: каждый вызов уничажает файл. Для добавления используйте режим 'a' или open().<br>• <b>Кодировка</b>: read_text без encoding использует locale. Добавляйте encoding='utf-8' для кириллицы.<br>• <b>Пути с ~</b>: Path('~/file') не раскрывает home. Используйте expanduser()." },
      { type: "predict", code: "from pathlib import Path\np = Path('folder/file.txt')\nprint(p.parent / 'other.txt')", question: "Что выведет?", options: ["folder/other.txt", "folder/file.txt", "other.txt", "Ошибка"], answer: 0, explain: "p.parent — это 'folder'. folder / 'other.txt' = 'folder/other.txt'. Оператор / соединяет пути." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: создайте Path('test.txt'), запишите 'hello' через write_text, прочитайте через read_text, выведите.",
        starter: "from pathlib import Path\np = Path('test.txt')\n# p.write_text('hello')\n# content = p.read_text()\n# print(content)\n",
        hints: ["write_text('hello') пишет в файл", "read_text() читает. print(content) → hello"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "hello" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте Path для 'data/report.txt'. F-строкой выведите: 'Файл: <name>, расширение: <suffix>'.",
        starter: "# Path('data/report.txt')\n# Вывод f-строкой с .name и .suffix\n",
        hints: ["from pathlib import Path\np = Path('data/report.txt')", "print(f'Файл: {p.name}, расширение: {p.suffix}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Файл: report.txt, расширение: .txt" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: создайте Path('.') и найдите все .json файлы через glob. Выведите количество.",
        starter: "from pathlib import Path\np = Path('.')\n# files = list(p.glob('*.json'))\n# print(len(files))\n",
        hints: ["list(p.glob('*.json')) — список файлов", "print(len(files)) — количество"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "UnicodeDecodeError: read_text без encoding. Добавьте encoding='utf-8'.",
        starter: "from pathlib import Path\ncontent = Path('file.txt').read_text()\nprint(content)",
        hints: ["read_text(encoding='utf-8') для кириллицы", "encoding='utf-8' устраняет UnicodeDecodeError"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Создайте каталог structure через mkdir и файл config.json внутри через write_text. F-строкой выведите: 'Путь: <path>'.",
        starter: "# Path('structure').mkdir(exist_ok=True)\n# (Path('structure') / 'config.json').write_text('{}')\n# Вывод f-строкой\n",
        hints: ["from pathlib import Path\nd = Path('structure')\nd.mkdir(exist_ok=True)", "f = d / 'config.json'\nf.write_text('{}')\nprint(f'Путь: {str(f)}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "Path('path') — объект пути. / оператор объединяет пути. .name, .stem, .suffix, .parent",
      "read_text()/write_text() читают/пишут файлы. encoding='utf-8' для кириллицы",
      "glob('*.py') — поиск по шаблону. rglob() — рекурсивно. iterdir() — все файлы",
      "exists(), is_file(), is_dir() — проверка свойств пути. expanduser() для ~",
      "pathlib кроссплатформенен: одинаково работает на Windows, Linux, macOS"
    ],
    quiz: [
      { q: "Что делает Path('data') / 'file.txt'?", options: ["Создаёт файл", "Объединяет пути", "Удаляет файл", "Копирует"], answer: 1, explain: "Оператор / объединяет Path и строку в один путь: 'data/file.txt' или 'data\\file.txt'." },
      { q: "Что вернёт Path('file.txt').stem?", options: [".txt", "file", "file.txt", "Ошибка"], answer: 1, explain: "Path('file.txt').stem возвращает имя без расширения: 'file'. .suffix возвращает '.txt'." },
      { q: "Какой метод ищет файлы по шаблону?", options: ["glob", "search", "find", "iterdir"], answer: 0, explain: "Path.glob('*.py') ищет файлы по шаблону. rglob() — рекурсивный поиск. iterdir() — все файлы без шаблона." },
      { q: "read_text или read()?", options: ["Только read_text", "read_text читает в строку, read в байты", "они одинаковы", "read_text медленнее"], answer: 1, explain: "Path.read_text() читает содержимое как строку. Path.read_bytes() читает как байты. Оба удобнее открытого файла." }
    ]
  },

  // 27 - HTTP requests
  {
    id: 'python-27-http',
    title: "HTTP запросы",
    goal: "Отправлять GET/POST запросы через requests, обрабатывать ответы",
    prereq: ['python-26-pathlib'],
    duration: 17,
    theory: [
      { type: "hook", content: "V синхронизирует данные с кибер-сервером. Нужно отправить GET для получения статуса и POST для отправки отчёта. requests — простой HTTP-клиент." },
      { type: "heading", content: "Библиотека requests" },
      { type: "text", content: "requests — популярная библиотека для HTTP. pip install requests. Методы: get, post, put, delete. Простой синтаксис: requests.get(url)." },
      { type: "code", content: "import requests\nresponse = requests.get('https://httpbin.org/json')\nprint(response.status_code)  # 200\nprint(response.text)  # тело ответа" },
      { type: "heading", content: "GET: параметры запроса" },
      { type: "text", content: "GET-параметры передаются через params=dict. URL становится ?key=value. Автоматическая кодировка." },
      { type: "code", content: "import requests\nparams = {'user': 'V', 'limit': 10}\nresp = requests.get('https://httpbin.org/get', params=params)\nprint(resp.url)  # .../get?user=V&limit=10" },
      { type: "predict", code: "import requests\nresp = requests.get('https://httpbin.org/get', params={'q': 'test'})\nprint('q=test' in resp.url)", question: "Что выведет?", options: ["True", "False", "None", "Ошибка"], answer: 0, explain: "params добавляет ?q=test в URL. 'q=test' в resp.url → True." },
      { type: "heading", content: "POST: отправка данных" },
      { type: "text", content: "POST-данные: data=dict для form-encoded. json=dict для JSON. response.text — ответ сервера." },
      { type: "code", content: "import requests\nresp = requests.post('https://httpbin.org/post', json={'name': 'V'})\nprint(resp.status_code)  # 200\nresult = resp.json()  # распарсить JSON ответ\nprint(result['json'])  # {'name': 'V'}" },
      { type: "predict", code: "import requests\nresp = requests.post('https://httpbin.org/post', data={'x': 1})\nprint(resp.status_code)", question: "Что выведет?", options: ["200", "404", "None", "Ошибка"], answer: 0, explain: "POST на httpbin.org/post → ответ 200. resp.status_code = 200." },
      { type: "note", content: "resp.json() парсит JSON в Python dict. resp.text — сыня строка. resp.status_code — HTTP статус." },
      { type: "heading", content: "Обработка ответа" },
      { type: "text", content: "resp.status_code: 200 OK, 404 Not Found, 500 Server Error. resp.json(): dict из JSON. resp.headers: словарь заголовков." },
      { type: "code", content: "import requests\nresp = requests.get('https://httpbin.org/status/404')\nif resp.status_code == 200:\n    print('OK')\nelse:\n    print(f'Ошибка: {resp.status_code}')  # Ошибка: 404" },
      { type: "warning", content: "• <b>ConnectionError</b>: сервер недоступен. Оборачивайте в try/except requests.exceptions.RequestException.<br>• <b>Таймаут</b>: requests.get(url, timeout=5) — 5 секунд. Без таймаута может зависнуть.<br>• <b>JSON в POST</b>: data= для form, json= для JSON. Не путайте." },
      { type: "predict", code: "import requests\nresp = requests.get('https://httpbin.org/status/500')\nprint(resp.status_code == 500)", question: "Что выведет?", options: ["True", "False", "None", "Ошибка"], answer: 0, explain: "httpbin.org/status/500 возвращает статус 500. resp.status_code == 500 → True." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: GET-запрос на 'https://httpbin.org/json'. Проверьте статус через print(resp.status_code).",
        starter: "import requests\nresp = requests.get('https://httpbin.org/json')\n# print(resp.status_code)\n",
        hints: ["resp.status_code — HTTP статус ответа", "200 означает успех"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "has-call", name: "requests.get" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Отправьте GET с params {'q': 'agents'} на 'https://httpbin.org/get'. F-строкой выведите: 'URL: <resp.url>'.",
        starter: "# requests.get с params\n# Ф-строка с resp.url\n",
        hints: ["resp = requests.get('https://httpbin.org/get', params={'q': 'agents'})", "print(f'URL: {resp.url}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "has-call", name: "requests.get" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: POST на 'https://httpbin.org/post' с json={'name': 'V'}. Вызовите resp.json() и выведите name.",
        starter: "import requests\nresp = requests.post('https://httpbin.org/post', json={'name': 'V'})\n# data = resp.json()\n# print(data['json']['name'])\n",
        hints: ["resp.json() парсит ответ в dict", "data['json']['name'] — доступ к вложенному полю"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "has-call", name: "requests.post" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "ConnectionError при недоступном сервере. Добавьте try/except RequestException.",
        starter: "import requests\nresp = requests.get('https://nonexistent.invalid')\nprint(resp.status_code)",
        hints: ["from requests.exceptions import RequestException", "try/except RequestException — перехват сетевых ошибок"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "has-call", name: "try" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "GET-запрос с timeout=5 на 'https://httpbin.org/get'. Проверьте статус == 200 и выведите f-строкой: 'Статус: <code>'.",
        starter: "# requests.get с timeout=5\n# Проверка status_code == 200\n# Выбор f-строкой\n",
        hints: ["resp = requests.get('https://httpbin.org/get', timeout=5)", "if resp.status_code == 200: print(f'Статус: {resp.status_code}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "has-call", name: "requests.get" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "requests.get(url, params=dict) — GET с параметрами. requests.post(url, json=dict/data=dict) — POST",
      "resp.status_code: 200=OK, 404=Not Found, 500=Server Error. resp.text — строка ответа",
      "resp.json() парсит JSON в dict. resp.headers — словарь заголовков",
      "timeout=N — не более N секунд. try/except RequestException для сетевых ошибок",
      "params= для GET-параметров, json= для JSON-тела, data= для form-encoded"
    ],
    quiz: [
      { q: "Что делает requests.get?", options: ["POST-запрос", "GET-запрос", "DELETE-запрос", "PUT-запрос"], answer: 1, explain: "requests.get(url) отправляет HTTP GET-запрос. GET используется для получения данных с сервера." },
      { q: "Как передать параметры в GET?", options: ["data=", "params=", "json=", "headers="], answer: 1, explain: "params=dict добавляет параметры в URL как ?key=value. data= для POST-формы, json= для JSON-тела." },
      { q: "Что возвращает resp.json()?", options: ["Строку", "dict или list", "int", "None"], answer: 1, explain: "resp.json() парсит JSON-ответ сервера в Python объект: dict или list. Это удобнее, чем парсить resp.text вручную." },
      { q: "Для чего timeout?", options: ["Скорость запроса", "Ограничение времени ожидания", "Размер ответа", "Кодировка"], answer: 1, "explain": "timeout=N ограничивает время ожидания ответа N секунд. Без него запрос может зависнуть бесконечно." }
    ]
  },

  // 28 - SQLite
  {
    id: 'python-28-sqlite',
    title: "SQLite и SQL",
    goal: 'Выполнять SQL-запросы через sqlite3, CRUD-операции',
    prereq: ['python-27-http'],
    duration: 18,
    theory: [
      { type: "hook", content: "V хранит данные об агентах в SQLite — локальная база данных в одном файле. CREATE TABLE, INSERT, SELECT — стандартный SQL." },
      { type: "heading", content: "Модуль sqlite3" },
      { type: "text", content: "sqlite3 — встроенный модуль для работы с SQLite. connect(path) открывает БД. Для новой БД создаёт файл. cursor.execute(sql) выполняет запросы." },
      { type: "code", content: "import sqlite3\nconn = sqlite3.connect(':memory:')  # in-memory БД\ncursor = conn.cursor()\ncursor.execute('CREATE TABLE agents (name TEXT, level INTEGER)')\nconn.commit()\nconn.close()" },
      { type: "heading", content: "CREATE TABLE и INSERT" },
      { type: "text", content: "CREATE TABLE имя (колонка тип, ...). INSERT INTO имя VALUES (...). commit() сохраняет изменения. Параметризованные запросы: execute('INSERT INTO t VALUES (?, ?)', (val1, val2))." },
      { type: "code", content: "import sqlite3\nconn = sqlite3.connect('agents.db')\ncur = conn.cursor()\ncur.execute('CREATE TABLE IF NOT EXISTS agents (name TEXT, score INTEGER)')\ncur.execute('INSERT INTO agents VALUES (?, ?)', ('V', 9500))\nconn.commit()\nconn.close()" },
      { type: "predict", code: "import sqlite3\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\ncur.execute('CREATE TABLE t (x INTEGER)')\ncur.execute('INSERT INTO t VALUES (?)', (42,))\nconn.commit()\ncur.execute('SELECT * FROM t')\nprint(cur.fetchone())", question: "Что выведет?", options: ["(42,)", "[42]", "42", "Ошибка"], answer: 0, explain: "INSERT добавляет (42,). fetchone() возвращает первую строку кортежом: (42,)." },
      { type: "heading", content: "SELECT: чтение данных" },
      { type: "text", content: "SELECT * FROM table — все строки. SELECT col FROM table — колонки. fetchone() одна строка, fetchall() все. WHERE — фильтр. ORDER BY — сортировка." },
      { type: "code", content: "import sqlite3\nconn = sqlite3.connect('agents.db')\ncur = conn.cursor()\ncur.execute('SELECT name, score FROM agents WHERE score > 5000')\nrows = cur.fetchall()\nfor row in rows:\n    print(row[0], row[1])\nconn.close()" },
      { type: "note", content: "fetchall() загружает все строки в память. Для больших таблиц используйте итерацию по cursor: for row in cur.execute('SELECT...')." },
      { type: "predict", code: "import sqlite3\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\ncur.execute('CREATE TABLE t (x INTEGER)')\ncur.executemany('INSERT INTO t VALUES (?)', [(1,), (2,), (3,)])\nconn.commit()\ncur.execute('SELECT COUNT(*) FROM t')\nprint(cur.fetchone()[0])", question: "Что выведет?", options: ["1", "3", "[1, 2, 3]", "Ошибка"], answer: 1, explain: "executemany вставляет 3 строки. SELECT COUNT(*) подсчитывает строки: 3. fetchone()[0] = 3." },
      { type: "heading", content: "Параметризованные запросы" },
      { type: "text", content: "NEVER используйте f-string или + для SQL! Используйте ? placeholders. Это безопасно от SQL-инъекций. execute('SELECT FROM t WHERE id=?', (user_id,))." },
      { type: "code", content: "import sqlite3\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\ncur.execute('CREATE TABLE t (name TEXT, score INTEGER)')\nname = 'V'\nscore = 95\ncur.execute('INSERT INTO t VALUES (?, ?)', (name, score))\nconn.commit()\ncur.execute('SELECT * FROM t WHERE name = ?', (name,))\nprint(cur.fetchone())" },
      { type: "warning", content: "• <b>SQL-инъекции</b>: <code>f\"SELECT * FROM t WHERE id={user_input}\"</code> — опасно! Используйте <code>?</code> placeholders.<br>• <b>Не commit</b>: без commit изменения не сохраняются.<br>• <b>Закрытие соединения</b>: используйте with conn: для автоматического commit." },
      { type: "predict", code: "import sqlite3\nwith sqlite3.connect(':memory:') as conn:\n    cur = conn.cursor()\n    cur.execute('CREATE TABLE t (x INTEGER)')", question: "Что делает этот код?", options: ["Создаёт таблицу", "Ошибка", "Ничего", "Удаляет БД"], answer: 0, explain: "with sqlite3.connect(...) — контекстный менеджер. Автоматически commit и закрытие. CREATE TABLE создаёт таблицу t с колонкой x." },
      { type: "note", content: "sqlite3 поддерживает row_factory для доступа по имени колонки: conn.row_factory = sqlite3.Row. Тогда row['name'] вместо row[0]." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: создайте in-memory БД с таблицей agents (name, score). Вставьте ('V', 95) через INSERT.",
        starter: "import sqlite3\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\n# cur.execute('CREATE TABLE agents (name TEXT, score INTEGER)')\n# cur.execute('INSERT INTO agents VALUES (?, ?)', ('V', 95))\n# conn.commit()\n# print('OK')\n",
        hints: ["execute CREATE TABLE с типами TEXT и INTEGER", "Параметризованный INSERT с ?"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "has-call", name: "sqlite3.connect" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте БД с таблицей users (id, name). Добавьте ('V', 'Admin') через executemany с кортежом. SELECT всех, выведите f-строкой: 'Пользователь: <row>'.",
        starter: "# sqlite3.connect\n# CREATE TABLE users\n# INSERT через executemany\n# SELECT и вывод f-строкой\n",
        hints: ["cur.executemany('INSERT INTO users VALUES (?, ?)', [(1, 'V')])", "for row in cur.execute('SELECT * FROM users'): print(f'Пользователь: {row[1]}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: создайте таблицу scores. Вставьте ('V', 95), ('Rex', 88). SELECT с WHERE score > 90.",
        starter: "import sqlite3\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\ncur.execute('CREATE TABLE scores (name TEXT, score INTEGER)')\ncur.execute('INSERT INTO scores VALUES (?, ?)', ('V', 95))\ncur.execute('INSERT INTO scores VALUES (?, ?)', ('Rex', 88))\nconn.commit()\n# cur.execute('SELECT * FROM scores WHERE score > ?', (90,))\n# print(cur.fetchall())\n",
        hints: ["WHERE score > ? — фильтр по параметру", "fetchall() — все подходящие строки"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "has-call", name: "fetchall" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "SQL-инъекция: f-string в SQL. Исправьте на параметризованный запрос с ?.",
        starter: "import sqlite3\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\ncur.execute('CREATE TABLE t (name TEXT)')\n\nuser_input = 'V'\ncur.execute(f\"SELECT * FROM t WHERE name='{user_input}'\")\nprint(cur.fetchall())",
        hints: ["REPLACE f-string SQL с ? placeholder", "execute('SELECT * FROM t WHERE name=?', (user_input,))"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "has-call", name: "cur.execute" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Создайте БД с таблицей items (id, name, price). INSERT (1, 'Drone', 5000) и (2, 'Bot', 3000). SELECT с ORDER BY price DESC. F-строкой выведите: 'Товар: <name>'.",
        starter: "# Таблица items с price\n# INSERT через executemany\n# SELECT ORDER BY price DESC\n# Вывод f-строкой\n",
        hints: ["cur.execute('CREATE TABLE items (id INTEGER, name TEXT, price INTEGER)')", "cur.execute('SELECT * FROM items ORDER BY price DESC')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Товар: Drone" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "sqlite3.connect(path) — in-memory ':memory:' или файл 'db.sqlite'. cursor.execute(sql, params) выполняет запросы",
      "CREATE TABLE, INSERT, SELECT, WHERE, ORDER BY — стандартный SQL. commit() сохраняет изменения",
      "Параметризованные запросы с ? — защита от SQL-инъекций. NEVER f-string в SQL",
      "fetchall() все строки, fetchone() одна строка, executemany() для множественной вставки",
      "with sqlite3.connect(...) — автоматический commit и закрытие. row_factory для доступа по имени"
    ],
    quiz: [
      { q: "Что такое sqlite3?", options: ["Библиотека для CSV", "Встроенный модуль для SQLite БД", "Модуль для JSON", "Библиотека для запросов"], answer: 1, explain: "sqlite3 — встроенный модуль Python для работы с базами данных SQLite. Не требует установки сервера." },
      { q: "Для чего ? в SQL?", options: ["Логический И", "Placeholder для параметров", "Комментарий", "LIKE-оператор"], answer: 1, explain: "? — placeholder для параметризованных запросов. execute('SELECT * WHERE id=?', (user_id,)) предотвращает SQL-инъекции." },
      { q: "Что делает commit()?", options: ["Откатывает изменения", "Сохраняет изменения в БД", "Закрывает соединение", "Создаёт таблицу"], answer: 1, explain: "commit() сохраняет изменения (INSERT, UPDATE, DELETE) в базе данных. Без commit изменения не сохранятся." },
      { q: "Что возвращает fetchall()?", options: ["Одну строку", "Список строк (список кортежей)", "dict", "int"], answer: 1, explain: "fetchall() возвращает список кортежей — все строки результата запроса. Если пусто, возвращает пустой список []." }
    ]
  },

  // 29 - Threading
  {
    id: 'python-29-threading',
    title: "Потоки и многозадачность",
    goal: 'Создавать потоки через threading, использовать Lock для синхронизации',
    prereq: ['python-28-sqlite'],
    duration: 17,
    theory: [
      { type: "hook", content: "V запускает 3 дрона одновременно. Каждый — поток. GIL ограничивает CPU-bound, но I/O-bound (сеть, файлы) ускоряется." },
      { type: "heading", content: "Что такое потоки" },
      { type: "text", content: "Поток (Thread) — легковесная задача внутри процесса. Множество потоков делят время процессора. threading — модуль для потоков." },
      { type: "code", content: "import threading\nimport time\n\ndef task(name):\n    print(f'Запуск {name}')\n    time.sleep(1)\n    print(f'Завершение {name}')\n\nt1 = threading.Thread(target=task, args=('Дрон-1',))\nt1.start()\nt1.join()  # дождаться завершения" },
      { type: "heading", content: "start и join" },
      { type: "text", content: "start() запускает поток. join() дожидается его завершения. Без join основной поток может закончиться раньше." },
      { type: "code", content: "import threading\nimport time\n\ndef work():\n    time.sleep(0.5)\n    print('Готово')\n\nt = threading.Thread(target=work)\nt.start()\nt.join()  # основной поток ждёт\nprint('Все потоки завершены')" },
      { type: "predict", code: "import threading, time\ndef f():\n    print('B')\n\nt = threading.Thread(target=f)\nt.start()\nprint('A')\nt.join()", question: "Что может вывести?", options: ["A\\nB", "B\\n", "A\\nB или B\\nA", "Ошибка"], answer: 2, explain: "start() запускает поток асинхронно. print('A') в основном потоке может выполниться раньше или позже. Порядок непредсказуем: A\\nB или B\\nA." },
      { type: "heading", content: "GIL: Global Interpreter Lock" },
      { type: "text", content: "GIL — мьютекс, позволяющий только одному потоку выполнять Python-код. CPU-bound не ускоряется. I/O-bound (sleep, network) ускоряется — GIL освобождается." },
      { type: "code", content: "# I/O-bound: быстрее с потоками\nimport threading, requests\ndef fetch(url):\n    r = requests.get(url)\n    return r.status_code\n\n# 3 запроса параллельно — быстрее чем последовательно\nthreads = [threading.Thread(target=fetch, args=(url,)) for url in urls]" },
      { type: "note", content: "Для CPU-bound используйте multiprocessing (отдельные процессы, обходят GIL). Для I/O-bound — threading." },
      { type: "heading", content: "Lock: синхронизация доступа" },
      { type: "text", content: "Lock — мьютекс для синхронизации потоков. acquire() захватывает, release() освобождает. Или with lock: для автоматического release." },
      { type: "code", content: "import threading\n\nlock = threading.Lock()\ncounter = 0\n\ndef increment():\n    global counter\n    with lock:\n        counter += 1\n\nthreads = [threading.Thread(target=increment) for _ in range(100)]\nfor t in threads:\n    t.start()\nfor t in threads:\n    t.join()\nprint(counter)  # 100 — без гонки" },
      { type: "predict", code: "import threading\nlock = threading.Lock()\nwith lock:\n    print('A')\n    with lock:\n        print('B')", question: "Что выведет?", options: ["A\\nB", "A", "Ошибка", "Deadlock"], answer: 3, explain: "Lock нерекурсивный. Второй with lock внутри первого — deadlock! Поток блокируется сам." },
      { type: "heading", content: "RLock и Condition" },
      { type: "text", content: "RLock (reentrant lock) позволяет захватить мьютекс несколько раз из одного потока. Condition — для сигналов между потоками (wait/notify)." },
      { type: "code", content: "import threading\n\nrlock = threading.RLock()\nwith rlock:\n    with rlock:\n        print('OK — RLock позволяет повторный захват')  # работает\n\ncondition = threading.Condition()\n# condition.wait() — ждать сигнала\n# condition.notify() — послать сигнал" },
      { type: "warning", content: "• <b>Race condition</b>: несколько потоков меняют переменную → потеря обновлений. Используйте Lock.<br>• <b>Deadlock</b>: взаимная блокировка потоков. Не захватывайте Lock дважды.<br>• <b>Глобальные переменные</b>: global counter нужен для изменения в потоке." },
      { type: "note", content: "threading.Thread(target=func, args=(arg1, arg2)). daemon=True — поток завершается с основным потоком. Без daemon поток держит процесс живым." },
      { type: "predict", code: "import threading\ndef worker():\n    print('work')\n\nt1 = threading.Thread(target=worker)\nt2 = threading.Thread(target=worker)\nt1.start()\nt2.start()\nt1.join()\nt2.join()\nprint('done')", question: "Что гарантировано выводит?", options: ["work, work, done", "done, work, work", "work, done", "Порядок не определён"], answer: 0, explain: "Два потока запускаются и вызывают worker(). print('done') выполняется после join() обоих потоков. В итоге: 'work' дважды, затем 'done'." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: создайте поток на функцию say_hi, которая печатает 'Привет'. Запустите и дождитесь через join.",
        starter: "import threading\n\ndef say_hi():\n    print('Привет')\n\n# t = threading.Thread(target=say_hi)\n# t.start()\n# t.join()\n",
        hints: ["threading.Thread(target=say_hi) — создание потока", "start() запускает, join() ждёт"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "has-call", name: "threading.Thread" }, { kind: "stdin", input: "", output: "Привет" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте функцию worker(n), которая печатает 'Задача n'. Запустите 3 потока (1, 2, 3) и дождитесь. Выведите f-строкой: 'Все завершены'.",
        starter: "# def worker(n)\n# 3 потока через цикл\n# join всех\n# Вывод f-строкой\n",
        hints: ["def worker(n):\n    print(f'Задача {n}')", "threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "has-call", name: "threading.Thread" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: Lock для синхронизации. counter += 1 в блоке with lock. Запустите 1 поток.",
        starter: "import threading\n\nlock = threading.Lock()\ncounter = 0\n\ndef add():\n    global counter\n    with lock:\n        counter += 1\n\n# t = threading.Thread(target=add)\n# t.start()\n# t.join()\n# print(counter)\n",
        hints: ["with lock: — захват и освобождение автоматические", "print(counter) — выводит 1"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "1" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "Race condition без Lock: counter += 1 в 10 потоках может дать != 10. Добавьте lock.",
        starter: "import threading\n\ncounter = 0\n\ndef add():\n    global counter\n    counter += 1\n\nthreads = [threading.Thread(target=add) for _ in range(10)]\nfor t in threads:\n    t.start()\nfor t in threads:\n    t.join()\nprint(counter)",
        hints: ["lock = threading.Lock()", "with lock: counter += 1"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "10" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Создайте 3 потока: каждый печатает 'Поток N'. Используйте list comprehension для создания потоков. F-строкой выведите: 'Создано: <len> потоков'.",
        starter: "# 3 потока с list comprehension\n# print(f'Создано: {len(threads)} потоков')\n",
        hints: ["threads = [threading.Thread(target=worker, args=(i,)) for i in range(3)]", "for t in threads: t.start(); for t in threads: t.join()"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Создано: 3 потоков" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "Thread(target=func, args=(...)) создаёт поток. start() запускает, join() ждёт завершения",
      "GIL ограничивает CPU-bound. Для I/O-bound (сеть, файлы) потоки ускоряют выполнение",
      "Lock синхронизирует доступ к разделяемым данным. with lock: — автоматический acquire/release",
      "Race condition: потеря обновлений без синхронизации. RLock для рекурсивного захвата",
      "daemon=True поток завершается с основным. Порядок вывода потоков непредсказуем"
    ],
    quiz: [
      { q: "Что делает join()?", options: ["Запускает поток", "Ждёт завершения потока", "Останавливает поток", "Создаёт поток"], answer: 1, explain: "join() приостанавливает основной поток, пока не завершится целевой поток. Без join основной поток может закончиться раньше." },
      { q: "Что такое GIL?", options: ["Библиотека", "Global Interpreter Lock — один поток Python", "Модуль threading", "Функция sleep"], answer: 1, explain: "GIL (Global Interpreter Lock) — мьютекс, позволяющий только одному потоку выполнять Python-код. CPU-bound не ускоряется, I/O-bound — да." },
      { q: "Зачем Lock?", options: ["Защита от race condition", "Быстрее выполнение", "Создание потока", "Закрытие файла"], answer: 0, explain: "Lock (мьютекс) синхронизирует доступ к разделяемым данным. Предотвращает race condition при одновременном изменении переменных." },
      { q: "Что такое race condition?", options: ["Состояние гонки потоков", "Потеря данных при одновременном доступе", "Оба варианта", "Ошибка"], answer: 2, explain: "Race condition — когда несколько потоков одновременно читают/пишут переменную. Результат зависит от порядка выполнения. Lock предотвращает это." }
    ]
  },

  // 30 - Final project
  {
    id: 'python-30-project',
    title: "Итоговый проект",
    goal: 'Собрать навыки в мини-проекте агентский трекер',
    prereq: ['python-29-threading'],
    duration: 20,
    theory: [
      { type: "hook", content: "V объединяет все навыки: классы агентов, файлы для сохранения, JSON для передачи данных, SQLite для хранилища, потоки для параллельности. Это финальный проект." },
      { type: "heading", content: "Архитектура проекта: агентский трекер" },
      { type: "text", content: "Создайте систему учёта кибернетических агентов. Класс Agent (name, level, status). Храните в SQLite. Экспортируйте в JSON. Параллельная обработка." },
      { type: "code", content: "import json\nfrom datetime import datetime\n\nagents = [{\"name\": \"V\", \"level\": 5}, {\"name\": \"Rex\", \"level\": 3}]\nresult = json.dumps(agents, indent=2)\nprint(result)" },
      { type: "heading", content: "Модульность: разделение ответственности" },
      { type: "text", content: "Разделите код на модули: agent.py (класс), storage.py (БД), api.py (requests), main.py (точка входа). Каждый модуль — своя ответственность." },
      { type: "code", content: "# agent.py\nclass Agent:\n    def __init__(self, name, level):\n        self.name = name\n        self.level = level\n    def __str__(self):\n        return f\"{self.name} (уровень {self.level})\"" },
      { type: "predict", code: "class Agent:\n    def __init__(self, name, level):\n        self.name = name\n        self.level = level\n    def __str__(self):\n        return f\"{self.name} (уровень {self.level})\"\n\na = Agent(\"V\", 5)\nprint(a)", question: "Что выведет?", options: ["V (уровень 5)", "Agent(V, 5)", "V", "Ошибка"], answer: 0, explain: "Agent('V', 5) создаёт объект с name='V', level=5. __str__ возвращает 'V (уровень 5)'. print(a) использует __str__." },
      { type: "heading", content: "Работа с файлами и БД" },
      { type: "text", content: "Храните агентов в SQLite: CREATE TABLE, INSERT. Экспорт в JSON через json.dump. Импорт через json.load. with для файлов и БД." },
      { type: "code", content: "import json, sqlite3\n\n# Экспорт в JSON\nagents = [{\"name\": \"V\", \"level\": 5}]\nwith open('agents.json', 'w') as f:\n    json.dump(agents, f, indent=2)\n\n# Импорт из БД\nsql = sqlite3.connect('agents.db')\ncur = sql.cursor()\ncur.execute('SELECT name, level FROM agents')\nfor row in cur.fetchall():\n    print(row)" },
      { type: "predict", code: "import json\ndata = [{'name': 'V', 'level': 5}]\nwith open('out.json', 'w') as f:\n    json.dump(data, f)\nwith open('out.json', 'r') as f:\n    result = json.load(f)\nprint(result[0]['name'])", question: "Что выведет?", options: ["V", "5", "[{'name': 'V', 'level': 5}]", "Ошибка"], answer: 0, explain: "json.dump пишет список в файл. json.load читает обратно. result[0]['name'] = 'V'." },
      { type: "heading", content: "Обработка ошибок и валидация" },
      { type: "text", content: "try/except для сетевых и файловых операций. ValueError для неверного ввода. RuntimeError для ошибок логики. Логируйте ошибки." },
      { type: "code", content: "import json\n\ntry:\n    with open('config.json', 'r') as f:\n        config = json.load(f)\nexcept FileNotFoundError:\n    config = {'default': True}\nexcept json.JSONDecodeError:\n    print('Ошибка формата JSON')\n    config = {}" },
      { type: "warning", content: "• <b>Ресурсы не закрыты</b>: всегда используйте with для файлов и БД.<br>• <b>SQL-инъекции</b>: параметры через ?.<br>• <b>Сетевые ошибки</b>: добавляйте timeout и try/except." },
      { type: "note", content: "Для больших проектов: используйте virtualenv, requirements.txt, README с инструкциями. Чистая архитектура: бизнес-логика отделена от I/O." },
      { type: "predict", code: "import json, os\npath = 'missing.json'\nif os.path.exists(path):\n    with open(path) as f:\n        data = json.load(f)\nelse:\n    data = 'default'\nprint(data)", question: "Что выведет?", options: ["default", "Ошибка", "None", "missing.json"], answer: 0, explain: "os.path.exists('missing.json') → False. Переход в else: data = 'default'. print('default') → default." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: создайте класс Agent с __init__(name, level) и __str__. Создайте объект и выведите через print.",
        starter: "class Agent:\n    def __init__(self, name, level):\n        self.name = name\n        self.level = level\n    def __str__(self):\n        return f\"{self.name} (уровень {self.level})\"\n\n# a = Agent(\"V\", 5)\n# print(a)\n",
        hints: ["__str__ возвращает f-строку с атрибутами", "print(a) использует __str__"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "V (уровень 5)" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте список agents с 3 объектами Agent. Экспортируйте в JSON через dumps с indent=2. F-строкой выведите: 'Экспорт: <len> агентов'.",
        starter: "# class Agent\n# list из 3 объектов\n# json.dumps с indent=2\n# Вывод f-строкой с len()\n",
        hints: ["agents = [Agent('V', 5), Agent('Rex', 3), Agent('Ghost', 4)]", "data = [{'name': a.name, 'level': a.level} for a in agents]\nprint(f'Экспорт: {len(data)} агентов')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Экспорт: 3 агентов" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: создайте таблицу agents в SQLite (in-memory). Вставьте ('V', 5) через INSERT. Выведите 'Готово'.",
        starter: "import sqlite3\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\n# cur.execute('CREATE TABLE agents (name TEXT, level INTEGER)')\n# cur.execute('INSERT INTO agents VALUES (?, ?)', ('V', 5))\n# conn.commit()\n# print('Готово')\n",
        hints: ["CREATE TABLE с TEXT и INTEGER типами", "INSERT с ? placeholder и кортежем параметров"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "Готово" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "Ошибка: json.load вместо json.loads для строки. Исправьте, чтобы распарсить JSON-строку.",
        starter: "import json\njson_str = '{\"name\": \"V\"}'\nloaded = json.load(json_str)\nprint(loaded['name'])",
        hints: ["json.load работает с файлом, json.loads с строкой", "loaded = json.loads(json_str)"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "V" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Полный цикл: создайте Agent list из 2 объектов. Сохраните в SQLite (CREATE+INSERT). Прочитайте через SELECT. F-строкой выведите: 'Найдено: <count>'.",
        starter: "# class Agent (name, level)\n# SQLite: CREATE TABLE, INSERT, SELECT\n# F-строка с len() результата\n",
        hints: ["cur.execute('CREATE TABLE agents (name TEXT, level INTEGER)')", "cur.execute('INSERT INTO agents VALUES (?, ?)', (a.name, a.level))", "cur.execute('SELECT COUNT(*) FROM agents')\nprint(f'Найдено: {cur.fetchone()[0]}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Найдено: 2" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "Проект объединяет: классы, файлы, JSON, SQLite, обработка ошибок",
      "Модульность: разделите код на модули по ответственности — agent.py, storage.py, api.py",
      "with для файлов и БД — гарантированный cleanup. try/except для сетевых и файловых ошибок",
      "Параметризованные запросы SQLite с ? — защита от SQL-инъекций",
      "json.dump/load для файлов, json.dumps/loads для строк. Одна буква s = string"
    ],
    quiz: [
      { q: "Что объединяет финальный проект?", options: ["Классы, файлы, JSON, SQLite, обработка ошибок", "Только классы", "Только SQLite", "Только файлы"], answer: 0, explain: "Финальный проект использует: классы для моделей, файлы/JSON для хранения, SQLite как БД, try/except для надёжности." },
      { q: "Чем json.load от json.loads?", options: ["load из строки, loads из файла", "load из файла, loads из строки", "они одинаковы", "load быстрее"], answer: 1, explain: "json.load(file) читает из файлового объекта. json.loads(string) парсит JSON-строку. d-вторая буква 's' = string." },
      { q: "Зачем ? в SQLite?", options: ["Placeholder для параметров", "Логический И", "Оператор LIKE", "Проверка None"], answer: 0, explain: "? — placeholder для параметризованных запросов в sqlite3. Предотвращает SQL-инъекции." },
      { q: "for ответственности в коде?", options: ["Модульность", "Рекомендуется", "Важна для поддержки", "Все варианты верны"], answer: 3, explain: "Разделение ответственности (modularity) — разделить код на модули. Это и модульность, и поддержка, и рекомендуется. Все варианты верны." }
    ]
  }
];

for (const lesson of lessons) {
    gen(lesson);
}
console.log('\nGenerated ' + lessons.length + ' lessons');
