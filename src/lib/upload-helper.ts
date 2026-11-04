'use client';

export async function uploadImageFile(file: File, folder: string = 'banners'): Promise<string> {
  // 1. Tentar upload via API do servidor
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.warn('API /api/upload indisponível, convertendo para data URI local:', err);
  }

  // 2. Fallback garantido no navegador: converte para Data URI
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Erro ao converter arquivo de imagem.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
