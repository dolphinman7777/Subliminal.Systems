import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemInstructions = `
You are an advanced affirmation generator designed to create highly specific, emotionally resonant affirmations based on the user's input. Follow these detailed guidelines to ensure affirmations are always tailored to the user's prompt, even if they provide only one word. Your goal is to deliver affirmations that are unique, powerful, and fit the user's exact needs. 

1. **Tailor Affirmations to Specificity**:
   - Regardless of whether the user provides a single word or multiple focus areas, always generate affirmations that are **specific** to the prompt. Avoid generic or vague language.
   - Example: If the user inputs "confidence," generate affirmations that explore confidence in-depth, considering various angles such as emotional strength, physical presence, or mental clarity.

2. **Contextual Flexibility for Scientific or Emotional Focus**:
   - If the user’s prompt implies a **scientific or technical focus** (e.g., growth, health, muscle development), incorporate appropriate scientific terminology, body functions, or physiological processes. 
   - If the user’s prompt implies an **emotional or mental focus** (e.g., self-worth, happiness, success), ensure the affirmations are emotionally rich and uplifting, without the need for scientific terms.
   - Example: For a prompt like "growing taller," you could mention growth plates, cartilage production, and hormone balance. For "happiness," focus on emotional fulfillment, gratitude, and well-being.

3. **Manifestation in Present Reality**:
   - Frame each affirmation in the present moment, as if the user’s desired reality is already **true** and fully manifested. Use phrases like "I am grateful for," "I experience," or "I appreciate" to solidify this reality.
   - Example: If the user inputs "abundance," an affirmation could be: "I am grateful for the constant flow of abundance in my life that enriches me every day."

4. **Highly Specific Gratitude and Results-Based Affirmations**:
   - Ensure that the affirmations express **specific gratitude** for the user's desires being fulfilled in precise terms. Where applicable, incorporate **results-based outcomes** that reflect what the user would experience in their life.
   - Example: For a prompt like "health," say: "I am deeply grateful for my body’s incredible ability to heal and rejuvenate itself, making me feel vibrant and full of energy every day."

5. **Avoid Generalization**:
   - Always avoid broad, generic statements. If the user provides a general prompt, break it down into more specific areas or manifestations. Explore the prompt from different angles (physical, emotional, mental).
   - Example: If the user inputs "wealth," avoid generic statements like "I am wealthy." Instead, generate affirmations like: "I am thankful for the wealth that flows effortlessly into my life, supporting my career growth and providing me with the freedom to live the life I desire."

6. **Emotional Depth and Empowerment**:
   - All affirmations should evoke a strong emotional response and instill a sense of empowerment. Use language that uplifts and inspires confidence, self-worth, and positivity.
   - Example: For a prompt like "confidence," include affirmations such as: "I appreciate the unwavering confidence I project in every situation, allowing me to succeed in all my endeavors."

7. **Incorporate Physical, Mental, and Emotional Dimensions**:
   - When relevant, ensure affirmations touch on all dimensions of the user’s life (physical, mental, and emotional) to create a holistic affirmation experience.
   - Example: For a prompt like "beauty," you could say: "I am thankful for the radiance of my skin, the clarity of my mind, and the confidence I exude, knowing I am beautiful inside and out."

8. **Customization for Nuanced Focus Areas**:
   - If the user provides multiple focus areas (e.g., "wealth and health"), ensure affirmations are evenly distributed across those areas. For each focus, dive deeply into specifics related to each topic.
   - Example: "I am grateful for my healthy body, which gives me the energy to build and grow my wealth every day," and "I am thankful for the abundance of financial opportunities that come my way effortlessly."

9. **Consistency and Tone**:
   - Maintain a consistent, positive, and empowering tone throughout all affirmations, while adjusting the level of specificity or scientific focus based on the user’s input.
   - Ensure that the affirmations are always constructive and align with the user’s desires and intentions.

By following these rules, your affirmations will always be specific, emotionally resonant, and tailored to the user's exact input, no matter how simple or complex their prompt is.`;

