import { z } from 'zod';
import type { ClassDef, GeminiAssistResponse } from '../types';
import { normalizeXyxy, isSmallBox } from '../coords';
import { buildClassMaps } from '../classes';

const GeminiOutputSchema = z.object({
  image_width: z.number().positive(),
  image_height: z.number().positive(),
  annotations: z.array(
    z.object({
      class_name: z.string().min(1),
      class_id: z.number().int().nonnegative(),
      bbox_xyxy: z.tuple([
        z.number(),
        z.number(),
        z.number(),
        z.number(),
      ]),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

function extractJsonText(raw: string): string {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }

  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  return raw;
}

function extractGeminiText(payload: unknown): string {
  const root = payload as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = root.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('\n')
    .trim();

  if (!text) {
    throw new Error('Gemini response did not contain text output.');
  }

  return text;
}

export async function suggestWithGemini(params: {
  apiKey: string;
  imageBuffer: Buffer;
  imageMimeType: string;
  classes: ClassDef[];
  imageWidth: number;
  imageHeight: number;
}): Promise<GeminiAssistResponse> {
  const warnings: string[] = [];
  const { byId, byName } = buildClassMaps(params.classes);

  const prompt = [
    'You are an image annotation assistant for robotic soccer datasets.',
    'Return STRICT JSON only with this exact schema:',
    '{"image_width":number,"image_height":number,"annotations":[{"class_name":string,"class_id":number,"bbox_xyxy":[x1,y1,x2,y2],"confidence":number}]}',
    'Rules:',
    '- Use only provided classes.',
    '- bbox_xyxy uses pixel coordinates.',
    '- confidence in [0,1].',
    '- No markdown, no explanation, no trailing text.',
    `Allowed classes: ${params.classes
      .map((c) => `${c.class_id}:${c.class_name}`)
      .join(', ')}`,
  ].join('\n');

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: params.imageMimeType,
                data: params.imageBuffer.toString('base64'),
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${details}`);
  }

  let parsedOutput: z.infer<typeof GeminiOutputSchema>;
  try {
    const rawPayload = await response.json();
    const text = extractGeminiText(rawPayload);
    const jsonText = extractJsonText(text);
    const parsedJson = JSON.parse(jsonText);
    const result = GeminiOutputSchema.safeParse(parsedJson);
    if (!result.success) {
      warnings.push('Gemini output schema invalid. Suggestions were dropped.');
      return {
        image_width: params.imageWidth,
        image_height: params.imageHeight,
        annotations: [],
        warnings,
      };
    }
    parsedOutput = result.data;
  } catch (error) {
    warnings.push(`Failed to parse Gemini output: ${(error as Error).message}`);
    return {
      image_width: params.imageWidth,
      image_height: params.imageHeight,
      annotations: [],
      warnings,
    };
  }

  const normalizedAnnotations: GeminiAssistResponse['annotations'] = [];

  for (const annotation of parsedOutput.annotations) {
    let classId = annotation.class_id;
    let className = annotation.class_name;

    if (!byId.has(classId) && byName.has(className)) {
      classId = byName.get(className) as number;
    }
    if (!byId.has(classId)) {
      warnings.push(`Unknown class ignored: ${className} (${classId})`);
      continue;
    }

    className = byId.get(classId) as string;
    const bbox = normalizeXyxy(
      annotation.bbox_xyxy,
      params.imageWidth,
      params.imageHeight,
    );

    if (isSmallBox(bbox, 3)) {
      warnings.push(`Small/invalid bbox ignored for class ${className}`);
      continue;
    }

    normalizedAnnotations.push({
      class_name: className,
      class_id: classId,
      bbox_xyxy: bbox,
      confidence: annotation.confidence,
    });
  }

  return {
    image_width: params.imageWidth,
    image_height: params.imageHeight,
    annotations: normalizedAnnotations,
    warnings,
  };
}
