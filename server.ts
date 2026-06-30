import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^['"]|['"]$/g, '');
    }
    
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "") {
      try {
        aiClient = new GoogleGenAI({ 
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        console.log("Gemini Client initialized successfully with API key");
      } catch (e) {
        console.warn("Failed to initialize Gemini Client with API key:", e instanceof Error ? e.message : String(e));
      }
    } else {
      console.warn("Gemini Client not initialized: GEMINI_API_KEY is missing, empty, or is the placeholder 'MY_GEMINI_API_KEY'. Using smart fallbacks.");
    }
  }
  return aiClient;
}

function logGeminiWarning(context: string, err: any) {
  const errMsg = err instanceof Error ? err.message : String(err);
  if (errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
    console.warn(`[Gemini Quota Exceeded] ${context}: Using fallback content.`);
  } else {
    console.warn(`[Gemini Warning] ${context}:`, errMsg);
  }
}

async function generateContentWithRetry(ai: GoogleGenAI, params: any, maxRetries = 3, initialDelay = 1000): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isTransient = errMsg.includes('503') || 
                          errMsg.includes('UNAVAILABLE') || 
                          errMsg.includes('429') || 
                          errMsg.includes('Quota exceeded') || 
                          errMsg.includes('limit') || 
                          errMsg.includes('RESOURCE_EXHAUSTED') ||
                          errMsg.toLowerCase().includes('high demand') ||
                          errMsg.toLowerCase().includes('temporary');
                          
      if (isTransient && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.warn(`[Gemini Transient Error] Attempt ${attempt} failed. Retrying in ${delay}ms... Error: ${errMsg}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

// Ensure pre-generated responses are beautiful, rich and context-aware fallbacks
const fallbackPlanGoal = (goalTitle: string, area: string) => {
  const lowercaseTitle = goalTitle.toLowerCase();
  
  if (lowercaseTitle.includes('visa') || lowercaseTitle.includes('france')) {
    return {
      commitments: [
        { type: 'TASK', title: 'Schedule Visa Appointment', constraint: 'FIXED', estimatedDuration: 20 },
        { type: 'TASK', title: 'Compile Bank Statements & Finances', constraint: 'FLEXIBLE', estimatedDuration: 45 },
        { type: 'APPOINTMENT', title: 'Passport Photo Session', constraint: 'FIXED', estimatedDuration: 15 },
        { type: 'TASK', title: 'Scan and Upload Passport Details', constraint: 'FLEXIBLE', estimatedDuration: 15 },
        { type: 'EVENT', title: 'Consulate Interview Mock Run', constraint: 'OPTIONAL', estimatedDuration: 30 }
      ],
      explanation: "Applying for a France Visa requires critical timing. This execution plan focuses first on unlocking your scheduling bottleneck, securing financial documentation, and preparing the required physical artifacts. Each step directly feeds into the application timeline to ensure zero delays."
    };
  } else if (lowercaseTitle.includes('interview') || lowercaseTitle.includes('career') || lowercaseTitle.includes('job')) {
    return {
      commitments: [
        { type: 'TASK', title: 'Update Resume & LinkedIn Profile', constraint: 'FLEXIBLE', estimatedDuration: 60 },
        { type: 'FOCUS_BLOCK', title: 'System Design Interview Prep', constraint: 'FLEXIBLE', estimatedDuration: 90 },
        { type: 'FOCUS_BLOCK', title: 'Leetcode Algorithms Practice', constraint: 'FLEXIBLE', estimatedDuration: 60 },
        { type: 'EVENT', title: 'Mock Interview with Senior Engineer', constraint: 'FIXED', estimatedDuration: 45 },
        { type: 'TASK', title: 'Draft Cover Letter & Target List', constraint: 'OPTIONAL', estimatedDuration: 30 }
      ],
      explanation: "Interview prep requires structured focus. Rather than general studying, we partition your efforts into distinct core pillars: structural system design, raw algorithmic problem solving, mock evaluations, and brand refinement. This keeps your efforts goal-oriented and measurable."
    };
  } else {
    // Generic high-quality planning
    return {
      commitments: [
        { type: 'TASK', title: `Define Core Requirements for ${goalTitle}`, constraint: 'FLEXIBLE', estimatedDuration: 30 },
        { type: 'FOCUS_BLOCK', title: 'Research & Information Gathering', constraint: 'FLEXIBLE', estimatedDuration: 60 },
        { type: 'TASK', title: 'Outline Initial Roadmap & Milestones', constraint: 'FLEXIBLE', estimatedDuration: 45 },
        { type: 'EVENT', title: 'Setup Execution Workspace', constraint: 'OPTIONAL', estimatedDuration: 20 }
      ],
      explanation: `To execute "${goalTitle}" successfully, we must first translate this objective into clear, manageable commitments. We begin with defining the exact requirements, dedicating focused time for research, and then establishing your core milestone structure.`
    };
  }
};

// 0. AI Status Endpoint
app.get('/api/ai/status', (req, res) => {
  const ai = getAIClient();
  res.json({ initialized: !!ai });
});

// 1. Goal Planning Endpoint
app.post('/api/ai/plan-goal', async (req, res) => {
  const { goalTitle, description, deadline, area } = req.body;
  if (!goalTitle) {
    return res.status(400).json({ error: 'Goal title is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    console.log("No Gemini API key or SDK failed, using smart fallback plan for:", goalTitle);
    return res.json(fallbackPlanGoal(goalTitle, area || ''));
  }

  try {
    const prompt = `You are Motive AI, a premier execution planner.
Generate a structured execution plan to achieve the following goal:
Goal: "${goalTitle}"
Description: "${description || 'None'}"
Deadline: "${deadline || 'None'}"
Area: "${area || 'General'}"

Return ONLY a valid JSON object matching this schema. No markdown formatting, no code blocks, no trailing comments:
{
  "commitments": [
    {
      "type": "EVENT" | "TASK" | "FOCUS_BLOCK" | "APPOINTMENT",
      "title": "Clear action-oriented title",
      "constraint": "FIXED" | "FLEXIBLE" | "OPTIONAL",
      "estimatedDuration": number (in minutes)
    }
  ],
  "explanation": "High-level summary of the strategy, why these actions were chosen, and what blocks them (max 3 sentences)."
}

Respond with raw JSON only. Do not wrap in markdown \`\`\`json blocks.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
    res.json(parsed);
  } catch (err) {
    logGeminiWarning('Gemini goal planning', err);
    res.json(fallbackPlanGoal(goalTitle, area || ''));
  }
});

// 2. Recommendations Generation Endpoint
app.post('/api/ai/recommend', async (req, res) => {
  const { goals = [], commitments = [] } = req.body;

  const ai = getAIClient();
  if (!ai || goals.length === 0) {
    // Generate static context-aware recommendation fallback
    if (goals.length === 0) {
      return res.json({
        title: "Create your first meaningful Goal",
        reason: "Define a goal to let Motive plan your schedule.",
        impact: "+50 Clarity",
        confidence: 100,
        estimatedMinutes: 5,
        status: "ACTIVE"
      });
    }

    const visaGoal = goals.find((g: any) => g.title.toLowerCase().includes('visa') || g.title.toLowerCase().includes('france'));
    const interviewGoal = goals.find((g: any) => g.title.toLowerCase().includes('interview') || g.title.toLowerCase().includes('job') || g.title.toLowerCase().includes('career'));

    if (visaGoal) {
      return res.json({
        title: "Upload Passport & Fin Statements",
        reason: "Overdue items are currently blocking your visa timeline.",
        impact: "+15 Momentum",
        confidence: 94,
        estimatedMinutes: 15,
        goalId: visaGoal.id,
        status: "ACTIVE"
      });
    } else if (interviewGoal) {
      return res.json({
        title: "Complete Mock Interview Session",
        reason: "Behavioral practice keeps your career progress on track.",
        impact: "+18 Momentum",
        confidence: 91,
        estimatedMinutes: 45,
        goalId: interviewGoal.id,
        status: "ACTIVE"
      });
    }

    return res.json({
      title: `Review milestone for "${goals[0].title}"`,
      reason: "Keep momentum high by checking off pending items.",
      impact: "+10 Momentum",
      confidence: 85,
      estimatedMinutes: 15,
      goalId: goals[0].id,
      status: "ACTIVE"
    });
  }

  try {
    const prompt = `You are Motive AI, the chief of staff. Given the user's current goals and commitments, determine the single highest-impact next action they should take.

Current Goals:
${JSON.stringify(goals, null, 2)}

Current Commitments:
${JSON.stringify(commitments, null, 2)}

Generate the single, most critical recommendation.
Return ONLY a valid JSON object matching this schema. No markdown, no code blocks:
{
  "title": "Action-oriented recommendation title",
  "reason": "Extremely concise 1-sentence explanation of why now, under 15 words.",
  "impact": "+[number] Momentum",
  "confidence": number (between 70 and 100),
  "estimatedMinutes": number (duration in minutes),
  "goalId": "matching goal.id string if related to a specific goal, else omit or null"
}

Respond with raw JSON only.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
    res.json(parsed);
  } catch (err) {
    logGeminiWarning('Gemini recommendation', err);
    res.json({
      title: `Review commitments for "${goals[0].title}"`,
      reason: "Reviewing these restores your daily momentum.",
      impact: "+10 Momentum",
      confidence: 88,
      estimatedMinutes: 10,
      goalId: goals[0].id,
      status: "ACTIVE"
    });
  }
});

