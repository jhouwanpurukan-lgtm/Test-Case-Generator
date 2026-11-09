'use strict';
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

// ─────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const REQUEST_TIMEOUT_MS = 55000; // 55 seconds

/**
 * Returns true only when a non-placeholder Gemini API key is present.
 * Never exposes the key itself.
 */
function isGeminiAvailable() {
  return (
    typeof GEMINI_API_KEY === 'string' &&
    GEMINI_API_KEY.trim().length > 10 &&
    !GEMINI_API_KEY.includes('your_gemini_api_key')
  );
}

/**
 * Create a Gemini client.  Throws if key is missing so callers can catch
 * and fall back to mock.
 */
function createClient() {
  if (!isGeminiAvailable()) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Call Gemini with a timeout wrapper.
 * Gemini SDK does not natively support timeout, so we race with a rejection.
 */
async function callGeminiWithTimeout(client, prompt) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini API request timed out after 55 seconds')), REQUEST_TIMEOUT_MS)
  );

  const apiCall = client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  });

  const response = await Promise.race([apiCall, timeoutPromise]);
  return response.text;
}

/**
 * Parse a JSON string returned by Gemini.
 * Strips markdown code fences if present.
 */
function parseGeminiJSON(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty response from Gemini API');
  }
  // Strip ```json ... ``` or ``` ... ``` fences
  let cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Invalid JSON from Gemini: ${cleaned.slice(0, 200)}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// A.  TEST CASE GENERATION
// ─────────────────────────────────────────────────────────────────

function buildGenerationPrompt(req) {
  return `You are a senior QA engineer and software testing expert. Your task is to generate comprehensive, structured software test cases based on the provided requirement.

CONTEXT:
- Project: ${req.project_name || 'N/A'}
- Module: ${req.module_name || 'N/A'}
- Feature: ${req.feature_name || 'N/A'}
- Testing Type Requested: ${req.testing_type || 'Functional'}
- Priority Level: ${req.priority || 'Medium'}

REQUIREMENT DESCRIPTION:
${req.requirement_description}

${req.user_story ? `USER STORY:\n${req.user_story}` : ''}

INSTRUCTIONS:
1. Generate between 12 and 20 test cases that are directly relevant to the requirement above.
2. Do NOT invent features or behaviors not described in the requirement.
3. Cover ALL of the following test types where applicable: Positive, Negative, Boundary, Edge Case, Functional, Validation${req.testing_type === 'Security' ? ', Security' : ''}.
4. If the requirement mentions authentication, passwords, or user accounts — also include Security test cases.
5. Each test case must be specific to this requirement, not generic.
6. State assumptions in the preconditions field when information is insufficient.
7. Test steps must be numbered, clear, and actionable.

RESPOND ONLY with a valid JSON object in this exact structure (no markdown, no explanation):
{
  "requirement_summary": "One-sentence summary of what is being tested",
  "test_cases": [
    {
      "test_scenario": "Scenario group name",
      "title": "Specific, descriptive test case title",
      "description": "What this test case verifies and why it is important",
      "preconditions": "What must be true before test execution",
      "test_steps": "1. Step one\\n2. Step two\\n3. Step three",
      "test_data": "Specific input values, credentials, or data used",
      "expected_result": "Exact expected system behavior or output",
      "priority": "High",
      "test_type": "Positive"
    }
  ]
}

Priority values: High | Medium | Low
Test type values: Positive | Negative | Boundary | Edge Case | Functional | Validation | Security`;
}

async function generateWithGemini(requirementData) {
  const client = createClient();
  const prompt  = buildGenerationPrompt(requirementData);

  console.log(`[AI] Calling Gemini (${GEMINI_MODEL}) for test case generation…`);
  const raw = await callGeminiWithTimeout(client, prompt);
  const parsed = parseGeminiJSON(raw);

  if (!Array.isArray(parsed.test_cases) || parsed.test_cases.length === 0) {
    throw new Error('Gemini returned no test cases');
  }

  // Validate each test case has required fields
  const valid = parsed.test_cases.filter(tc =>
    tc.title && tc.test_steps && tc.expected_result
  );
  if (valid.length === 0) {
    throw new Error('No valid test cases in Gemini response');
  }

  console.log(`[AI] Gemini generated ${valid.length} test cases.`);
  return {
    testCases: valid,
    mode: 'gemini',
    model: GEMINI_MODEL,
    requirement_summary: parsed.requirement_summary || '',
  };
}

