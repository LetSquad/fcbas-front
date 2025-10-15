import { DateTime } from "luxon";

/**
 * Делает заглавной первую букву в строке.
 *
 * @param {string} word - Строка, в которой нужно сделать заглавной первую букву
 * @returns {string} Строка с заглавной первой буквой
 */
export function capitalizeFirstLetter(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

export function isSameDate(firstDay: DateTime, secondDay: DateTime) {
    return firstDay.day === secondDay.day && firstDay.month === secondDay.month && firstDay.year === secondDay.year;
}

export function toNumberRecord<TValue>(entries: [number, TValue][]) {
    return Object.fromEntries(entries) as Record<number, TValue>;
}