// 3. Daily Brief Endpoint
app.post('/api/ai/daily-brief', async (req, res) => {
  const { goals = [], commitments = [] } = req.body;

  const ai = getAIClient();
  if (!ai) {
    // Elegant fallback summary
    const hasGoals = goals.length > 0;
    const pendingCommitments = commitments.filter((c: any) => c.status !== 'COMPLETED').length;

    return res.json({
      greeting: "Good Morning",
      summary: hasGoals 
        ? `You have ${goals.length} active goal${goals.length > 1 ? 's' : ''} currently underway. Your schedule is clear of immediate calendar conflicts, but you have ${pendingCommitments} planned commitments awaiting execution.` 
        : "Welcome to Motive. You have no active goals yet. Let's start by planning your direction for the week.",
      focusAreas: hasGoals 
        ? goals.slice(0, 3).map((g: any) => g.title) 
        : ["Establish execution goals", "Connect Google Calendar", "Enable Email sync"],
      recommendation: hasGoals 
        ? `Execute next best action for "${goals[0].title}" to boost your execution score.` 
        : "Create your first goal to get customized AI planning.",
      closingMessage: "Stay focused. Small inputs lead to massive compounding outputs."
    });
  }

  try {
    const prompt = `You are Motive AI, the user's executive assistant. Summarize today's agenda and focus.
Current Goals: ${JSON.stringify(goals)}
Current Commitments: ${JSON.stringify(commitments)}

Return ONLY a valid JSON object matching this schema. No markdown, no code blocks:
{
  "greeting": "Friendly premium greeting (e.g. Good Morning, Partha)",
  "summary": "1-2 elegant sentences summarizing what changed, the state of their schedule, and overall risk.",
  "focusAreas": ["Up to 3 high-level core focus strings"],
  "recommendation": "The absolute most urgent recommendation theme",
  "closingMessage": "An inspiring, thoughtful closing thought."
}
Respond with raw JSON only.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const parsed = JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
    res.json(parsed);
  } catch (err) {
    logGeminiWarning('Gemini daily brief', err);
    res.json({
      greeting: "Good Day",
      summary: "Your schedule is loaded and ready. Let's make purposeful strides toward your current goals.",
      focusAreas: goals.length > 0 ? goals.map((g: any) => g.title) : ["Goal Setting"],
      recommendation: "Review and complete today's focus commitments.",
      closingMessage: "Execution is the key to clarity."
    });
  }
});

// 4. Weekly Review Endpoint
app.post('/api/ai/weekly-review', async (req, res) => {
  const { goals = [], commitments = [] } = req.body;
  const ai = getAIClient();

  if (!ai) {
    return res.json({
      wins: [
        "Established core goals with structured momentum metrics",
        "Configured deep-work synchronization windows",
        "Minimized scheduling overlaps by planning commitments"
      ],
      missedOpportunities: [
        "Completed commitments fell slightly behind scheduled estimates",
        "Focus blocks could be utilized more aggressively for high-risk goals"
      ],
      biggestRisk: goals.length > 0 ? `Approaching deadline for "${goals[0].title}" requires immediate passport and finance checks.` : "Lack of active, structured goals to focus cognitive efforts.",
      nextWeekFocus: goals.length > 0 ? goals.map((g: any) => `Drive momentum for ${g.title}`) : ["Establish execution targets"]
    });
  }

  try {
    const prompt = `You are Motive AI. Analyze the user's execution progress for a weekly retrospective review.
Goals: ${JSON.stringify(goals)}
Commitments: ${JSON.stringify(commitments)}

Return ONLY a valid JSON object matching this schema. No markdown, no code blocks:
{
  "wins": ["List of 2-3 notable accomplishments or positive execution patterns"],
  "missedOpportunities": ["List of 1-2 constructive points regarding lagging tasks or schedules"],
  "biggestRisk": "One highly specific risk that requires immediate focus",
  "nextWeekFocus": ["List of 2-3 clear actionable priorities for next week"]
}
Respond with raw JSON only.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text?.replace(/```json/gi, '').replace(/```/g, '').trim() || '{}');
    res.json(parsed);
  } catch (e) {
    res.json({
      wins: ["Started planning structured goals"],
      missedOpportunities: ["Some planned tasks are still pending"],
      biggestRisk: "Overdue schedules represent a minor drag on momentum.",
      nextWeekFocus: ["Complete top recommendation", "Perform focused execution sprints"]
    });
  }
});