// ─────────────────────────────────────────────────────────────────
// B.  REQUIREMENT ANALYSIS
// ─────────────────────────────────────────────────────────────────

function buildAnalysisPrompt(req) {
  return `You are a senior QA consultant and business analyst. Analyze the following software requirement and provide a detailed testing assessment.

REQUIREMENT:
Project: ${req.project_name || 'N/A'}
Module: ${req.module_name || 'N/A'}
Feature: ${req.feature_name || 'N/A'}
Description: ${req.requirement_description}
User Story: ${req.user_story || 'Not provided'}

Perform a thorough analysis and respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "requirement_summary": "2-3 sentence summary of what the requirement asks for",
  "clarity_score": 7,
  "clarity_analysis": "Explanation of the clarity score — what is well-defined and what is vague",
  "identified_gaps": [
    "Specific missing detail 1",
    "Specific missing detail 2"
  ],
  "missing_information": [
    "Information needed for complete testing 1",
    "Information needed for complete testing 2"
  ],
  "ambiguities": [
    "Ambiguous statement 1 and why it is ambiguous",
    "Ambiguous statement 2"
  ],
  "potential_risks": [
    "Risk 1 — what could go wrong",
    "Risk 2"
  ],
  "suggested_scenarios": [
    "Additional test scenario 1",
    "Additional test scenario 2",
    "Additional test scenario 3"
  ],
  "priority_recommendations": "Explanation of which test types to prioritize and why",
  "testing_recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "overall_recommendation": "Comprehensive overall assessment and next steps"
}

clarity_score: integer from 1 (completely unclear) to 10 (perfectly clear and complete).`;
}

async function analyzeWithGemini(requirementData) {
  const client = createClient();
  const prompt  = buildAnalysisPrompt(requirementData);

  console.log(`[AI] Calling Gemini (${GEMINI_MODEL}) for requirement analysis…`);
  const raw = await callGeminiWithTimeout(client, prompt);
  const parsed = parseGeminiJSON(raw);

  if (typeof parsed.clarity_score !== 'number') {
    throw new Error('Gemini analysis missing clarity_score');
  }

  return { ...parsed, mode: 'gemini', model: GEMINI_MODEL };
}

// ─────────────────────────────────────────────────────────────────
// C.  IMPROVE / REFINE EXISTING TEST CASES
// ─────────────────────────────────────────────────────────────────

async function improveTestCasesWithGemini(testCases, context) {
  const client = createClient();

  const prompt = `You are a senior QA engineer. Review and improve the following test cases for the requirement described below.

REQUIREMENT CONTEXT:
${context.requirement_description || ''}
Feature: ${context.feature_name || 'N/A'}

EXISTING TEST CASES:
${JSON.stringify(testCases, null, 2)}

INSTRUCTIONS:
1. Keep all original test cases but improve their quality.
2. Fix vague test steps — make them specific and actionable.
3. Improve expected results to be precise and measurable.
4. Add missing preconditions.
5. Suggest up to 3 additional test cases if there are gaps.
6. Do NOT change the test_case_id field.

Respond ONLY with valid JSON (no markdown):
{
  "improved_test_cases": [ /* same structure as input, with improvements */ ],
  "new_test_cases": [ /* up to 3 additional TCs if gaps exist, same structure but without test_case_id */ ],
  "improvement_summary": "Summary of what was improved and why"
}`;

  console.log(`[AI] Calling Gemini to improve ${testCases.length} test cases…`);
  const raw = await callGeminiWithTimeout(client, prompt);
  const parsed = parseGeminiJSON(raw);

  if (!Array.isArray(parsed.improved_test_cases)) {
    throw new Error('Gemini improvement response missing improved_test_cases');
  }

  return { ...parsed, mode: 'gemini', model: GEMINI_MODEL };
}

// ─────────────────────────────────────────────────────────────────
// D.  AI CHAT / ASSISTANT
// ─────────────────────────────────────────────────────────────────

async function chatWithGemini(userMessage, context) {
  const client = createClient();

  const systemContext = `You are an expert QA engineer and software testing assistant integrated into a Test Case Generator platform.
You help users with: test case creation, requirement analysis, testing strategies, bug reporting, and QA best practices.
Context from the user's current project: ${JSON.stringify(context || {})}.
Be concise, practical, and specific. When suggesting test cases, use structured format.`;

  const prompt = `${systemContext}\n\nUser question: ${userMessage}`;

  console.log('[AI] Calling Gemini for chat response…');
  const response = await Promise.race([
    client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { temperature: 0.6, maxOutputTokens: 2048 },
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Chat request timed out')), REQUEST_TIMEOUT_MS)),
  ]);

  return {
    response: response.text,
    mode: 'gemini',
    model: GEMINI_MODEL,
  };
}

