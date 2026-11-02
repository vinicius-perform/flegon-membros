import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
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

    const ext = file.name.split('.').pop() || 'png';
    const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const fileName = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;

    let publicUrl = `/uploads/${fileName}`;

    // 1. Tenta salvar no Supabase Storage se configurado
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('courses')
          .upload(fileName, buffer, {
            contentType: file.type || 'image/png',
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('courses').getPublicUrl(fileName);
          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
          }
        }
      }
    } catch {
      // Ignora erro do Supabase e prossegue para salvar no storage local
    }

    // 2. Sempre persiste localmente em public/uploads como garantia de disponibilidade
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
    } catch (fsErr: any) {
      console.error('Erro ao salvar localmente no servidor:', fsErr);
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json({ success: false, error: error.message || 'Erro ao processar imagem.' }, { status: 500 });
  }
}
