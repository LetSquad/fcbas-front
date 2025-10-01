<header>

<div style="text-align: center">
<h1>Сервис для аналитики полетов гражданских БПЛА</h1>

<a rel="noreferrer noopener" target="_blank" href="https://github.com/LetSquad/fcbas-front/releases">
    <img alt="Новейший релиз" src="https://img.shields.io/github/v/release/LetSquad/fcbas-front?label=%D1%81%D0%B2%D0%B5%D0%B6%D0%B8%D0%B9%20%D1%80%D0%B5%D0%BB%D0%B8%D0%B7&logo=github&style=for-the-badge">
</a>
<a href="https://github.com/LetSquad/fcbas-front">
	<img src="https://img.shields.io/github/languages/top/LetSquad/fcbas-front?style=flat-square&logo=github" alt="GitHub основной язык" />
</a>
<a href="https://github.com/LetSquad/fcbas-front/workflows/build/badge.svg">
	<img src="https://github.com/LetSquad/fcbas-front/workflows/build/badge.svg" alt="Сборка" />
</a>
</div>

</header>

# Введение

Этот сервис разработан в рамках хакатона ЛЦТ 2025 по задаче 1 "Сервис для анализа количества и длительности полетов гражданских беспилотников в регионах Российской Федерации для определения полетной активности на основе данных Росавиации"

# Возможности

- Анализ количества полетов гражданских беспилотников
- Анализ длительности полетов гражданских беспилотников
- Разграничение ролей с помощью Keycloak

# Работа с сервисом

[![Свежий релиз](https://img.shields.io/github/v/release/IvanSavoskin/lets-journey-web-app?label=%D1%81%D0%B2%D0%B5%D0%B6%D0%B8%D0%B9%20%D1%80%D0%B5%D0%BB%D0%B8%D0%B7&logo=github&style=for-the-badge)][1]

## Учетные записи для тестирования

### Администратор
Email: admin

Password: pass

### Оператор
Email: operator

Password: pass

## Предустановки
1. Скачай [свежий релиз][1] либо весь репозиторий
2. Установите Node.js (требуемая версия в [package.json](./package.json))
3. Должен быть установлен совместимый `npm`
4. В терминале выполните команду `npm install` из папки проекта
5. Если требуется локальный запуск Keycloak, то установите Docker
6. Создать файл `.env` в корне проекта на основе `.env.example` (при необходимости использовать локальный Keycloak необходимо установить параметр KEYCLOAK_ENABLED=true, а также настроить другие параметры Keycloak в соответствии с вашими конфигурациями)

## Линтеры
Для контроля качества кода предусмотрено подключение линтеров.

### ESLint
Правила для ESLint указаны в файле `/.eslintrc`.

Проверка кода с использованием ESLint запускается командой `npm run eslint`.

### Stylelint
Правила для Stylelint указаны в файле `/.stylelintrc.json`.

Проверка кода с помощью Stylelint стартует командой `npm run stylelint`.

## Сборка для разработки
Стартовать сборку для отладки командой `npm run dev`.

После успешного выполнения команд будет запущен Rspack Dev Server и автоматически откроется вкладка в браузере
с приложением по адресу `localhost:8883`.
Собранный проект хранится в оперативной памяти.
Каждое изменение кода инициирует обновление страницы автоматически.
Доступны Chrome Dev Tools и Redux Dev Tools

Также, можно запустить сборку со встроенными моками для ряда запросов и окружения Telegram, 
что позволит проверить некоторую функциональность не используя бота.
Для этого необходимо стартовать сборку командой `npm run dev:mock`.

## Использование локального Keycloak
Чтобы использовать Keycloak развернутый локально, необходимо запустить docker-compose с помощью команды `docker compose up --detach` в корне проекта

## Промышленная сборка
Стартовать релизную сборку командой `npm run prod`.

Перед сборкой автоматически запускается проверка кода с помощью ESLint и Stylelint.
В случае успешной сборки приложения в рабочей директории будет создана поддиректория `static` с приложением,
а в лог будет выведено сообщение вида:

`Rspack compiled`

Полученное содержимое директории `static` можно добавить на любой веб-сервер в качестве статического контента.
В собранном приложении будут недоступны Chrome Dev Tools и Redux Dev Tools

[1]: https://github.com/LetSquad/fcbas-front/releases
