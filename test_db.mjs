import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key');

async function test() {
  const { data, error } = await supabase
    .from('modules')
    .select(`
      id, 
      title,
      description,
      cover_image_vertical,
      banner_image_horizontal,
      "order",
      status,
      lessons (
        id,
        title,
        video_url,
        duration,
        "order"
      )
    `);
  console.log("Result:", JSON.stringify({ data, error }, null, 2));
}
test();
