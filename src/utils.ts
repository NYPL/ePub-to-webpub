export function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  for (let key in obj) {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  }
  return obj;
}

/**
 * Simple function to access array values with type safety. There is no
 * guarantee they are defined, despite what TS thinks.
 */
export function safelyGet<T>(arr: T[], index: number): T | undefined {
  return arr[index];
}

/**
 * For use in our serverless handlers
 */
export function validateParam(
  name: string,
  query: Record<string, string | string[]>
): string {
  const param = query[name];
  if (typeof param !== 'string') {
    throw new Error(`Parameter ${name} is not a string: ${param}`);
  }
  return param;
}
