import { createVertexClient } from './lib/vertex-client'
import { Modality } from '@google/genai'

async function run() {
  const ai = createVertexClient()
  const prompt = `
  You are a world-class commercial product photographer and CGI compositor.
  READ THIS FIRST:
  The product image has a ["watermark" : "Photoroom"] on it, DO NOT reproduced it in the output image.
  `
  
  try {
    const attempt1 = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: { aspectRatio: '1:1', outputMimeType: 'image/png' },
      },
    })
    console.log('Success!', attempt1)
  } catch (e: any) {
    console.error('Error generating:', e.message)
    console.log(JSON.stringify(e, null, 2))
  }
}

run()