// ─────────────────────────────────────────────────────────────────
// MOCK FALLBACK — clearly labeled, used only when Gemini is unavailable
// ─────────────────────────────────────────────────────────────────

function generateMockTestCases(requirementData) {
  const { module_name, feature_name, requirement_description, testing_type, priority } = requirementData;
  const featureLabel = feature_name || module_name || 'Feature';
  const desc = (requirement_description || '').toLowerCase();

  const assumptions = [
    'Application is accessible and the test environment is configured.',
    desc.includes('login') || desc.includes('auth') ? 'Authentication system is available and test user accounts exist.' : '',
    desc.includes('database') || desc.includes('data') ? 'Database is populated with appropriate test data.' : '',
  ].filter(Boolean).join(' ');

  const base = [
    { test_scenario:`${featureLabel} – Positive`, title:`Verify ${featureLabel} with valid inputs`, description:`Verify core functionality works with valid data.`, preconditions:assumptions, test_steps:`1. Navigate to ${featureLabel}\n2. Enter valid input data\n3. Submit the action\n4. Verify the result`, test_data:`Valid inputs as per requirement`, expected_result:`Operation completes successfully. System shows confirmation.`, priority:priority||'High', test_type:'Positive' },
    { test_scenario:`${featureLabel} – Functional`, title:`Verify primary functionality of ${featureLabel}`, description:`Confirm core described behavior operates as specified.`, preconditions:assumptions, test_steps:`1. Set up prerequisites\n2. Perform the primary action\n3. Verify the outcome\n4. Confirm no errors`, test_data:`Standard test data for ${featureLabel}`, expected_result:`Feature performs as described. All outputs are correct.`, priority:priority||'High', test_type:'Functional' },
    { test_scenario:`${featureLabel} – Negative`, title:`Verify ${featureLabel} rejects invalid inputs`, description:`Verify error messages appear for invalid input.`, preconditions:assumptions, test_steps:`1. Navigate to ${featureLabel}\n2. Enter invalid data\n3. Submit\n4. Check error handling`, test_data:`Invalid: empty values, special characters, out-of-range data`, expected_result:`System shows a clear error message. Operation is not processed.`, priority:'High', test_type:'Negative' },
    { test_scenario:`${featureLabel} – Validation`, title:`Verify required fields cannot be empty`, description:`Ensure mandatory field validation prevents empty submission.`, preconditions:assumptions, test_steps:`1. Navigate to ${featureLabel}\n2. Leave required fields empty\n3. Submit\n4. Verify validation messages`, test_data:`All required fields empty`, expected_result:`Submission prevented. Each required field shows a validation error.`, priority:'High', test_type:'Validation' },
    { test_scenario:`${featureLabel} – Negative`, title:`Verify graceful error handling on server failure`, description:`Test application behavior on unexpected server errors.`, preconditions:`${assumptions} Server error condition simulated.`, test_steps:`1. Simulate server failure\n2. Attempt to use ${featureLabel}\n3. Observe behavior\n4. Check error message`, test_data:`Simulated server error`, expected_result:`User-friendly error message shown. App does not crash. Retry is possible.`, priority:'Medium', test_type:'Negative' },
    { test_scenario:`${featureLabel} – Boundary`, title:`Verify minimum boundary value is accepted`, description:`Test minimum valid boundary.`, preconditions:assumptions, test_steps:`1. Navigate\n2. Enter minimum valid value\n3. Submit\n4. Verify`, test_data:`Minimum valid boundary value`, expected_result:`System accepts minimum value and processes successfully.`, priority:'Medium', test_type:'Boundary' },
    { test_scenario:`${featureLabel} – Boundary`, title:`Verify maximum boundary value is accepted`, description:`Test maximum valid boundary.`, preconditions:assumptions, test_steps:`1. Navigate\n2. Enter maximum valid value\n3. Submit\n4. Verify`, test_data:`Maximum valid boundary value`, expected_result:`System accepts maximum value and processes successfully.`, priority:'Medium', test_type:'Boundary' },
    { test_scenario:`${featureLabel} – Boundary`, title:`Verify value above maximum boundary is rejected`, description:`Test that exceeding maximum is rejected.`, preconditions:assumptions, test_steps:`1. Navigate\n2. Enter value one unit above maximum\n3. Submit\n4. Check error`, test_data:`Maximum value + 1`, expected_result:`System rejects input and shows a boundary validation error.`, priority:'Medium', test_type:'Boundary' },
    { test_scenario:`${featureLabel} – Edge Case`, title:`Verify behavior with special characters in input`, description:`Test XSS and injection resistance.`, preconditions:assumptions, test_steps:`1. Navigate\n2. Enter: <script>alert('xss')</script>, ' OR '1'='1\n3. Submit\n4. Observe`, test_data:`<script>alert('xss')</script>, ' OR '1'='1, --`, expected_result:`Input sanitized or rejected. No script execution. Error shown.`, priority:'High', test_type:'Edge Case' },
    { test_scenario:`${featureLabel} – Edge Case`, title:`Verify behavior with extremely long input`, description:`Test 10,000+ character string handling.`, preconditions:assumptions, test_steps:`1. Navigate\n2. Enter 10,000+ character string\n3. Submit\n4. Observe`, test_data:`String of 10,000+ characters`, expected_result:`System accepts within limits or rejects with character limit error.`, priority:'Low', test_type:'Edge Case' },
    { test_scenario:`${featureLabel} – Edge Case`, title:`Verify whitespace-only input treated as empty`, description:`Spaces-only input should fail required field validation.`, preconditions:assumptions, test_steps:`1. Navigate\n2. Enter only spaces in required fields\n3. Submit\n4. Check validation`, test_data:`"   " (spaces only)`, expected_result:`Treated as empty. Required field validation error shown.`, priority:'Medium', test_type:'Edge Case' },
    { test_scenario:`${featureLabel} – Functional`, title:`Verify data persists after successful operation`, description:`Confirm submitted data is saved and retrievable.`, preconditions:assumptions, test_steps:`1. Complete operation successfully\n2. Refresh page\n3. Return and verify data\n4. Confirm integrity`, test_data:`Previously submitted valid data`, expected_result:`Data persists correctly and is accurately displayed.`, priority:'High', test_type:'Functional' },
    { test_scenario:`${featureLabel} – Validation`, title:`Verify business rule enforcement`, description:`Test business rules are enforced.`, preconditions:assumptions, test_steps:`1. Navigate\n2. Violate a business rule\n3. Submit\n4. Verify enforcement`, test_data:`Data violating business rules`, expected_result:`Business rule enforced with descriptive error message.`, priority:priority||'High', test_type:'Validation' },
  ];

  if (desc.includes('login') || desc.includes('auth') || desc.includes('password') || desc.includes('user')) {
    base.push(
      { test_scenario:`${featureLabel} – Authentication`, title:`Verify invalid credentials are rejected`, description:`Ensure incorrect credentials deny access.`, preconditions:`Authentication system active. Valid user account exists.`, test_steps:`1. Navigate to login\n2. Enter wrong password\n3. Click Login\n4. Observe response`, test_data:`Email: validuser@test.com, Password: WrongPass123`, expected_result:`"Invalid credentials" error shown. Access denied.`, priority:'High', test_type:'Negative' },
      { test_scenario:`${featureLabel} – Authentication`, title:`Verify successful login with valid credentials`, description:`Confirm valid credentials grant access.`, preconditions:`Registered user account with known credentials.`, test_steps:`1. Navigate to login\n2. Enter valid email and password\n3. Click Login\n4. Verify dashboard redirect`, test_data:`Email: validuser@test.com, Password: ValidPass123!`, expected_result:`User authenticated and redirected to dashboard.`, priority:'High', test_type:'Positive' }
    );
  }

  if (desc.includes('search') || desc.includes('filter') || desc.includes('find')) {
    base.push(
      { test_scenario:`${featureLabel} – Search`, title:`Verify search returns correct results`, description:`Test search accuracy.`, preconditions:`${assumptions} Test data exists.`, test_steps:`1. Navigate to search\n2. Enter known valid term\n3. Execute\n4. Verify results`, test_data:`Known valid search term`, expected_result:`Matching results displayed accurately.`, priority:'Medium', test_type:'Functional' },
      { test_scenario:`${featureLabel} – Search`, title:`Verify no-results message for unknown search terms`, description:`Test empty state for non-existent search.`, preconditions:`${assumptions} Search term does not exist.`, test_steps:`1. Navigate to search\n2. Enter non-existent term\n3. Execute\n4. Observe`, test_data:`"zzz_nonexistent_xyz_abc"`, expected_result:`"No results found" message shown. No errors.`, priority:'Low', test_type:'Negative' }
    );
  }

  return { testCases: base, mode: 'mock' };
}

