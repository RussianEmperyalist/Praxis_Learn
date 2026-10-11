#!/usr/bin/env node
const fs = require('fs');

function gen(cfg) {
    const filename = cfg.id.replace(/^python-/, '') + '.json';
    const fullPath = `content/python/${filename}`;
    fs.writeFileSync(fullPath, JSON.stringify(cfg, null, 2), 'utf8');
    console.log('OK: ' + fullPath);
}

function T() { return []; }  // helper

const lessons = [
  // 18 - Lambda
  {
    id: 'python-18-lambda',
    title: "Лямбда-функции",
    goal: 'Создавать анонимные функции через lambda, использовать map/filter/sorted key',
    prereq: ['python-17-oop-inheritance'],
    duration: 14,
    theory: [
      { type: "hook", content: "V нужен быстрый вычислитель для сортировки агентов по уровню. def избыточен — lambda, однострочная функция." },
      { type: "heading", content: "Что такое lambda" },
      { type: "text", content: "Lambda — анонимная функция в одну строку. Без имени, присваивается переменной или передаётся в функцию." },
      { type: "code", content: "square = lambda x: x ** 2\nprint(square(5))  # 25\n\nadd = lambda a, b: a + b\nprint(add(3, 7))  # 10" },
      { type: "heading", content: "map: применить к каждому элементу" },
      { type: "text", content: "map(func, iterable) применяет функцию к каждому элементу. Возвращает итератор (map object). list() для списка." },
      { type: "code", content: "nums = [1, 2, 3, 4]\ndoubled = list(map(lambda x: x * 2, nums))\nprint(doubled)  # [2, 4, 6, 8]" },
      { type: "predict", code: "result = list(map(lambda x: x + 1, [1, 2, 3]))\nprint(result)", question: "Что выведет?", options: ["[1, 2, 3]", "[2, 3, 4]", "[2, 3, 5]", "Ошибка"], answer: 1, explain: "map применяет x+1 к каждому: 2, 3, 4. Результат: [2, 3, 4]." },
      { type: "heading", content: "filter: отбор элементов" },
      { type: "text", content: "filter(func, iterable) оставляет только те элементы, где func возвращает True. func должна быть предикатом." },
      { type: "code", content: "nums = [1, 2, 3, 4, 5, 6]\nevens = list(filter(lambda x: x % 2 == 0, nums))\nprint(evens)  # [2, 4, 6]" },
      { type: "predict", code: "words = ['cat', 'dog', 'bird']\nlong = list(filter(lambda w: len(w) > 3, words))\nprint(long)", question: "Что выведет?", options: ["['cat', 'dog']", "['bird']", "['cat']", "[]"], answer: 1, explain: "filter оставляет слова длиной > 3: 'bird' (4 символа). Результат: ['bird']." },
      { type: "heading", content: "sorted с key=lambda" },
      { type: "text", content: "sorted(iterable, key=func) сортирует, используя ключ. lambda часто используют для key: sorted(list, key=lambda x: x['score'])." },
      { type: "code", content: "agents = [{'name': 'Rex', 'score': 50}, {'name': 'V', 'score': 95}]\nordered = sorted(agents, key=lambda a: a['score'])\nprint([a['name'] for a in ordered])  # ['Rex', 'V']" },
      { type: "note", content: "lambda должна быть одной строкой. Для сложной логики используйте def. map/filter часто заменяются list comprehension." },
      { type: "warning", content: "• <b>Лямбда без скобок</b>: list(map(lambda x: x*2, nums)) — не list(map(lambda x: x*2), nums).<br>• <b>map возвращает итератор</b> — оберните в list() для вывода.<br>• <b>Сложные lambda</b>: если читается сложно — используйте def." },
      { type: "heading", content: "Lambda с if/else" },
      { type: "text", content: "lambda поддерживает тернарный оператор: lambda x: 'yes' if x > 0 else 'no'." },
      { type: "code", content: "classify = lambda x: 'pos' if x > 0 else ('neg' if x < 0 else 'zero')\nprint(classify(5))   # pos\nprint(classify(-1))  # neg\nprint(classify(0))   # zero" },
      { type: "predict", code: "f = lambda x, y: x if x > y else y\nprint(f(3, 7))", question: "Что выведет?", options: ["3", "7", "True", "Ошибка"], answer: 1, explain: "Lambda возвращает большее из x и y. f(3, 7): 7 > 3, возвращает 7." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: square = lambda x: x ** 2. Вычислите square(6) и выведите.",
        starter: "square = lambda x: x ** 2\n# Выведите square(6)\n",
        hints: ["lambda x: x ** 2 — однострочная функция", "print(square(6)) — выводит 36"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "36" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте список nums = [1, 2, 3, 4, 5]. Через map и lambda умножьте все на 3. F-строкой выведите: 'Умножено: <result>'.",
        starter: "# Список nums\n# map + lambda * 3\n# Вывод f-строкой\n",
        hints: ["result = list(map(lambda x: x * 3, nums))", "print(f'Умножено: {result}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "has-call", name: "map" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: nums = [10, 15, 20, 25]. Отфильтруйте через filter+lambda числа > 18. Выведите.",
        starter: "nums = [10, 15, 20, 25]\n# filter с lambda x: x > 18\n# list() и print()\n",
        hints: ["list(filter(lambda x: x > 18, nums))", "print(...) — выводит [20, 25]"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "[20, 25]" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "Ошибка: map не обёрнут в list. Исправьте вывод.",
        starter: "nums = [1, 2, 3]\nresult = map(lambda x: x * 2, nums)\nprint(result)",
        hints: ["map возвращает итератор, не список", "list(map(...)) превращает в список"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "<map object at " }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Список items = [5, 1, 9, 3]. Отсортируйте по убыванию через sorted с key=lambda. F-строкой выведите: 'Отсортировано: <result>'.",
        starter: "# items = [5, 1, 9, 3]\n# sorted с key=lambda\n# Вывод f-строкой\n",
        hints: ["result = sorted(items, key=lambda x: -x)", "print(f'Отсортировано: {result}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Отсортировано: [9, 5, 3, 1]" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "lambda args: expression — анонимная функция в одню строку",
      "map(func, iterable) применяет func к каждому элементу. Оберните list() для списка",
      "filter(func, iterable) оставляет только элементы где func возвращает True",
      "sorted(list, key=lambda x: ...) сортирует по ключу. key=lambda x: -x для сортировки по убыванию",
      "map и filter часто заменяются list comprehension — короче и читаемее"
    ],
    quiz: [
      { q: "Что вернёт: (lambda x: x + 1)(5)?", options: ["5", "6", "1", "Ошибка"], answer: 1, explain: "Лямбда вызывается сразу. (lambda x: x+1)(5) = 5+1 = 6." },
      { q: "Чем map отличается от list comprehension?", options: ["map быстрее", "list comprehension читаемее и заменяет map", "map возвращает список", "они одинаковы"], answer: 1, explain: "list comprehension читаемее и зачастую заменяет map/filter. Python стиль предпочитает comprehension." },
      { q: "Что вернёт: sorted([1,2,3])?", options: ["[1, 2, 3]", "[3, 2, 1]", "1", "None"], answer: 0, explain: "sorted() возвращает новый отсортированный список. [1, 2, 3] уже отсортирован." },
      { q: "Что возвращает map без list()?", options: ["map object", "list", "int", "None"], answer: 0, explain: "map возвращает объект-итератор (map object). Для вывода нужен list(map(...))." }
    ]
  },

  // 19 - Iterators and generators
  {
    id: 'python-19-iterators-generators',
    title: "Итераторы и генераторы",
    goal: 'Создавать итераторы через yield, использовать iter() и next()',
    prereq: ['python-18-lambda'],
    duration: 17,
    theory: [
      { type: "hook", content: "V должен обрабатывать 1 миллион координат. Загружать all в list — съест всю память. Генератор выдаёт по одному." },
      { type: "heading", content: "Что такое итерируемое" },
      { type: "text", content: "Итерируемое — объект, по которому можно проходить цикл for. list, str, range, dict — итерируемые. Итератор — объект с __iter__ и __next__." },
      { type: "code", content: "nums = [1, 2, 3]\nit = iter(nums)\nprint(next(it))  # 1\nprint(next(it))  # 2\nprint(next(it))  # 3" },
      { type: "heading", content: "iter() и next()" },
      { type: "text", content: "iter() возвращает итератор из итерируемого. next() возвращает следующий элемент. StopIteration когда элементы заканчиваются." },
      { type: "code", content: "chars = iter('abc')\nprint(next(chars))  # a\nprint(next(chars))  # b\nprint(next(chars))  # c\n# next(chars) → StopIteration" },
      { type: "predict", code: "it = iter([10, 20])\nprint(next(it), end=' ')\nprint(next(it))", question: "Что выведет?", options: ["10 20", "10\n20", "Ошибка", "[10, 20]"], answer: 0, explain: "next(it) поочерёдно возвращает 10, 20. end=' ' заменяет перенос на пробел." },
      { type: "heading", content: "Генераторы: yield вместо return" },
      { type: "text", content: "Генератор — функция с yield. yield приостанавливает и возвращает значение. Функция возобновляется с того места. Экономит память." },
      { type: "code", content: "def count_up_to(n):\n    i = 0\n    while i < n:\n        yield i\n        i += 1\n\ng = count_up_to(3)\nprint(next(g))  # 0\nprint(next(g))  # 1\nprint(next(g))  # 2" },
      { type: "note", content: "Генератор не вычисляет всё заранее — lazy evaluation. Элемент вычисляется только при запросе next()." },
      { type: "predict", code: "def gen():\n    for i in range(3):\n        yield i\n\ng = gen()\nprint(list(g))", question: "Что выведет?", options: ["[0, 1, 2]", "[1, 2, 3]", "(0, 1, 2)", "Ошибка"], answer: 0, explain: "gen() генерирует 0, 1, 2 через yield. list(g) превращает генератор в список." },
      { type: "heading", content: "Генератор выражения (genexpr)" },
      { type: "text", content: "Как list comprehension, но с () вместо []. Возвращает не список, а генератор. Экономит память для больших данных." },
      { type: "code", content: "big_list = range(1000000)\n# List — все в памяти\nsquares_list = [x**2 for x in big_list]\n# Generator — по запросу\nsquares_gen = (x**2 for x in big_list)\nprint(next(squares_gen))  # 0\nprint(next(squares_gen))  # 1" },
      { type: "heading", content: "Бесконечные генераторы" },
      { type: "text", content: "Генератор может бесконечно выдавать значения — while True + yield. Используйте itertools или for с break." },
      { type: "code", content: "def counter():\n    n = 0\n    while True:\n        yield n\n        n += 1\n\nc = counter()\nprint(next(c))  # 0\nprint(next(c))  # 1\nprint(next(c))  # 2" },
      { type: "warning", content: "• <b>Генератор одноразовый</b>: list(gen) один раз. Повторный list(gen) вернёт пустой список.<br>• <b>StopIteration</b>: next() на пустом итераторе бросает StopIteration. for this обрабатывает автоматически.<br>• <b>list comprehension vs genexpr</b>: [] создаёт список в памяти, () — ленивый." },
      { type: "note", content: "Для бесконечного или большого: используйте генератор, а не список. Экономит ОЗУ." },
      { type: "predict", code: "def squares(n):\n    for i in range(n):\n        yield i ** 2\n\ng = squares(3)\nprint(list(g))\nprint(list(g))", question: "Что выведет?", options: ["[0, 1, 4]\\n[0, 1, 4]", "[0, 1, 4]\\n[]", "[]\\n[]", "Ошибка"], answer: 1, explain: "Первый list(g) выдаёт [0, 1, 4]. Генератор исчерпан. Второй list(g) — пустой список []. Результат: [0, 1, 4] затем []." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: функция gen_range(n) через yield выдаёт числа 0..n-1. Создайте gen и превратите в list.",
        starter: "def gen_range(n):\n    for i in range(n):\n        yield i\n\ng = gen_range(5)\n# list(g) и print()\n",
        hints: ["list(g) превращает генератор в список", "print(list(g)) — выводит [0, 1, 2, 3, 4]"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "[0, 1, 2, 3, 4]" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте генератор gen_evens(n), выдающий чётные числа 0, 2, 4... через yield и range(0, n, 2). F-строкой выведите: 'Чётные: <list>'.",
        starter: "# def gen_evens(n) с yield\n# Создайте gen через gen_evens(6)\n# Вывод f-строкой с list()\n",
        hints: ["def gen_evens(n):\n    for i in range(0, n, 2):\n        yield i", "print(f'Чётные: {list(gen_evens(6))}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Чётные: [0, 2, 4]" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: создайте genexpr = (x * 2 for x in [1, 2, 3]). Выведите через list().",
        starter: "genexpr = (x * 2 for x in [1, 2, 3])\n# list() и print()\n",
        hints: ["list(genexpr) — превращает в список", "print(...) — выводит [2, 4, 6]"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "[2, 4, 6]" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "Генератор одноразовый: второй list(gen) пустой. Перепишите, чтобы работало дважды — создайте новый объект.",
        starter: "def nums():\n    yield 1\n    yield 2\n\ng = nums()\nprint(list(g))\nprint(list(g))\n",
        hints: ["g истощается после первого list(g)", "Создайте новый g = nums() перед вторым вызовом"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "[1, 2]\n[1, 2]" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Создайте бесконечный генератор gen_fib() — числа Фибоначчи. Через next() получите три первых числа. F-строкой выведите: 'Первые: <a>, <b>, <c>'.",
        starter: "# def gen_fib() с yield — бесконечный\n# next() три раза\n# Вывод f-строкой\n",
        hints: ["def gen_fib():\n    a, b = 0, 1\n    while True:\n        yield a\n        a, b = b, a + b", "next(g) три раза: 0, 1, 1"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "next" }, { kind: "stdout", equals: "Первые: 0, 1, 1" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "iter() возвращает итератор, next() — следующий элемент. StopIteration при окончании",
      "Генератор — функция с yield. Приостанавливает и возобновляет выполнение. Lazy evaluation",
      "Генератор одноразовый: после list(gen) второй list(gen) пустой. Создавайте новый объект",
      "Генератор выражение (genexpr) с () вместо [] — экономит память. map/filter часто заменяются",
      "Бесконечный генератор через while True + yield. Используйте next() или for с break"
    ],
    quiz: [
      { q: "Что вернёт iter([1,2])?", options: ["[1, 2]", "итератор", "1", "None"], answer: 1, explain: "iter() возвращает итератор из списка. Итератор — это объект с __iter__ и __next__." },
      { q: "Чем yield отличается от return?", options: ["yield останавливает, return завершает", "yield возвращает список", "они одинаковы", "yield быстрее"], answer: 0, explain: "yield приостанавливает функцию и возвращает значение. При следующем вызове продолжает с того места. return полностью завершает функцию." },
      { q: "Что вернёт: g = (x for x in range(2)); print(list(g)); print(list(g))?", options: ["[0, 1][0, 1]", "[0, 1][]", "Ошибка", "[][0, 1]"], answer: 1, explain: "Генератор одноразовый. Первый list(g) = [0, 1]. Генератор истощён. Второй list(g) = []. Результат: [0, 1] затем пусто." },
      { q: "Для чего бесконечный генератор?", options: ["Экономия памяти", "Генерировать бесконечно значений по запросу", "Создавать пустой список", "Оптимизация"], answer: 1, explain: "Бесконечный генератор (while True + yield) выдаёт значения по запросу через next(). Не хранит всё в памяти — идеален для потоков данных." }
    ]
  },

  // 20 - Decorators
  {
    id: 'python-20-decorators',
    title: "Декораторы",
    goal: 'Писать декораторы через @decorator, использовать functools.wraps',
    prereq: ['python-19-iterators-generators'],
    duration: 19,
    theory: [
      { type: "hook", content: "V хочет логировать все вызовы шифрования. Копировать код логирования в каждую функцию — глупо. Декоратор добавит логирование автоматически." },
      { type: "heading", content: "Что такое декоратор" },
      { type: "text", content: "Декоратор — функция, которая оборачивает другую функцию и изменяет её поведение. Синтаксис @decorator над функцией." },
      { type: "code", content: "def logger(func):\n    def wrapper():\n        print(f'Вызов {func.__name__}')\n        return func()\n    return wrapper\n\n@logger\ndef encrypt():\n    print('Данные зашифрованы')\n\nencrypt()  # Вызов encrypt\\nДанные зашифрованы" },
      { type: "heading", content: "Как работает @decorator" },
      { type: "text", content: "Аннотация @decorator равна encrypt = decorator(encrypt). decorator принимает функцию и возвращает новую (wrapper)." },
      { type: "code", content: "def repeat(func):\n    def wrapper():\n        func()\n        func()\n    return wrapper\n\n@repeat\ndef say_hi():\n    print('Привет')\n\nsay_hi()  # Привет\\nПривет" },
      { type: "predict", code: "def deco(func):\n    def wrapper():\n        print('before')\n        return func()\n    return wrapper\n\n@deco\ndef hello():\n    print('hello')\n\nhello()", question: "Что выведет?", options: ["hello\\nbefore", "before\\nhello", "before\\nhello\\nbefore", "Ошибка"], answer: 1, explain: "hello = deco(hello). wrapper печатает 'before', затем вызывает hello() → 'hello'. Результат: before, затем hello." },
      { type: "heading", content: "Декоратор с аргументами через *args, **kwargs" },
      { type: "text", content: " Если функция принимает аргументы, wrapper должен их передать через *args и **kwargs. Это универсальный сигнатурный интерфейс." },
      { type: "code", content: "def logger(func):\n    def wrapper(*args, **kwargs):\n        print(f'Вызов {func.__name__}')\n        return func(*args, **kwargs)\n    return wrapper\n\n@logger\ndef greet(name, greeting='Привет'):\n    return f'{greeting}, {name}'\n\nprint(greet('V'))  # Вызов greet\\nПривет, V" },
      { type: "note", content: "*args и **kwargs позволяют wrapper принимать любые аргументы и передавать их оригинальной функции." },
      { type: "heading", content: "functools.wraps: сохранение метаданных" },
      { type: "text", content: "Декоратор скрывает оригинальную функцию: wrapper.__name__ = 'wrapper', а не оригинальное имя. functools.wraps сохраняет __name__, __doc__." },
      { type: "code", content: "import functools\n\n\ndef logger(func):\n    @functools.wraps(func)\n    def wrapper(*args, **kwargs):\n        return func(*args, **kwargs)\n    return wrapper\n\n@logger\ndef encrypt():\n    \"\"\"Шифрует данные.\"\"\"\n    pass\n\nprint(encrypt.__name__)  # encrypt (спасено functools.wraps)" },
      { type: "predict", code: "import functools\n\ndef d(f):\n    @functools.wraps(f)\n    def w():\n        pass\n    return w\n\n@d\ndef my_func():\n    pass\n\nprint(my_func.__name__)", question: "Что выведет?", options: ["wrapper", "my_func", "d", "Ошибка"], answer: 1, explain: "functools.wraps(f) копирует __name__ из оригинальной функции. my_func.__name__ = 'my_func', а не 'wrapper'." },
      { type: "warning", content: "• <b>Забыть return wrapper</b>: если decorator не возвращает wrapper, функция заменяется на None.<br>• <b>Не передать *args</b>: wrapper без *args не сможет принимать аргументы оригинальной функции.<br>• <b>Забыть @functools.wraps</b>: потеряются __name__ и __doc__." },
      { type: "note", content: "@decorator применяется сверху вниз. Если несколько декораторов — нижний применяется первым." },
      { type: "heading", content: "Метод как декоратор" },
      { type: "text", content: "Декоратор может быть классом с __call__. Или статическим/классным методом. @staticmethod не принимает self." },
      { type: "code", content: "class Counter:\n    def __init__(self, func):\n        self.func = func\n        self.calls = 0\n    def __call__(self, *args, **kwargs):\n        self.calls += 1\n        return self.func(*args, **kwargs)\n\n@Counter\ndef greet():\n    return 'Привет'\n\nprint(greet())     # Привет\nprint(greet.calls)  # 1" }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните: декоратор uppercase оборачивает функцию, возвращающую строку в верхний регистр.",
        starter: "def uppercase(func):\n    def wrapper():\n        # вызовите func() и сделайте .upper()\n        pass\n    return wrapper\n\n@uppercase\ndef get_name():\n    return 'v'\n\n# print(get_name())\n",
        hints: ["result = func()\nreturn result.upper()", "print(get_name()) — выводит V"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "V" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте декоратор logger, который перед вызовом печатает 'Вызов: func_name'. Примените к функции hello, возвращающей 'Привет'. F-строкой выведите результат.",
        starter: "# def logger(func)\n# @logger\ndef hello():\n    return 'Привет'\n# Вывод f-строкой через print(hello())\n",
        hints: ["def wrapper(*args, **kwargs):\n    print(f'Вызов: {func.__name__}')\n    return func(*args, **kwargs)", "print(f'{hello()}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Привет" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: декоратор с *args. Функция add(a, b) возвращает сумму. Декоратор logger печатает вызов.",
        starter: "def logger(func):\n    def wrapper(*args, **kwargs):\n        # Печатайте 'Вызов: ' + func.__name__\n        # Возвращайте func(*args, **kwargs)\n    return wrapper\n\n@logger\ndef add(a, b):\n    return a + b\n\n# print(add(3, 5))\n",
        hints: ["return func(*args, **kwargs) передаёт все аргументы", "print(add(3, 5)) — выводит 8"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "8" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "Декоратор не возвращает wrapper — функция становится None. Исправьте.",
        starter: "def logger(func):\n    def wrapper():\n        print('call')\n        return func()\n\n@logger\ndef hello():\n    return 'Привет'\n\nprint(hello())",
        hints: ["logger должен return wrapper", "В конце logger: return wrapper"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "call\nПривет" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Создайте декоратор uppercase через class с __call__. Примените к функции get_msg() → 'hello'. F-строкой выведите: 'Результат: <msg>'.",
        starter: "# class UpperCase с __init__ и __call__\n# Примените как @UpperCase\ndef get_msg():\n    return 'hello'\n# Вывод f-строкой\n",
        hints: ["class Dec:\n    def __init__(self, func): self.func = func\n    def __call__(self): return self.func().upper()", "print(f'Результат: {get_msg()}')"],
        checks: [{ kind: "has-fstring" }, { kind: "has-call", name: "print" }, { kind: "stdout", equals: "Результат: HELLO" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "Декоратор — функция, оборачивающая другую. @decorator = func = decorator(func). wrapper возвращает результат func()",
      "*args и **kwargs в wrapper позволяют принимать любые аргументы оригинальной функции",
      "functools.wraps сохраняет __name__ и __doc__ оригинальной функции",
      "Декоратор может быть классом с __call__ — для состояния (счётчик вызовов)",
      "Декораторы применяются сверху вниз. @wraps важен для отладки и introspection"
    ],
    quiz: [
      { q: "Что нужно return из декоратора?", options: ["func", "wrapper", "None", "args"], answer: 1, explain: "Декоратор должен return wrapper — новую функцию, которая заменяет оригинальную. Без return функция становится None." },
      { q: "Для чего functools.wraps?", options: ["Скорость", "Сохранить __name__ и __doc__", "Объединить функции", "Удалить wrapper"], answer: 1, explain: "functools.wraps копирует метаданные оригинальной функции (__name__, __doc__) в wrapper. Без него wrapper.__name__ = 'wrapper'." },
      { q: "Что вернёт: add(3,5) где add = logger(add)?", options: ["8", "call\\n8", "None", "Ошибка"], answer: 0, explain: "logger принимает add и возвращает wrapper. add(3, 5) вызывает wrapper, который печатает 'call' и возвращает 8." },
      { q: "Класс-декоратор должен реализовать?", options: ["__init__ только", "__call__", "__new__", "__str__"], answer: 1, explain: "Класс-декоратор реализует __call__, чтобы объект класса был вызываемым как функция. __init__ принимает оригинальную функцию." }
    ]
  },

  // 21 - Context managers
  {
    id: 'python-21-context-managers',
    title: "Контекст-менеджеры",
    goal: 'Создавать контекст-менеджеры через with и __enter__/__exit__',
    prereq: ['python-20-decorators'],
    duration: 16,
    theory: [
      { type: "hook", content: "V открывает соединение с кибер-центром. Надо гарантировать закрытие даже при ошибке.Контекст-менеджер with гарантирует cleanup." },
      { type: "heading", content: "with: гарантированный cleanup" },
      { type: "text", content: "Контекст-менеджер — объект с __enter__ и __exit__. with obj as x: вызывает __enter__, затем гарантированно __exit__ (даже при ошибке)." },
      { type: "code", content: "with open('data.txt', 'r') as f:\n    content = f.read()\n# Файл гарантированно закрыт здесь\nprint(content)" },
      { type: "heading", content: "__enter__ и __exit__" },
      { type: "text", content: "__enter__ возвращает ресурс. __exit__ принимает (exc_type, exc_value, traceback) — информацию об исключении. Возвращает True чтобы подавить ошибку." },
      { type: "code", content: "class DBConnection:\n    def __enter__(self):\n        print('Подключение открыто')\n        self.conn = 'active'\n        return self.conn\n    def __exit__(self, exc_type, exc_val, exc_tb):\n        print('Подключение закрыто')\n        return False\n\nwith DBConnection() as conn:\n    print(f'Работа с {conn}')" },
      { type: "predict", code: "class T:\n    def __enter__(self):\n        print('enter')\n        return 'x'\n    def __exit__(self, *args):\n        print('exit')\n\nt = T()\nwith t as val:\n    print(val)", question: "Что выведет?", options: ["enter\\nx\\nexit", "x\\nenter", "enter\\nexit\\nx", "Ошибка"], answer: 0, explain: "with вызывает __enter__ (enter, возвращает 'x'), затем print(val) (x), затем __exit__ (exit). Порядок: enter, x, exit." },
      { type: "heading", content: "suppress: подавление ошибок" },
      { type: "text", content: "contextlib.suppress(*exceptions) подавляет указанные исключения внутри with. Аналог try/except, но лаконичнее." },
      { type: "code", content: "from contextlib import suppress\n\nwith suppress(FileNotFoundError):\n    with open('missing.txt', 'r') as f:\n        print(f.read())\nprint('Продолжили работу')  # ошибка подавлена" },
      { type: "note", content: "__exit__ возвращает True → исключение подавлено. False или None → исключение пробрасывается дальше." },
      { type: "heading", content: "contextlib.contextmanager" },
      { type: "text", content: "contextmanager — декоратор из contextlib. yield вместо return. with переводит к коду после yield." },
      { type: "code", content: "from contextlib import contextmanager\n\n@contextmanager\ndef timer():\n    print('start')\n    yield\n    print('end')\n\nwith timer():\n    print('работа')  # start, работа, end" },
      { type: "predict", code: "from contextlib import contextmanager\n\n@contextmanager\ndef tag():\n    yield 'X'\n\nwith tag() as val:\n    print(val)", question: "Что выведет?", options: ["X", "None", "Ошибка", "start\\nX"], answer: 0, explain: "contextmanager превращает генератор в контекст-менеджер. yield 'X' — значение передаётся в as val. print(val) → X." },
      { type: "note", content: "contextmanager требует ровно один yield. До yield — __enter__, после — __exit__." },
      { type: "heading", content: "Встроенные контекст-менеджеры" },
      { type: "text", content: "open() — файлы. threading.Lock — блокировки. decimal.localcontext — для Decimal. contextlib.redirect_stdout — перенаправление вывода." },
      { type: "code", content: "import os\n\nwith __import__('contextlib').suppress(PermissionError):\n    os.remove('missing.txt')\nprint('Файл удалён или не существовал')" },
      { type: "warning", content: "• <b>Не закрывайте twice</b>: with закрывает автоматически. close() вручную — bad practice.<br>• <b>Исключения в __exit__</b>: если __exit__ бросает ошибку — оригинальная ошибка теряется.<br>• <b>contextmanager без yield</b>: без yield → AssertionError." },
      { type: "predict", code: "with open('test.txt', 'w') as f:\n    f.write('data')\nwith open('test.txt', 'r') as f:\n    print(len(f.read()))", question: "Что выведет?", options: ["4", "д", "data", "Ошибка"], answer: 0, explain: "Записываем 'data' (4 символа). Читаем и считаем len('data') = 4. print(4) → 4." }
    ],
    tasks: [
      {
        id: "t1", type: "guided",
        prompt: "Дополните класс FileManager: __enter__ возвращает 'opened', __exit__ печатает 'closed'. Используйте with.",
        starter: "class FileManager:\n    def __enter__(self):\n        return 'opened'\n    def __exit__(self, *args):\n        print('closed')\n\nwith FileManager() as f:\n    # print(f)\n",
        hints: ["with ... as f — f = результат __enter__()", "print(f) выводит 'opened'"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "opened" }, { kind: "no-error" }]
      },
      {
        id: "t2", type: "from-scratch",
        prompt: "Создайте контекст-менеджер через @contextmanager: timer(). Внутри печатайте 'start' до yield, 'end' после. Вызовите с print('работа'). F-строкой выведите результат.",
        starter: "# @contextmanager\ndef timer():\n    print('start')\n    yield\n    print('end')\n\n# with timer(): print('работа')\n",
        hints: ["from contextlib import contextmanager", "print(f'Готово') после with"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "no-error" }]
      },
      {
        id: "t3", type: "guided",
        prompt: "Дополните: используйте contextlib.suppress для открытия 'nonexist.txt' без ошибки. В конце выведите 'продолжено'.",
        starter: "from contextlib import suppress\n# with suppress(???):\n#     open('nonexist.txt', 'r')\n# print('продолжено')\n",
        hints: ["suppress(FileNotFoundError) — подавляет ошибку открытия", "print('продолжено') выводит продолжено"],
        checks: [{ kind: "has-call", name: "print" }, { kind: "stdout", equals: "продолжено" }, { kind: "no-error" }]
      },
      {
        id: "t4", type: "debug",
        prompt: "Ошибка: __exit__ не принимает аргументы исключения. Исправьте сигнатуру.",
        starter: "class DB:\n    def __enter__(self):\n        return self\n    def __exit__(self):\n        pass\n\ndb = DB()\ndb.__enter__()\ndb.__exit__()",
        hints: ["__exit__ принимает self, exc_type, exc_val, exc_tb", "Используйте with DB() instead"],
        checks: [{ kind: "has-call", name: "pass" }, { kind: "no-error" }]
      },
      {
        id: "t5", type: "from-scratch",
        prompt: "Создайте класс Counter с __enter__ (счётчик=0) и __exit__ (возвращает True, подавляя ошибки). F-строкой выведите: 'Счётчик: <count>'.",
        starter: "# class Counter с __enter__/__exit__\n# __enter__ возвращает self.count\n# with Counter() as c: print(f'Счётчик: {c}')\n",
        hints: ["def __enter__(self):\n    self.count = 0\n    return self.count", "def __exit__(self, *args):\n    return True"],
        checks: [{ kind: "has-fstring" }, { kind: "no-error" }]
      }
    ],
    recap: [
      "Контекст-менеджер — объект с __enter__ и __exit__. with гарантирует вызов __exit__ даже при ошибке",
      "__exit__(exc_type, exc_val, exc_tb) принимает информацию об исключении. return True подавляет ошибку",
      "contextlib.contextmanager — декоратор для создания CM через yield. Ровно один yield",
      "contextlib.suppress(Exception) подавляет исключения — замена try/except для cleanup",
      "Встроенные CM: open() для файлов, threading.Lock для блокировок. with закрывает автоматически"
    ],
    quiz: [
      { q: "Когда вызывается __enter__?", options: ["До with", "При входе в with", "После with", "Всегда"], answer: 1, explain: "__enter__ вызывается при входе в блок with. Возвращаемое значение присваивается переменной после as." },
      { q: "Что делает return True в __exit__?", options: ["Закрывает файл", "Подавляет исключение", "Создаёт ошибку", "Ничего"], answer: 1, explain: "__exit__ возвращает True → исключение подавляется и не пробрасывается. False или None → пробрасывается дальше." },
      { q: "Что вернёт contextmanager?", options: ["Функция", "Декоратор", "Класс", "Генератор"], answer: 1, explain: "contextlib.contextmanager — декоратор. Превращает генератор с yield в контекст-менеджер." },
      { q: "Встроенный CM для файлов?", options: ["open", "file", "read", "with"], answer: 0, explain: "open() возвращает файловый объект, который является контекст-менеджером. with open(...) as f гарантирует закрытие." }
    ]
  }
];

for (const lesson of lessons) {
    gen(lesson);
}
console.log('\nGenerated ' + lessons.length + ' lessons');
