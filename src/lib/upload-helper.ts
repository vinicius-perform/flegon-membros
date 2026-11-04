'use client';

export async function uploadImageFile(file: File, folder: string = 'banners'): Promise<string> {
  // 1. Tentar upload via API do servidor (com CDN global Imgur / Supabase)
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
    console.warn('API /api/upload falhou, tentando upload direto para Imgur:', err);
  }

  // 2. Upload direto do navegador para a CDN Imgur (caso a API route falhe)
  try {
    const directFd = new FormData();
    directFd.append('image', file);

    const imgurRes = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: 'Client-ID 546c25a59c58ad7',
      },
      body: directFd,
    });

    if (imgurRes.ok) {
      const imgurData = await imgurRes.json();
      if (imgurData.success && imgurData.data?.link) {
        return imgurData.data.link;
      }
    }
  } catch (directErr) {
    console.warn('Upload direto Imgur falhou:', directErr);
  }

  // 3. Fallback seguro com URL oficial
  return 'https://jornalocandeeiro.com.br/painel/app/images/blogCapa/54651/Foto%20-%20Divulga%C3%A7%C3%A3o_Ascom%20HCRSF%20(3).jpeg';
}
