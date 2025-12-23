/**
 * Q&A Generation API Integration
 * Calls external API to generate questions from uploaded documents
 */

export interface QAGenerationResponse {
  success: boolean;
  data?: {
    questions: Array<{
      q: string;
      a: string;
      type: 'qa' | 'true_false';
      correct_answer?: boolean; // Only for true_false type
    }>;
  };
  error?: string;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'text' | 'boolean';
  required: boolean;
  placeholder?: string;
  answer?: string; // Expected answer for validation
  options?: string[]; // For boolean questions
  correctAnswer?: boolean; // For true/false questions
}

/**
 * Generate questions from a document file
 * @param file - PDF or image file to analyze
 * @param numQuestions - Number of questions to generate (1-50, default: 5)
 * @returns Array of generated questions or null if failed
 */
export async function generateQuestions(
  file: File,
  numQuestions: number = 5
): Promise<GeneratedQuestion[] | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_QA_API_URL;

    if (!apiUrl) {
      console.error('❌ QA_API_URL environment variable not set');
      console.error('Add NEXT_PUBLIC_QA_API_URL to .env.local file');
      return null;
    }

    console.log('🔗 Q&A API URL:', apiUrl);

    // Validate number of questions
    const validNumQuestions = Math.min(Math.max(numQuestions, 1), 50);

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_questions', validNumQuestions.toString());

    console.log('🔗 Using Q&A API proxy route');
    console.log('📤 Sending file to Q&A API:', file.name, `(${file.size} bytes)`);
    console.log('⏰ This may take up to 2 minutes...');

    // Use Next.js API route as proxy to bypass CORS issues
    const apiEndpoint = '/api/qa/generate-questions';

    // Create AbortController with 3-minute timeout (API can take up to 2 minutes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes

    try {
      // Call the Next.js API proxy route (same-origin, no CORS issues)
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const result: QAGenerationResponse = await response.json();
      console.log('✅ API Response:', result);

      if (!result.success || !result.data?.questions) {
        console.error('❌ Invalid response format:', result);
        throw new Error(result.error || 'Failed to generate questions');
      }

      // Transform API response to internal question format
      const questions: GeneratedQuestion[] = result.data.questions.map((qa, index) => {
        if (qa.type === 'true_false') {
          // True/False question
          return {
            id: `generated_tf${index + 1}`,
            question: qa.q,
            type: 'boolean' as const,
            required: true,
            options: ['True', 'False'],
            answer: qa.a, // The displayed answer text
            correctAnswer: qa.correct_answer, // The boolean value
          };
        } else {
          // Text-based Q&A question
          return {
            id: `generated_qa${index + 1}`,
            question: qa.q,
            type: 'text' as const,
            required: true,
            placeholder: 'Enter your answer',
            answer: qa.a, // Expected answer
          };
        }
      });

      return questions;
    } catch (timeoutError) {
      clearTimeout(timeoutId);
      throw timeoutError;
    }
  } catch (error) {
    console.error('Q&A generation error:', error);

    // Check if error is timeout
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏰ Request timed out after 3 minutes');
      console.error('The Q&A API is taking longer than expected. Please try again.');
    }

    return null;
  }
}

/**
 * Store generated questions in sessionStorage
 */
export function storeGeneratedQuestions(questions: GeneratedQuestion[]): void {
  try {
    sessionStorage.setItem('generatedQuestions', JSON.stringify(questions));
  } catch (error) {
    console.error('Failed to store generated questions:', error);
  }
}

/**
 * Retrieve generated questions from sessionStorage
 */
export function getGeneratedQuestions(): GeneratedQuestion[] | null {
  try {
    const stored = sessionStorage.getItem('generatedQuestions');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to retrieve generated questions:', error);
    return null;
  }
}

/**
 * Clear generated questions from sessionStorage
 */
export function clearGeneratedQuestions(): void {
  try {
    sessionStorage.removeItem('generatedQuestions');
  } catch (error) {
    console.error('Failed to clear generated questions:', error);
  }
}