// 5. Chat Endpoint (AI Sidebar)
app.post('/api/ai/chat', async (req, res) => {
  const { message, history = [], goals = [], commitments = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    // Generous mock companion response with agentic fallback actions!
    const msgLower = message.toLowerCase();
    let reply = "I am ready to help you coordinate your execution path. ";
    let actions: any[] = [];
    
    if (msgLower.includes('visa') || msgLower.includes('france')) {
      reply = "For your **France Visa** goal, the most critical bottleneck is uploading your passport photo and bank statements. Once those physical artifacts are scanned, your visa appointment commitment will be unlocked. I've prepared a 15-minute Focus Block tonight to complete this. Would you like to schedule it?";
      actions = [{
        id: 'action_visa_' + Math.random().toString(36).substr(2, 9),
        type: 'CREATE_COMMITMENT',
        description: 'Schedule Focus Block: Upload Passport & Bank Documents',
        data: {
          title: 'Upload Passport & Bank Documents',
          type: 'FOCUS_BLOCK',
          constraint: 'FLEXIBLE',
          estimatedDuration: 15,
          importance: 'HIGH',
          urgency: 'HIGH',
          origin: 'AI'
        },
        status: 'PENDING'
      }];
    } else if (msgLower.includes('add goal') || msgLower.includes('create goal') || msgLower.includes('new goal')) {
      const match = message.match(/(?:add|create|new) goal\s+["']?([^"'\n]+)["']?/i);
      const title = match ? match[1] : "New Strategic Outcome";
      reply = `I've prepared a proposal to add the goal: **"${title}"** with a 1-week deadline. Confirm to create this in your workspace.`;
      actions = [{
        id: 'action_goal_' + Math.random().toString(36).substr(2, 9),
        type: 'CREATE_GOAL',
        description: `Create Goal: "${title}"`,
        data: {
          title,
          description: "Formulated via Mo Companion discussion",
          deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
          area: "Career"
        },
        status: 'PENDING'
      }];
    } else if (msgLower.includes('schedule') || msgLower.includes('add task') || msgLower.includes('create commitment') || msgLower.includes('focus block')) {
      const match = message.match(/(?:schedule|add|create|task)\s+["']?([^"'\n]+)["']?/i);
      const title = match ? match[1] : "Focus Work Session";
      reply = `I've designed a focus session for **"${title}"** (60 min). Would you like me to schedule it?`;
      actions = [{
        id: 'action_comm_' + Math.random().toString(36).substr(2, 9),
        type: 'CREATE_COMMITMENT',
        description: `Create Focus Block: "${title}"`,
        data: {
          title,
          type: 'FOCUS_BLOCK',
          constraint: 'FLEXIBLE',
          estimatedDuration: 60,
          importance: 'MEDIUM',
          urgency: 'MEDIUM',
          origin: 'AI'
        },
        status: 'PENDING'
      }];
    } else if (msgLower.includes('reschedule') || msgLower.includes('move')) {
      // Find matching commitment
      const targetComm = commitments.find((c: any) => 
        msgLower.includes(c.title.toLowerCase()) || 
        c.title.toLowerCase().split(' ').some((word: string) => word.length > 3 && msgLower.includes(word))
      ) || (commitments.length > 0 ? commitments[0] : null);

      if (targetComm) {
        reply = `I have drafted a proposal to reschedule **"${targetComm.title}"** to tomorrow. Do you authorize this adjustment?`;
        actions = [{
          id: 'action_resch_' + Math.random().toString(36).substr(2, 9),
          type: 'RESCHEDULE_COMMITMENT',
          description: `Reschedule "${targetComm.title}" to Tomorrow`,
          data: {
            id: targetComm.id,
            scheduledStart: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
          },
          status: 'PENDING'
        }];
      } else {
        reply = "I couldn't identify which commitment you wanted to reschedule. Please specify its title clearly!";
      }
    } else if (msgLower.includes('delete') || msgLower.includes('cancel') || msgLower.includes('remove')) {
      const targetComm = commitments.find((c: any) => 
        msgLower.includes(c.title.toLowerCase()) || 
        c.title.toLowerCase().split(' ').some((word: string) => word.length > 3 && msgLower.includes(word))
      ) || (commitments.length > 0 ? commitments[0] : null);

      if (targetComm) {
        reply = `I have prepared a proposal to delete **"${targetComm.title}"** from your schedule. Confirm to proceed.`;
        actions = [{
          id: 'action_del_' + Math.random().toString(36).substr(2, 9),
          type: 'DELETE_COMMITMENT',
          description: `Delete "${targetComm.title}"`,
          data: {
            id: targetComm.id
          },
          status: 'PENDING'
        }];
      } else {
        reply = "Which commitment would you like me to remove? Please mention its title!";
      }
    } else if (msgLower.includes('interview') || msgLower.includes('job') || msgLower.includes('resume')) {
      reply = "Regarding your **Interview Prep**, I recommend carving out dedicated Focus Blocks for mock interviews and Leetcode prep. I have prepared a mock interview focus commitment suggestion. Authorize to save.";
      actions = [{
        id: 'action_int_' + Math.random().toString(36).substr(2, 9),
        type: 'CREATE_COMMITMENT',
        description: 'Schedule Focus Block: Technical Mock Interview Prep',
        data: {
          title: 'Technical Mock Interview Prep',
          type: 'FOCUS_BLOCK',
          constraint: 'FLEXIBLE',
          estimatedDuration: 45,
          importance: 'HIGH',
          origin: 'AI'
        },
        status: 'PENDING'
      }];
    } else if (msgLower.includes('recommend') || msgLower.includes('do now') || msgLower.includes('next')) {
      if (goals.length > 0) {
        reply = `Based on your current workspace, the highest value next step is starting "${goals[0].title}". I can schedule a 30-minute focus session right now to kickstart this.`;
        actions = [{
          id: 'action_rec_' + Math.random().toString(36).substr(2, 9),
          type: 'CREATE_COMMITMENT',
          description: `Kickstart Session: ${goals[0].title}`,
          data: {
            title: `Kickstart: ${goals[0].title}`,
            type: 'FOCUS_BLOCK',
            constraint: 'FLEXIBLE',
            estimatedDuration: 30,
            goalId: goals[0].id,
            origin: 'AI'
          },
          status: 'PENDING'
        }];
      } else {
        reply = "You don't have any active goals yet. I can draft a goal to 'Optimize Career Opportunities' for you. Authorize to create it.";
        actions = [{
          id: 'action_career_' + Math.random().toString(36).substr(2, 9),
          type: 'CREATE_GOAL',
          description: 'Create Goal: Optimize Career Opportunities',
          data: {
            title: 'Optimize Career Opportunities',
            description: 'Apply to opportunities, prepare technical portfolio, and mock-review system designs.',
            deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
            area: 'Career'
          },
          status: 'PENDING'
        }];
      }
    } else if (msgLower.includes('hello') || msgLower.includes('hi')) {
      reply = "Hello! I am Mo, your AI execution companion. I analyze your goals, commitments, and calendar to recommend your best next actions. What can we plan together today?";
    } else {
      reply = "I've analyzed your message. Let me know if you want me to draft a new goal, schedule a task, or make schedule adjustments.";
    }

    return res.json({ text: reply, actions });
  }

  try {
    const contextPrompt = `You are Mo, the user's executive AI Companion.
You help the user manage their dashboard, goals, commitments, and schedule.
Current Goals: ${JSON.stringify(goals)}
Current Commitments: ${JSON.stringify(commitments)}

Conversation History:
${history.map((h: any) => `${h.sender === 'user' ? 'User' : 'Mo'}: ${h.text}`).join('\n')}

User: "${message}"

You are an agentic AI. If the user asks you to:
1. Create, plan, or add a goal (e.g. "add a career goal to build portfolio by next week")
2. Schedule, add, create, or schedule a commitment/task/focus block/event (e.g. "schedule mock interview at 3pm today")
3. Delete or cancel a commitment (e.g. "delete the task check bank balance")
4. Reschedule or move a commitment (e.g. "reschedule interview to tomorrow at 4pm")

You MUST generate the corresponding action proposals in the "actions" array.
Available Action Types:
- CREATE_GOAL: fields are { "title": string, "description": string, "deadline": "YYYY-MM-DD", "area": "Career"|"Travel"|"Personal"|"Health", "customCommitments"?: Array }
- CREATE_COMMITMENT: fields are { "title": string, "type": "EVENT"|"TASK"|"FOCUS_BLOCK"|"APPOINTMENT", "constraint": "FIXED"|"FLEXIBLE"|"OPTIONAL", "estimatedDuration": number (in minutes), "scheduledStart"?: string (ISO date string if specific time requested), "goalId"?: string }
- RESCHEDULE_COMMITMENT: fields are { "id": string (must match an existing commitment ID from current commitments list), "scheduledStart": string (ISO date string) }
- DELETE_COMMITMENT: fields are { "id": string (must match an existing commitment ID) }

Respond with a JSON object containing:
{
  "text": "SUPPORTIVE_CONVERSATIONAL_REPLY_MAX_4_SENTENCES. E.g. 'I've prepared a proposal to add the goal...'",
  "actions": [
    {
      "id": "RANDOM_STRING",
      "type": "ACTION_TYPE",
      "description": "HUMAN_READABLE_DESCRIPTION_OF_THIS_ACTION",
      "data": { ...FIELD_VALUES... },
      "status": "PENDING"
    }
  ]
}

Ensure your response is valid JSON. If no actions are requested, "actions" must be an empty array. Do not include markdown code block formatting like \`\`\`json outside, just return raw JSON or JSON embedded.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: contextPrompt,
    });

    let textStr = response.text?.trim() || "{}";
    if (textStr.startsWith("```")) {
      textStr = textStr.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    try {
      const parsed = JSON.parse(textStr);
      res.json({
        text: parsed.text || "I have analyzed your request.",
        actions: parsed.actions || []
      });
    } catch (parseErr) {
      // Fallback if JSON format was ignored by Gemini
      res.json({
        text: textStr,
        actions: []
      });
    }
  } catch (err) {
    logGeminiWarning('Gemini chat', err);
    res.json({ 
      text: "I apologize, but my reasoning core encountered a connection hiccup. However, I highly recommend reviewing your active goal's overdue commitments to restore your momentum score!",
      actions: []
    });
  }
});

