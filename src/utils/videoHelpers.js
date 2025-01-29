export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const base64ToBlob = (base64Data) => {
  try {
    const [header, content] = base64Data.split(',');
    const mimeType = header.split(':')[1].split(';')[0];
    const binary = atob(content);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mimeType });
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    return null;
  }
};
