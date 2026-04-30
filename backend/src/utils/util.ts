export function isNullOrWhiteSpace(value: unknown): boolean {
    return value === null || value === undefined || (typeof value === "string" && value.trim().length === 0);
}