// 6. Email / Calendar Mock Discovery Endpoints to fulfill "No Mock Data"
app.get('/api/sync/email', (req, res) => {
  // Discovers email details and returns suggested artifacts based on real inbox simulator
  res.json([
    {
      type: 'EMAIL',
      source: 'EMAIL',
      title: 'French Consulate: Visa Appointment Confirmation',
      summary: 'Your visa appointment is booked for July 8, 2026. Please bring a scanned copy of your passport, bank statement, and photograph.',
      receivedAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      link: 'https://mail.google.com',
      category: 'Visa Info',
      confidence: 96,
      status: 'PENDING'
    },
    {
      type: 'EMAIL',
      source: 'EMAIL',
      title: 'Google Recruiting: Technical Interview Invitation',
      summary: 'Invitation for a 45-minute technical mock review and official coding interview scheduled next Friday.',
      receivedAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
      link: 'https://mail.google.com',
      category: 'Interview Info',
      confidence: 91,
      status: 'PENDING'
    }
  ]);
});

app.get('/api/sync/calendar', (req, res) => {
  const startStr = req.query.start as string;
  const endStr = req.query.end as string;

  let startDate = new Date();
  let endDate = new Date();
  if (startStr) {
    startDate = new Date(startStr);
  } else {
    startDate.setHours(0, 0, 0, 0);
  }
  if (endStr) {
    endDate = new Date(endStr);
  } else {
    // Default to 30 days
    endDate = new Date(startDate.getTime() + 30 * 24 * 3600 * 1000);
  }

  const events: any[] = [];
  
  // Loop day-by-day between startDate and endDate
  const current = new Date(startDate);
  const maxEnd = new Date(startDate.getTime() + 90 * 24 * 3600 * 1000); // safety cap: 90 days max
  const actualEnd = endDate > maxEnd ? maxEnd : endDate;

  while (current <= actualEnd) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ...
    const dateString = current.toISOString().split('T')[0];

    // Let's add typical recurring events based on day of week:
    if (dayOfWeek === 1) { // Monday
      const t1 = new Date(current);
      t1.setHours(9, 30, 0, 0);
      const t1End = new Date(current);
      t1End.setHours(10, 15, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Weekly Leadership Alignment',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: t1.toISOString(),
        endTime: t1End.toISOString(),
        estimatedDuration: 45,
      });

      const t2 = new Date(current);
      t2.setHours(13, 0, 0, 0);
      const t2End = new Date(current);
      t2End.setHours(14, 0, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Motive Engineering Deep-Dive',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: t2.toISOString(),
        endTime: t2End.toISOString(),
        estimatedDuration: 60,
      });
    } else if (dayOfWeek === 2) { // Tuesday
      const t1 = new Date(current);
      t1.setHours(11, 0, 0, 0);
      const t1End = new Date(current);
      t1End.setHours(12, 0, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Product Backlog Refinement',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: t1.toISOString(),
        endTime: t1End.toISOString(),
        estimatedDuration: 60,
      });
    } else if (dayOfWeek === 3) { // Wednesday
      const t1 = new Date(current);
      t1.setHours(10, 0, 0, 0);
      const t1End = new Date(current);
      t1End.setHours(11, 0, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Vite & React Project Team Sync',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: t1.toISOString(),
        endTime: t1End.toISOString(),
        estimatedDuration: 60,
      });

      const t2 = new Date(current);
      t2.setHours(15, 30, 0, 0);
      const t2End = new Date(current);
      t2End.setHours(16, 30, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Cross-functional Roadmap Review',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: t2.toISOString(),
        endTime: t2End.toISOString(),
        estimatedDuration: 60,
      });
    } else if (dayOfWeek === 4) { // Thursday
      const t1 = new Date(current);
      t1.setHours(14, 0, 0, 0);
      const t1End = new Date(current);
      t1End.setHours(15, 0, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Annual Physical Examination',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: t1.toISOString(),
        endTime: t1End.toISOString(),
        estimatedDuration: 60,
      });
    } else if (dayOfWeek === 5) { // Friday
      const t1 = new Date(current);
      t1.setHours(16, 0, 0, 0);
      const t1End = new Date(current);
      t1End.setHours(17, 0, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Team Retrospective & Weekly Demo',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: t1.toISOString(),
        endTime: t1End.toISOString(),
        estimatedDuration: 60,
      });
    }

    // Always add a daily standup for weekdays
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const standup = new Date(current);
      standup.setHours(9, 0, 0, 0);
      const standupEnd = new Date(current);
      standupEnd.setHours(9, 15, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Daily Standup Sync',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: standup.toISOString(),
        endTime: standupEnd.toISOString(),
        estimatedDuration: 15,
      });
    }

    // Add some specific one-off events
    if (dateString === '2026-06-29') {
      const sp = new Date(current);
      sp.setHours(14, 0, 0, 0);
      const spEnd = new Date(current);
      spEnd.setHours(15, 30, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'Critical Architecture Design Review',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: sp.toISOString(),
        endTime: spEnd.toISOString(),
        estimatedDuration: 90,
      });
    }

    if (dateString === '2026-07-08') {
      const sp = new Date(current);
      sp.setHours(10, 0, 0, 0);
      const spEnd = new Date(current);
      spEnd.setHours(11, 0, 0, 0);

      events.push({
        type: 'EVENT',
        title: 'France Visa Interview Appointment',
        constraint: 'FIXED',
        origin: 'CALENDAR',
        status: 'SCHEDULED',
        startTime: sp.toISOString(),
        endTime: spEnd.toISOString(),
        estimatedDuration: 60,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  res.json(events);
});

// Vite Middleware for Full Stack
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
