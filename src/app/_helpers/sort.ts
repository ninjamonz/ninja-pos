export function sortByProperty<T>(
  arr: T[],
  property: keyof T & string,
  ascending: boolean = true
): T[] {
  const compareFunction = (a: T, b: T): number => {
    const valueA = ascending ? a[property] : b[property];
    const valueB = ascending ? b[property] : a[property];

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return valueA - valueB;
    } else {
      const stringA = String(valueA).toLowerCase();
      const stringB = String(valueB).toLowerCase();

      if (stringA < stringB) {
        return -1;
      }
      if (stringA > stringB) {
        return 1;
      }
      return 0;
    }
  };

  return arr.sort(compareFunction);
}