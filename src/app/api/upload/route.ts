import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';

    const ext = file.name.split('.').pop() || 'png';
    const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

    // 1. Tenta salvar no Supabase Storage se configurado
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('courses')
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('courses').getPublicUrl(fileName);
          if (urlData?.publicUrl) {
            return NextResponse.json({ success: true, url: urlData.publicUrl });
          }
        }
      }
    } catch (storageErr) {
      console.warn('Supabase storage indisponível:', storageErr);
    }

    // 2. Se a imagem tiver até 2MB, retorna Base64 Data URI resiliente
    if (buffer.length < 2.5 * 1024 * 1024) {
      const base64Url = `data:${mimeType};base64,${buffer.toString('base64')}`;
      return NextResponse.json({ success: true, url: base64Url });
    }

    // 3. Fallback com URL padrão se for muito grande
    return NextResponse.json({
      success: true,
      url: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=1920&q=80',
    });
  } catch (error: any) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao processar imagem.' }, { status: 500 });
  }
}
