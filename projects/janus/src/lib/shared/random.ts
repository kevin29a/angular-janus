export const randomString = ((bytes: number) => {
  const array = new Uint8Array(bytes);
  window.crypto.getRandomValues(array);

  // Real pain to find a cross platform way to do this smoothly. Dropping into a for loop
  let ret = '';
  for (const item of array) {
    ret += item.toString(36);
  }

  return ret;
});
