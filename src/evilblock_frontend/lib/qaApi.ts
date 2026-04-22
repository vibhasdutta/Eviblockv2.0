/**
 * Q&A Generation API Integration
 * Calls external API to generate questions from uploaded documents
 */
import { perf, PerfCategory } from './perf';

export interface QAGenerationResponse {
  success: boolean;
  data?: {
    questions: Array<{
      q: string;
      a?: string; // May be hidden in quiz mode
      type: 'qa' | 'true_false';
      correct_answer?: boolean; // Only for true_false type
      question_id: string;
    }>;
    session_id?: string;
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
  sessionId?: string;
}

export interface VerificationResult {
  success: boolean;
  is_correct: boolean;
  score: number;
  feedback: string;
  method_used: string;
}

function normalizeQuestionText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeQuestionType(value: unknown): 'text' | 'boolean' {
  return value === 'true_false' || value === 'boolean' ? 'boolean' : 'text';
}

function normalizeQuestionId(value: unknown, fallbackIndex: number): string {
  const normalized = normalizeQuestionText(value);
  return normalized || `q${fallbackIndex}`;
}

export function normalizeGeneratedQuestion(
  raw: any,
  fallbackIndex: number,
  sessionId?: string
): GeneratedQuestion | null {
  const questionText = normalizeQuestionText(
    raw?.question ?? raw?.q ?? raw?.prompt ?? raw?.text ?? raw?.label
  );

  if (!questionText) {
    return null;
  }

  const type = normalizeQuestionType(raw?.type);

  return {
    id: normalizeQuestionId(raw?.question_id ?? raw?.id, fallbackIndex),
    question: questionText,
    type,
    required: raw?.required !== false,
    placeholder: normalizeQuestionText(raw?.placeholder) || undefined,
    options: type === 'boolean' ? ['True', 'False'] : undefined,
    answer: normalizeQuestionText(raw?.answer ?? raw?.a) || undefined,
    correctAnswer: typeof raw?.correct_answer === 'boolean' ? raw.correct_answer : undefined,
    sessionId: normalizeQuestionText(raw?.sessionId) || sessionId || undefined,
  };
}

export function normalizeGeneratedQuestions(rawQuestions: unknown): GeneratedQuestion[] {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .map((rawQuestion, index) => normalizeGeneratedQuestion(rawQuestion, index))
    .filter((question): question is GeneratedQuestion => question !== null);
}

/**
 * Generate questions from a document file using streaming
 * @param file - PDF or image file to analyze
 * @param numQuestions - Number of questions to generate (1-50, default: 5)
 * @param onEvent - Callback for SSE events
 */
export async function streamGenerateQuestions(
  file: File,
  numQuestions: number = 5,
  onEvent: (type: string, data: any) => void
): Promise<void> {
  const endTotal = perf.start('QA Stream Generate (total)', PerfCategory.QA_API, { fileName: file.name, numQuestions });

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_questions', numQuestions.toString());
    formData.append('quiz_mode', 'true'); // Always quiz mode for verification
    formData.append('ocr_strategy', 'hi_res');
    formData.append('languages', 'eng');

    const endFetch = perf.start('QA Stream Connect', PerfCategory.QA_API);
    const response = await fetch('/api/qa/generate-questions', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      endFetch('error');
      throw new Error(`Failed to connect to stream: ${response.statusText}`);
    }
    endFetch('success');

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response body is null');

    const decoder = new TextDecoder();
    let buffer = '';
    let questionCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');
        let event = 'message';
        let data = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            event = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            data += line.slice(6).trim();
          }
        }

        if (data) {
          try {
            const jsonData = JSON.parse(data);
            if (event === 'question') questionCount++;
            onEvent(event, jsonData);
          } catch (e) {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }
    endTotal('success');
  } catch (error) {
    console.error('Streaming Q&A error:', error);
    endTotal('error');
    onEvent('error', { message: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Verify a user's answer against the API
 */
export async function verifyAnswer(
  sessionId: string,
  questionId: string,
  userAnswer: string
): Promise<VerificationResult | null> {
  return perf.track('QA Verify Answer', PerfCategory.QA_API, async () => {
    const response = await fetch('/api/qa/verify-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        question_id: questionId,
        user_answer: userAnswer,
        method: 'both'
      }),
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    return await response.json();
  }, { questionId });
}

/**
 * Generate questions from a document file (Legacy REST wrapper)
 */
export async function generateQuestions(
  file: File,
  numQuestions: number = 5
): Promise<GeneratedQuestion[] | null> {
  return new Promise((resolve) => {
    let questions: GeneratedQuestion[] = [];
    let sessionId = '';

    streamGenerateQuestions(file, numQuestions, (type, data) => {
      if (type === 'info' && data.session_id) {
        sessionId = data.session_id;
      } else if (type === 'question') {
        const normalizedQuestion = normalizeGeneratedQuestion(data, questions.length, sessionId);
        if (normalizedQuestion) {
          questions.push(normalizedQuestion);
        } else {
          console.warn('Skipping malformed generated question:', data);
        }
      } else if (type === 'done') {
        resolve(questions);
      } else if (type === 'error') {
        resolve(null);
      }
    });
  });
}

/**
 * Store generated questions in sessionStorage
 */
export function storeGeneratedQuestions(questions: GeneratedQuestion[]): void {
  try {
    const normalizedQuestions = normalizeGeneratedQuestions(questions);
    sessionStorage.setItem('generatedQuestions', JSON.stringify(normalizedQuestions));
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
    return normalizeGeneratedQuestions(JSON.parse(stored));
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
    sessionStorage.removeItem('qaSessionId');
  } catch (error) {
    console.error('Failed to clear generated questions:', error);
  }
}
