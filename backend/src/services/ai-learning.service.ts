import OpenAI from 'openai';
import { PrismaClient, AIInteractionType, DifficultyLevel } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateQuizParams {
  topic: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  questionType?: string;
}

interface TutoringParams {
  studentId: string;
  subject: string;
  question: string;
  context?: string;
}

interface LearningPathParams {
  userId: string;
  targetRole: string;
  currentLevel: DifficultyLevel;
  interests?: string[];
  timeCommitment?: number; // hours per week
}

interface ContentAnalysisParams {
  content: string;
  fileType: string;
}

class AILearningService {
  /**
   * Generate quiz questions using AI
   */
  async generateQuiz(params: GenerateQuizParams) {
    const { topic, difficulty, questionCount, questionType = 'multiple_choice' } = params;

    const prompt = `Generate ${questionCount} ${questionType} quiz questions about "${topic}" at ${difficulty} difficulty level.

For each question, provide:
1. The question text
2. 4 answer options (for multiple choice)
3. The correct answer
4. A brief explanation

Format the response as JSON array with this structure:
[
  {
    "questionText": "question here",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "explanation here"
  }
]`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert educational content creator. Generate high-quality, pedagogically sound quiz questions.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '[]';
      const questions = JSON.parse(content);

      return questions;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw new Error('Failed to generate quiz questions');
    }
  }

  /**
   * AI Tutoring - Answer student questions
   */
  async provideTutoring(params: TutoringParams) {
    const { studentId, subject, question, context } = params;

    const systemPrompt = `You are an expert tutor specializing in ${subject}.
Your role is to help students understand concepts, not just give them answers.
Use the Socratic method when appropriate, and provide clear, step-by-step explanations.
Adapt your language to the student's level.`;

    const userPrompt = context
      ? `Context: ${context}\n\nStudent Question: ${question}`
      : `Student Question: ${question}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const answer = response.choices[0]?.message?.content || '';

      // Log interaction
      await prisma.aIInteraction.create({
        data: {
          userId: studentId,
          interactionType: 'TUTORING',
          input: question,
          output: answer,
          metadata: { subject, context },
          modelUsed: 'gpt-4',
          tokensUsed: response.usage?.total_tokens,
        },
      });

      return {
        answer,
        tokensUsed: response.usage?.total_tokens,
      };
    } catch (error) {
      console.error('Error in AI tutoring:', error);
      throw new Error('Failed to provide tutoring response');
    }
  }

  /**
   * Generate personalized learning path
   */
  async generateLearningPath(params: LearningPathParams) {
    const { userId, targetRole, currentLevel, interests = [], timeCommitment = 10 } = params;

    const prompt = `Create a personalized learning path for a student who wants to become a ${targetRole}.

Current Level: ${currentLevel}
Interests: ${interests.join(', ')}
Available Time: ${timeCommitment} hours per week

Provide a structured learning path with:
1. Recommended courses (by topic/skill)
2. Estimated timeline
3. Prerequisites and order of learning
4. Key skills to master at each stage

Format as JSON:
{
  "pathTitle": "title",
  "description": "description",
  "estimatedWeeks": number,
  "stages": [
    {
      "stage": "Beginner",
      "duration": "4 weeks",
      "courses": ["course topic 1", "course topic 2"],
      "skills": ["skill 1", "skill 2"]
    }
  ]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a career counselor and learning path expert. Create practical, achievable learning paths.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content || '{}';
      const pathData = JSON.parse(content);

      // Create learning path in database
      const learningPath = await prisma.learningPath.create({
        data: {
          userId,
          title: pathData.pathTitle,
          description: pathData.description,
          targetRole,
          difficultyLevel: currentLevel,
          estimatedHours: pathData.estimatedWeeks * timeCommitment,
          isAIGenerated: true,
        },
      });

      // Log interaction
      await prisma.aIInteraction.create({
        data: {
          userId,
          interactionType: 'LEARNING_PATH_RECOMMENDATION',
          input: JSON.stringify({ targetRole, currentLevel, interests }),
          output: JSON.stringify(pathData),
          metadata: { learningPathId: learningPath.id },
          modelUsed: 'gpt-4',
          tokensUsed: response.usage?.total_tokens,
        },
      });

      return {
        learningPath,
        pathData,
      };
    } catch (error) {
      console.error('Error generating learning path:', error);
      throw new Error('Failed to generate learning path');
    }
  }

  /**
   * Analyze content quality and educational value
   */
  async analyzeContent(params: ContentAnalysisParams) {
    const { content, fileType } = params;

    const prompt = `Analyze the following educational content and provide:
1. Quality Score (0-100)
2. Pedagogical Score (0-100) - How well it teaches
3. Accessibility Score (0-100) - How accessible it is
4. Suggested improvements
5. Target audience
6. Learning objectives identified

Content Type: ${fileType}
Content:
${content.substring(0, 3000)}

Respond in JSON format:
{
  "qualityScore": number,
  "pedagogicalScore": number,
  "accessibilityScore": number,
  "targetAudience": "string",
  "learningObjectives": ["objective1", "objective2"],
  "improvements": ["suggestion1", "suggestion2"],
  "readingLevel": "elementary|middle|high school|college|graduate"
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert in educational content analysis and instructional design.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return result;
    } catch (error) {
      console.error('Error analyzing content:', error);
      throw new Error('Failed to analyze content');
    }
  }

  /**
   * Check for plagiarism and copyright violations
   */
  async checkPlagiarism(content: string, title: string) {
    // In production, integrate with Turnitin API or similar service
    // For now, use AI to detect potential issues

    const prompt = `Analyze this educational content for potential plagiarism indicators:

Title: ${title}
Content: ${content.substring(0, 2000)}

Check for:
1. Unusual writing style changes
2. Overly formal or academic language inconsistencies
3. Potential copied sections
4. References without proper citation

Respond with JSON:
{
  "riskLevel": "low|medium|high",
  "concerns": ["concern1", "concern2"],
  "recommendations": ["recommendation1"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return result;
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      return { riskLevel: 'unknown', concerns: [], recommendations: [] };
    }
  }

  /**
   * Generate content summary
   */
  async generateSummary(content: string, maxLength: number = 200) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Summarize the following educational content in ${maxLength} words or less.`,
          },
          { role: 'user', content: content.substring(0, 4000) },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Translate educational content
   */
  async translateContent(content: string, targetLanguage: string) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Translate the following educational content to ${targetLanguage}. Preserve educational terminology and concepts accurately.`,
          },
          { role: 'user', content },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error translating content:', error);
      throw new Error('Failed to translate content');
    }
  }
}

export default new AILearningService();