function getMockAnalysis(req) {
  const desc = req.requirement_description || '';
  const wordCount = desc.split(/\s+/).filter(Boolean).length;
  const clarityScore = Math.min(10, Math.max(2, Math.floor(wordCount / 12) + 2));

  return {
    mode: 'mock',
    requirement_summary: `This requirement describes the ${req.feature_name || 'feature'} functionality within the ${req.module_name || 'module'} module.`,
    clarity_score: clarityScore,
    clarity_analysis: `The requirement contains ${wordCount} words. ${wordCount < 30 ? 'Very brief — significantly more detail needed for reliable test generation.' : wordCount < 100 ? 'Moderate detail. Consider expanding with acceptance criteria and edge cases.' : 'Good level of detail suitable for test case generation.'}`,
    identified_gaps: [
      !req.user_story ? 'No user story provided — acceptance criteria are missing' : null,
      wordCount < 50 ? 'Functional behavior and expected outputs are not fully described' : null,
      'Non-functional requirements (performance, scalability) not mentioned',
    ].filter(Boolean),
    missing_information: [
      'Performance and load testing thresholds not specified',
      'Security requirements not explicitly stated',
      'Integration dependencies and third-party systems not mentioned',
      'Data retention and cleanup policies not defined',
    ],
    ambiguities: [
      'Success and failure criteria are not explicitly defined',
      'Edge case behavior for unusual inputs is not described',
      'Behavior under concurrent access is not specified',
    ],
    potential_risks: [
      'Incomplete requirement may lead to insufficient test coverage',
      'Missing security requirements could expose vulnerabilities',
    ],
    suggested_scenarios: [
      'Test concurrent user access (race conditions)',
      'Test system behavior under high load',
      'Test cross-browser and cross-device compatibility',
      'Test session expiration and timeout handling',
      'Test accessibility compliance (WCAG 2.1)',
    ],
    priority_recommendations: `Prioritize Functional and Validation testing first (High), then Negative and Boundary (Medium), Edge Cases last (Low).`,
    testing_recommendations: [
      'Add explicit acceptance criteria to the user story',
      'Define field-level validation rules before generating test cases',
      'Clarify error message wording expected by the application',
    ],
    overall_recommendation: `This requirement is ready for basic test case generation but would benefit from more detail. Focus on happy-path and key validation scenarios first. ⚠ This is a rule-based mock analysis — configure GEMINI_API_KEY for AI-powered analysis.`,
  };
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

async function generateTestCases(requirementData) {
  if (isGeminiAvailable()) {
    try {
      return await generateWithGemini(requirementData);
    } catch (err) {
      console.error('[AI] Gemini generation failed, falling back to mock:', err.message);
      return { ...generateMockTestCases(requirementData), fallback_reason: err.message };
    }
  }
  console.log('[AI] GEMINI_API_KEY not configured — using mock generation.');
  return generateMockTestCases(requirementData);
}

async function analyzeRequirement(requirementData) {
  if (isGeminiAvailable()) {
    try {
      return await analyzeWithGemini(requirementData);
    } catch (err) {
      console.error('[AI] Gemini analysis failed, falling back to mock:', err.message);
      return { ...getMockAnalysis(requirementData), fallback_reason: err.message };
    }
  }
  console.log('[AI] GEMINI_API_KEY not configured — using mock analysis.');
  return getMockAnalysis(requirementData);
}

async function improveTestCases(testCases, context) {
  if (!isGeminiAvailable()) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to backend/.env to use this feature.');
  }
  return await improveTestCasesWithGemini(testCases, context);
}

async function aiChat(userMessage, context) {
  if (!isGeminiAvailable()) {
    throw new Error('GEMINI_API_KEY is not configured. Please add it to backend/.env to use the AI chat feature.');
  }
  return await chatWithGemini(userMessage, context);
}

function getAIStatus() {
  return {
    gemini_available: isGeminiAvailable(),
    model: isGeminiAvailable() ? GEMINI_MODEL : null,
    mode: isGeminiAvailable() ? 'gemini' : 'mock',
    message: isGeminiAvailable()
      ? `Connected to Google Gemini (${GEMINI_MODEL})`
      : 'Mock mode active — add GEMINI_API_KEY to backend/.env to enable real AI',
  };
}

module.exports = {
  generateTestCases,
  analyzeRequirement,
  improveTestCases,
  aiChat,
  getAIStatus,
  isGeminiAvailable,
  // Legacy alias kept for any code still referencing old name
  isRealAIAvailable: isGeminiAvailable,
};
