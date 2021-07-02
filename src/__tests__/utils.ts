/**
 * Compares two objects only by a set of passed
 * in keys
 */
export const expectSelectively = (
  compare: Record<string, any>,
  received: Record<string, any>,
  ...keys: string[]
) => {
  keys.forEach((key) => {
    expect(received[key]).toBe(compare[key]);
  });
};

/**
 * compares two arrays of objects by the keys passed in
 */
export const expectSelectivelyArr = (
  receivedArr: Record<string, any>[],
  compareArr: Record<string, any>[],
  ...keys: string[]
) => {
  receivedArr.forEach((received, i) => {
    const compare = compareArr[i];
    expectSelectively(compare, received, ...keys);
  });
};