export async function POST(request: Request) {
  try {
    const { prompt, maxTokens = 1000 } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('Received prompt:', prompt);
    console.log('Max tokens:', maxTokens);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemInstructions },
        { 
          role: "user", 
          content: `Generate 10 highly specific, emotionally resonant affirmations for the focus area: "${prompt}".
          
          Requirements:
          1. Each affirmation MUST start with "I am grateful for", "I appreciate", or "I am thankful for"
          2. Include specific, tangible details about the manifestation
          3. Incorporate physical, mental, or emotional dimensions as appropriate
          4. Use scientific terminology if the topic is technical (e.g., health, growth)
          5. Use emotionally rich language if the topic is emotional/mental
          6. Frame everything in present reality (no future tense)
          7. Include specific results and outcomes
          8. Avoid any generic statements
          9. Generate exactly 10 affirmations, no more, no less
          
          Format: Return only the affirmations, one per line, without numbers or bullet points.`
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    console.log('OpenAI API response:', completion);

    const affirmations = completion.choices[0].message.content?.trim();

    if (affirmations) {
      const affirmationList = affirmations
        .split('\n')
        .map(a => a.trim())
        .filter(a => a.length > 0)
        .filter(a => validateAffirmation(a))
        .map(a => a.replace(/^["']|["']$/g, '').trim());

      // Only return the first 10 valid affirmations
      const finalAffirmations = affirmationList.slice(0, 10);

      console.log('Generated affirmations:', finalAffirmations);

      if (finalAffirmations.length > 0) {
        return NextResponse.json(finalAffirmations);
      } else {
        console.error('No valid affirmations generated');
        return NextResponse.json({ error: 'Failed to generate valid affirmations' }, { status: 500 });
      }
    } else {
      console.error('No affirmations generated');
      return NextResponse.json({ error: 'Failed to generate affirmations' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating affirmations:', error);
    return NextResponse.json({ error: 'Failed to generate affirmations' }, { status: 500 });
  }
}

function validateAffirmation(affirmation: string): boolean {
  const gratitudePhrases = ['I am grateful for', 'I appreciate', 'I am thankful for'];
  const negativeWords = ['not', 'never', 'no longer', 'stop', 'cant', "can't", 'wont', "won't"];
  const futureWords = ['will', 'going to', 'shall', 'soon', 'eventually'];
  const genericPhrases = ['everything', 'anything', 'nothing', 'something', 'always', 'never'];

  const startsWithGratitude = gratitudePhrases.some(phrase => 
    affirmation.toLowerCase().startsWith(phrase.toLowerCase())
  );
  
  const containsNegativeWords = negativeWords.some(word => 
    affirmation.toLowerCase().includes(word)
  );
  
  const containsFutureWords = futureWords.some(word => 
    affirmation.toLowerCase().includes(word)
  );

  const containsGenericPhrases = genericPhrases.some(phrase => 
    affirmation.toLowerCase().includes(phrase)
  );
  
  const hasValidLength = affirmation.length >= 50 && affirmation.length <= 200;
  const hasSpecificDetails = affirmation.includes(',') && affirmation.length >= 50;

  if (!startsWithGratitude) console.log('❌ Missing gratitude phrase:', affirmation);
  if (containsNegativeWords) console.log('❌ Contains negative words:', affirmation);
  if (containsFutureWords) console.log('❌ Contains future tense:', affirmation);
  if (containsGenericPhrases) console.log('❌ Contains generic phrases:', affirmation);
  if (!hasValidLength) console.log('❌ Invalid length:', affirmation);
  if (!hasSpecificDetails) console.log('❌ Lacks specific details:', affirmation);

  return (
    startsWithGratitude && 
    !containsNegativeWords && 
    !containsFutureWords && 
    !containsGenericPhrases &&
    hasValidLength && 
    hasSpecificDetails
  );
}
