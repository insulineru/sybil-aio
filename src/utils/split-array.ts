function splitArray<T>(array: T[], x: number): T[][] {
  const result: T[][] = []

  for (let i = 0; i < x; i++) {
    const subArray = array.filter((_, index) => index % x === i)
    result.push(subArray)
  }

  return result
}

export { splitArray }
