type ArrayIntersect<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First & ArrayIntersect<Rest>
  : unknown;

export function mergeById<T extends { id: string }[][]>(
  ...arrays: T
): ArrayIntersect<{ [I in keyof T]: T[I][0] }>[] {
  if (arrays.length === 0) return [];
  const [a, ...bs] = arrays;

  const bsMapped = bs.map((b) => new Map(b.map((item) => [item.id, item])));

  return a.map((item) => {
    const mergedItem = { ...item };
    bsMapped.forEach((map) => {
      const found = map.get(item.id);
      if (found) Object.assign(mergedItem, found);
    });
    return mergedItem;
  }) as ArrayIntersect<{ [I in keyof T]: T[I][0] }>[];
}
