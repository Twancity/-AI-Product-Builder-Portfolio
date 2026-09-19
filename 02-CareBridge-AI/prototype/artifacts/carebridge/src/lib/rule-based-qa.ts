// src/lib/rule-based-qa.ts
import { mockPatients } from '../data/mock-data';

export interface QAResult {
  status: 'success' | 'unsupported' | 'empty';
  responseText: string;
  restatement?: string;
  evidence?: {
    patientName: string;
    documentTitle: string;
    sectionId: string;
    sectionTitle: string;
    version: string;
    approvalDate: string;
    instruction: string;
  };
  disclaimer: string;
  stopReason?: 'missing_guidance' | 'ambiguous_guidance' | 'conflicting_guidance' | 'diagnosis_or_treatment_change';
}

const FALLBACK_MESSAGE = "The demo instructions cannot answer this question. Clinical clarification would be needed.";
const DISCLAIMER = "No request was sent. No clinical team was notified.";

function stopReasonFor(question: string): NonNullable<QAResult['stopReason']> {
  if (/\b(diagnos|dose|medication|medicine|treatment|stop using|stop taking|safe to)\b/i.test(question)) {
    return 'diagnosis_or_treatment_change';
  }
  if (/\b(conflict|contradict|different instructions|which instruction)\b/i.test(question)) {
    return 'conflicting_guidance';
  }
  if (/\b(ambiguous|unclear|not sure what|what does this mean)\b/i.test(question)) {
    return 'ambiguous_guidance';
  }
  return 'missing_guidance';
}

const UNSAFE_PATTERNS = [
  /stop using/i,
  /change.*dose/i,
  /diagnose/i,
  /override/i,
  /ignore/i,
  /stop taking/i,
  /more medication/i,
  /less medication/i,
  /is it safe to/i,
  /can i stop/i,
  /stairs/i,
];

const WALKER_ALLOWLIST = [
  "do i need to use my walker",
  "when should i use my walker",
  "should i use my walker",
  "walker instructions",
  "how often should i use the walker",
  "use walker",
  "when to use walker",
  "do i have to use the walker",
  "do i have to use my walker",
];

export function evaluateQuestion(patientId: string, question: string): QAResult {
  if (!question || question.trim() === '') {
    return {
      status: 'empty',
      responseText: 'Please enter a question to ask.',
      disclaimer: DISCLAIMER,
    };
  }

  const normalized = question
    .toLowerCase()
    .trim()
    .replace(/[.,?!'"]/g, '')
    .replace(/\s+/g, ' ');

  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        status: 'unsupported',
        responseText: FALLBACK_MESSAGE,
        disclaimer: DISCLAIMER,
        stopReason: stopReasonFor(question),
      };
    }
  }

  const patient = mockPatients.find(p => p.id === patientId);
  if (!patient) {
    return {
      status: 'unsupported',
      responseText: FALLBACK_MESSAGE,
      disclaimer: DISCLAIMER,
      stopReason: stopReasonFor(question),
    };
  }

  if (patient.id === 'p1') {
    const isWalkerQuestion = WALKER_ALLOWLIST.includes(normalized);
    
    if (isWalkerQuestion) {
      const mobilitySection = patient.sections.find(s => s.id === 'mobility');
      if (mobilitySection && mobilitySection.content) {
        return {
          status: 'success',
          responseText: mobilitySection.content,
          evidence: {
            patientName: patient.name,
            documentTitle: patient.documentTitle,
            sectionId: mobilitySection.id,
            sectionTitle: mobilitySection.title,
            version: patient.version,
            approvalDate: patient.approvalDate,
            instruction: mobilitySection.content,
          },
          disclaimer: DISCLAIMER,
        };
      }
    }
  }

  return {
    status: 'unsupported',
    responseText: FALLBACK_MESSAGE,
    disclaimer: DISCLAIMER,
    stopReason: stopReasonFor(question),
  };
}
