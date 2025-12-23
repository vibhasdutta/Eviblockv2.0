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
    }>;
  };
  error?: string;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  type: 'text';
  required: boolean;
  placeholder?: string;
  answer?: string; // Store the expected answer for validation if needed
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
      console.error('QA_API_URL environment variable not set');
      return null;
    }

    // Validate number of questions
    const validNumQuestions = Math.min(Math.max(numQuestions, 1), 50);

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_questions', validNumQuestions.toString());

    // Call the Q&A generation API
    const response = await fetch(`${apiUrl}/generate-questions`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result: QAGenerationResponse = await response.json();

    if (!result.success || !result.data?.questions) {
      throw new Error(result.error || 'Failed to generate questions');
    }

    // Transform API response to internal question format
    const questions: GeneratedQuestion[] = result.data.questions.map((qa, index) => ({
      id: `generated_q${index + 1}`,
      question: qa.q,
      type: 'text' as const,
      required: true,
      placeholder: 'Enter your answer',
      answer: qa.a, // Store expected answer for potential validation
    }));

    return questions;
  } catch (error) {
    console.error('Q&A generation error:', error);
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
