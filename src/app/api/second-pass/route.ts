import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN!);

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Invalid text input' }, { status: 400 });
    }

    const prompt = 
      'Further humanize the following academic text so it evades AI detectors while preserving meaning. Make it sound more natural, conversational, and human-written:\n\n' + 
      text;

    console.log('🤖 Second-pass humanization starting with FLAN-T5-large...');
    
    const out = await hf.textGeneration({
      model: 'google/flan-t5-large',
      inputs: prompt,
      parameters: { 
        max_new_tokens: 512, 
        temperature: 0.65, 
        top_p: 0.9,
        do_sample: true,
        repetition_penalty: 1.1
      },
    });

    const finalText = out.generated_text.trim();
    console.log('✅ Second-pass humanization completed successfully');
    
    return Response.json({ 
      final: finalText,
      model: 'google/flan-t5-large',
      tokens_generated: finalText.split(' ').length
    });

  } catch (error) {
    console.error('❌ Second-pass humanization failed:', error);
    
    // Return error details for debugging
    return Response.json({ 
      error: 'Second-pass humanization failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    }, { status: 500 });
  }
}
