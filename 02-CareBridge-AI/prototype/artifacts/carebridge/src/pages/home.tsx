import { useState, useMemo, useRef } from 'react';
import { mockPatients } from '../data/mock-data';
import { AlertCircle, FileText, Activity, Clock, ShieldAlert, ChevronRight, CheckCircle2, MessageSquare, Cpu, Network, Link2Off, RefreshCw, Send, History, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { evaluateQuestion, QAResult } from '../lib/rule-based-qa';
import { useCreateCareBridgeExplanation, useCreateCareBridgeHandoff, useListCareBridgeHandoffs, useUpdateCareBridgeHandoffStatus, useGetCareBridgeTeachBack, useCreateCareBridgeTeachBackAssessment, getGetCareBridgeTeachBackQueryKey } from '@workspace/api-client-react';
import type { CareBridgeExplanationResult, CareBridgeHandoffResult, CareBridgeHandoffInputDemoScenario, CareBridgeHandoffInput } from '@workspace/api-client-react';

function getDemoSessionId() {
  const existing = window.sessionStorage.getItem('carebridge-demo-session');
  if (existing) return existing;
  const created = `demo-session-${crypto.randomUUID()}`;
  window.sessionStorage.setItem('carebridge-demo-session', created);
  return created;
}

const STOP_REASON_LABELS = {
  missing_guidance: 'Required guidance is missing',
  ambiguous_guidance: 'Guidance is ambiguous',
  conflicting_guidance: 'Guidance is conflicting',
  diagnosis_or_treatment_change: 'Diagnosis or treatment change requested',
} as const;

const REVIEW_STATUS_LABELS = {
  delivery_not_confirmed: 'Delivery not confirmed',
  awaiting_review: 'Delivered — awaiting simulated review',
  acknowledged: 'Simulated reviewer acknowledged',
  response_available: 'Illustrative response available',
  clarification_required: 'Clarification required',
} as const;

const TEACH_BACK_HANDOFF_QUESTION =
  'Teach-back clarification requested for the walker instruction.';

export default function Home() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(mockPatients[0].id);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isRetrieved, setIsRetrieved] = useState<boolean>(false);
  const [retrievalTimestamp, setRetrievalTimestamp] = useState<Date | null>(null);

  const [questionText, setQuestionText] = useState("");
  const [qaResult, setQaResult] = useState<QAResult | null>(null);

  const createExplanation = useCreateCareBridgeExplanation();
  const [aiExplanation, setAiExplanation] = useState<CareBridgeExplanationResult | null>(null);
  const explanationRequestRef = useRef(0);
  const [demoSessionId] = useState(getDemoSessionId);
  const [demoScenario, setDemoScenario] = useState<CareBridgeHandoffInputDemoScenario>('delivered');
  const [handoffResult, setHandoffResult] = useState<CareBridgeHandoffResult | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const handoffRequestRef = useRef(0);
  const handoffPendingRef = useRef(false);
  const handoffIdempotencyKeyRef = useRef<string | null>(null);
  const createHandoff = useCreateCareBridgeHandoff();
  const updateHandoffStatus = useUpdateCareBridgeHandoffStatus();
  const [responseFixture, setResponseFixture] = useState<'current' | 'superseded' | 'unverified'>('current');
  const handoffHistory = useListCareBridgeHandoffs(
    { sessionId: demoSessionId, patientId: selectedPatientId },
  );

  const [isTeachBackOpen, setIsTeachBackOpen] = useState(false);
  const [teachBackInput, setTeachBackInput] = useState('');
  const [teachBackSkipped, setTeachBackSkipped] = useState(false);
  const [isRetryingTeachBack, setIsRetryingTeachBack] = useState(false);

  const teachBackEligible = Boolean(
    qaResult?.status === 'success' &&
    qaResult.evidence?.sectionId &&
    qaResult.evidence.version,
  );
  const teachBackParams = {
    sessionId: demoSessionId,
    patientId: selectedPatientId,
    sectionId: qaResult?.evidence?.sectionId ?? 'unavailable',
    sourceVersion: qaResult?.evidence?.version ?? 'unavailable',
  };

  const teachBackQuery = useGetCareBridgeTeachBack(
    teachBackParams,
    {
      query: {
        enabled: teachBackEligible,
        queryKey: getGetCareBridgeTeachBackQueryKey(teachBackParams),
      },
    },
  );

  const createTeachBack = useCreateCareBridgeTeachBackAssessment();
  const teachBackIdempotencyKeyRef = useRef<string | null>(null);
  const teachBackRequestRef = useRef(0);
  const teachBackActivity =
    createTeachBack.data?.patientId === teachBackParams.patientId &&
    createTeachBack.data.sectionId === teachBackParams.sectionId &&
    createTeachBack.data.sourceVersion === teachBackParams.sourceVersion
      ? createTeachBack.data
      : teachBackQuery.data?.activity ?? null;

  const resetTeachBackState = () => {
    teachBackRequestRef.current += 1;
    teachBackIdempotencyKeyRef.current = null;
    createTeachBack.reset();
    setIsTeachBackOpen(false);
    setTeachBackSkipped(false);
    setIsRetryingTeachBack(false);
    setTeachBackInput('');
  };

  const handleTeachBackSubmit = () => {
    if (!teachBackEligible || !teachBackInput.trim()) return;
    const currentRequest = ++teachBackRequestRef.current;

    if (!teachBackIdempotencyKeyRef.current) {
        teachBackIdempotencyKeyRef.current = `tb-${crypto.randomUUID()}`;
    }

    createTeachBack.mutate({
      data: {
        ...teachBackParams,
        idempotencyKey: teachBackIdempotencyKeyRef.current,
        answer: teachBackInput
      }
    }, {
      onSuccess: () => {
        if (teachBackRequestRef.current !== currentRequest) return;
        setTeachBackInput('');
        teachBackIdempotencyKeyRef.current = null;
        setIsRetryingTeachBack(false);
        void teachBackQuery.refetch();
      }
    });
  };

  const selectedPatient = useMemo(
    () => mockPatients.find((p) => p.id === selectedPatientId),
    [selectedPatientId]
  );

  const selectedSection = useMemo(
    () => selectedPatient?.sections.find((s) => s.id === selectedSectionId),
    [selectedPatientId, selectedSectionId, selectedPatient]
  );

  const handlePatientChange = (id: string) => {
    setSelectedPatientId(id);
    setSelectedSectionId(null);
    setIsRetrieved(false);
    setRetrievalTimestamp(null);
    setQuestionText("");
    setQaResult(null);
    setAiExplanation(null);
    explanationRequestRef.current += 1;
    setHandoffResult(null);
    setHandoffError(null);
    handoffRequestRef.current += 1;
    handoffIdempotencyKeyRef.current = null;
    resetTeachBackState();
  };

  const handleSectionSelect = (id: string) => {
    setSelectedSectionId(id);
    setIsRetrieved(false);
    setRetrievalTimestamp(null);
    setAiExplanation(null);
    explanationRequestRef.current += 1;
    resetTeachBackState();
  };

  const handleRetrieve = () => {
    if (!selectedSectionId) return;
    setIsRetrieved(true);
    setRetrievalTimestamp(new Date());
  };

  const handleAsk = (textToAsk: string) => {
    if (!selectedPatientId) return;
    setAiExplanation(null);
    explanationRequestRef.current += 1;
    const result = evaluateQuestion(selectedPatientId, textToAsk);
    setQaResult(result);
    setHandoffResult(null);
    setHandoffError(null);
    handoffRequestRef.current += 1;
    handoffIdempotencyKeyRef.current = null;
    resetTeachBackState();
  };

  const handleCreateHandoff = (reviewRequestId?: string, isTeachBackHandoff: boolean = false) => {
    if (handoffPendingRef.current) return;
    if (!isTeachBackHandoff && (!qaResult || qaResult.status !== 'unsupported' || !questionText.trim())) return;

    handoffPendingRef.current = true;
    const currentRequest = ++handoffRequestRef.current;
    setHandoffError(null);
    const idempotencyKey = reviewRequestId
      ? `demo-retry-${crypto.randomUUID()}`
      : handoffIdempotencyKeyRef.current ?? `demo-submit-${crypto.randomUUID()}`;
    if (!reviewRequestId) handoffIdempotencyKeyRef.current = idempotencyKey;

    const data: CareBridgeHandoffInput = isTeachBackHandoff && teachBackEligible ? {
        sessionId: demoSessionId,
        idempotencyKey,
        patientId: selectedPatientId,
        question: TEACH_BACK_HANDOFF_QUESTION,
        demoScenario,
        reviewRequestId: reviewRequestId ?? null,
        origin: 'teach_back_confusion',
        sectionId: teachBackParams.sectionId,
        sourceVersion: teachBackParams.sourceVersion,
    } : {
        sessionId: demoSessionId,
        idempotencyKey,
        patientId: selectedPatientId,
        question: questionText,
        demoScenario,
        reviewRequestId: reviewRequestId ?? null,
    };

    createHandoff.mutate({
      data,
    }, {
      onSuccess: (data) => {
        handoffPendingRef.current = false;
        if (handoffRequestRef.current !== currentRequest) return;
        setHandoffResult(data);
        if (!reviewRequestId) handoffIdempotencyKeyRef.current = null;
        void handoffHistory.refetch();
      },
      onError: () => {
        handoffPendingRef.current = false;
        if (handoffRequestRef.current !== currentRequest) return;
        setHandoffError('The demo review request could not be recorded. Delivery was not confirmed.');
      },
    });
  };

  const handleStatusUpdate = (
    action: 'acknowledge' | 'make_response_available',
    target: CareBridgeHandoffResult | null = handoffResult,
  ) => {
    if (!target) return;
    const currentRequest = ++handoffRequestRef.current;
    updateHandoffStatus.mutate({
      reviewRequestId: target.reviewRequestId,
      data: {
        sessionId: demoSessionId,
        patientId: selectedPatientId,
        idempotencyKey: `demo-status-${crypto.randomUUID()}`,
        action,
        responseFixture: action === 'make_response_available' ? responseFixture : null,
      },
    }, {
      onSuccess: (data) => {
        if (handoffRequestRef.current !== currentRequest) return;
        setHandoffResult(data);
        void handoffHistory.refetch();
      },
      onError: () => {
        if (handoffRequestRef.current !== currentRequest) return;
        setHandoffError('That demo status transition was not allowed. The request was not changed.');
      },
    });
  };

  const handleRequestExplanation = () => {
    const evidenceSectionId = qaResult?.evidence?.sectionId;
    if (!selectedPatientId || !evidenceSectionId || !questionText) return;
    
    const currentReq = ++explanationRequestRef.current;
    setAiExplanation(null);
    
    createExplanation.mutate({
      data: {
        patientId: selectedPatientId,
        sectionId: evidenceSectionId,
        question: questionText,
      }
    }, {
      onSuccess: (data) => {
        if (explanationRequestRef.current === currentReq) {
          setAiExplanation(data);
        }
      },
      onError: (error) => {
        if (explanationRequestRef.current === currentReq) {
          setAiExplanation(prev => ({
             status: 'error',
             code: 'provider_error',
             message: 'An unexpected error occurred while communicating with the API.',
             explanation: null,
             source: null,
             retryable: prev ? prev.attempts < 2 : true,
             attempts: prev ? prev.attempts + 1 : 1,
             provider: 'gemini_user_key',
             liveModelVerified: false,
             handoffNotice: 'No request was sent. No clinical team was notified.'
          } as CareBridgeExplanationResult));
        }
      }
    });
  };

  const EXAMPLE_QUESTIONS = [
    "When should I use my walker?",
    "Can I stop using the walker?",
    "How to use stairs?",
  ];

  return (
    <div className="min-h-[100dvh] bg-background pb-12">
      {/* Persistent Safety Banner */}
      <div className="bg-destructive text-destructive-foreground px-4 py-3 sticky top-0 z-50 flex items-center justify-center text-center shadow-md">
        <ShieldAlert className="w-5 h-5 mr-2 shrink-0" />
        <p className="font-semibold text-sm sm:text-base">
          Educational prototype — fictional data only. Not for clinical use. Do not enter real patient information.
        </p>
      </div>

      <main className="max-w-4xl mx-auto px-4 pt-8 sm:pt-12">
        <header className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 flex items-center justify-center sm:justify-start">
            <Activity className="w-8 h-8 mr-3 text-primary" />
            CareBridge
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            A patient discharge guidance prototype. Select a fictional scenario to see how instructions are retrieved and presented.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Navigation / Selection Column */}
          <div className="md:col-span-5 space-y-8">
            <section aria-labelledby="scenario-heading">
              <h2 id="scenario-heading" className="text-xl font-semibold mb-4 text-foreground">
                1. Select Patient Scenario
              </h2>
              <div className="space-y-3">
                {mockPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handlePatientChange(patient.id)}
                    data-testid={`button-patient-${patient.id}`}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      selectedPatientId === patient.id
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                    }`}
                    aria-pressed={selectedPatientId === patient.id}
                  >
                    <div className="font-semibold text-foreground">{patient.name}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {patient.documentTitle}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {selectedPatient && (
              <section aria-labelledby="section-heading" className="animate-in fade-in slide-in-from-left-4 duration-300">
                <h2 id="section-heading" className="text-xl font-semibold mb-4 text-foreground">
                  2. Browse by Topic
                </h2>
                <div className="space-y-2">
                  {selectedPatient.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionSelect(section.id)}
                      data-testid={`button-section-${section.id}`}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        selectedSectionId === section.id
                          ? 'border-primary bg-primary text-primary-foreground shadow-md'
                          : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50 text-foreground'
                      }`}
                      aria-pressed={selectedSectionId === section.id}
                    >
                      <span className="font-medium">{section.title}</span>
                      <ChevronRight className={`w-5 h-5 ${selectedSectionId === section.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Results Column */}
          <div className="md:col-span-7">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              3. Retrieved Guidance
            </h2>
            
            <div className="bg-card rounded-2xl border border-border shadow-sm min-h-[400px] flex flex-col overflow-hidden transition-all">
              {!selectedSectionId ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground animate-in fade-in duration-500">
                  <FileText className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium text-foreground/80">No Topic Selected</p>
                  <p className="max-w-xs mt-2 text-sm">Select a topic from the left to begin.</p>
                </div>
              ) : !isRetrieved ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground animate-in fade-in duration-300">
                  <Activity className="w-16 h-16 mb-4 text-primary/20" />
                  <h3 className="text-xl font-medium text-foreground mb-2">Topic Selected: {selectedSection?.title}</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Click below to retrieve the stored instructions from the synthetic demo source.
                  </p>
                  <button
                    onClick={handleRetrieve}
                    data-testid="button-retrieve"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex items-center"
                  >
                    Retrieve exact instruction
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Metadata Header */}
                  <div className="bg-muted/40 border-b border-border p-4 sm:p-6">
                    <h3 className="font-semibold text-lg text-foreground mb-4">Metadata</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-muted-foreground">
                      <div>
                        <strong className="text-foreground/80 block text-xs uppercase tracking-wider mb-0.5">Fictional patient</strong>
                        <span data-testid="text-meta-patient">{selectedPatient?.name}</span>
                      </div>
                      <div>
                        <strong className="text-foreground/80 block text-xs uppercase tracking-wider mb-0.5">Document title</strong>
                        <span data-testid="text-meta-title">{selectedPatient?.documentTitle}</span>
                      </div>
                      <div>
                        <strong className="text-foreground/80 block text-xs uppercase tracking-wider mb-0.5">Section</strong>
                        <span data-testid="text-meta-section">{selectedSection?.title}</span>
                      </div>
                      <div>
                        <strong className="text-foreground/80 block text-xs uppercase tracking-wider mb-0.5">Version</strong>
                        <span data-testid="text-meta-version">{selectedPatient?.version}</span>
                      </div>
                      <div>
                        <strong className="text-foreground/80 block text-xs uppercase tracking-wider mb-0.5">Simulated approval date</strong>
                        <span data-testid="text-meta-date">{selectedPatient && format(new Date(selectedPatient.approvalDate), 'MMM d, yyyy')}</span>
                      </div>
                      <div>
                        <strong className="text-foreground/80 block text-xs uppercase tracking-wider mb-0.5">Retrieval timestamp</strong>
                        <span data-testid="text-meta-timestamp">{retrievalTimestamp && format(retrievalTimestamp, 'h:mm:ss a (MMM d, yyyy)')}</span>
                      </div>
                      <div className="sm:col-span-2 mt-2 pt-2 border-t border-border/50">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-secondary-border">
                          Synthetic demo source — not clinician-approved or verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6 sm:p-8 flex-1 bg-white dark:bg-card">
                    {selectedSection?.content ? (
                      <div className="space-y-4">
                        <div className="flex items-start text-primary mb-2">
                          <CheckCircle2 className="w-6 h-6 mr-3 shrink-0 mt-0.5" />
                          <h4 className="font-medium text-lg">Instruction found</h4>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-lg sm:text-xl text-foreground font-medium leading-relaxed shadow-inner" data-testid="text-retrieved-content">
                          "{selectedSection.content}"
                        </div>
                        <p className="text-sm text-muted-foreground italic mt-6 border-t border-border pt-4">
                          * Please note this is simulated guidance from a fictional document. Always consult your healthcare provider for real medical advice.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 h-full flex flex-col justify-center">
                        <div className="flex items-start text-amber-700 dark:text-amber-500 mb-4">
                          <AlertCircle className="w-6 h-6 mr-3 shrink-0" />
                          <h4 className="font-semibold text-lg">Information Not Found</h4>
                        </div>
                        <p className="text-amber-900 dark:text-amber-200 text-base sm:text-lg mb-4" data-testid="text-retrieved-not-found">
                          The synthetic demo source does not answer this question. Clinical clarification would be needed.
                        </p>
                        <p className="text-amber-700/80 dark:text-amber-500/80 text-sm">
                          This prototype is designed to explicitly refuse to generate answers if the data is not present in the synthetic document, preventing unsafe AI hallucinations.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-primary/5 px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                Ask about this demo plan
              </h2>
              <span className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold border border-secondary-border" data-testid="label-demo-mode">
                Rule-based demo + limited live AI case
              </span>
            </div>
            
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Input Side */}
              <div className="md:col-span-5 space-y-6">
                <div>
                  <label htmlFor="qa-input" className="block text-sm font-medium text-foreground mb-2">
                    Type a question about {selectedPatient?.name}'s plan
                  </label>
                  <div className="relative">
                    <textarea
                      id="qa-input"
                      data-testid="input-question"
                      className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={3}
                      maxLength={150}
                      value={questionText}
                      onChange={(e) => {
                        setQuestionText(e.target.value);
                        setQaResult(null);
                        setAiExplanation(null);
                        setHandoffResult(null);
                        setHandoffError(null);
                        explanationRequestRef.current += 1;
                        handoffRequestRef.current += 1;
                        handoffIdempotencyKeyRef.current = null;
                        resetTeachBackState();
                      }}
                      placeholder="e.g., Do I need to use my walker?"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-medium" data-testid="text-char-count">
                      {questionText.length}/150
                    </div>
                  </div>
                  {qaResult?.status === 'empty' && (
                    <p className="text-destructive text-sm mt-2 flex items-center" data-testid="error-empty-question" role="alert">
                      <AlertCircle className="w-4 h-4 mr-1.5" />
                      {qaResult.responseText}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-3">Or try an example:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        data-testid={`button-example-${i}`}
                        onClick={() => {
                          setQuestionText(q);
                          handleAsk(q);
                        }}
                        className="text-sm bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full border border-border transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  data-testid="button-submit-question"
                  onClick={() => handleAsk(questionText)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-xl shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex items-center justify-center"
                >
                  Ask Question
                </button>
              </div>

              {/* Result Side */}
              <div className="md:col-span-7">
                {qaResult && qaResult.status !== 'empty' ? (
                  <div className="h-full flex flex-col bg-background rounded-xl border border-border overflow-hidden animate-in fade-in duration-300 shadow-sm" data-testid="container-qa-result">
                    {qaResult.status === 'success' && qaResult.evidence ? (
                      <>
                        <div className="p-5 sm:p-6 flex-1">
                          <div className="flex items-start text-primary mb-5">
                            <CheckCircle2 className="w-6 h-6 mr-2.5 shrink-0" />
                            <h4 className="font-semibold text-lg" data-testid="text-qa-success-title">Instruction found in plan</h4>
                          </div>
                          
                          <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 mb-6 shadow-inner">
                            <span className="block text-[11px] uppercase tracking-wider text-primary mb-2 font-bold">Exact Source Instruction</span>
                            <p className="text-foreground font-medium text-lg" data-testid="text-qa-instruction">
                              "{qaResult.evidence.instruction}"
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground bg-muted/40 p-4 rounded-xl border border-border">
                            <div>
                              <strong className="block text-foreground/80 text-xs uppercase tracking-wider mb-1">Document</strong>
                              <span data-testid="text-qa-doc-title" className="line-clamp-1">{qaResult.evidence.documentTitle}</span>
                            </div>
                            <div>
                              <strong className="block text-foreground/80 text-xs uppercase tracking-wider mb-1">Section</strong>
                              <span data-testid="text-qa-doc-section">{qaResult.evidence.sectionTitle}</span>
                            </div>
                            <div>
                              <strong className="block text-foreground/80 text-xs uppercase tracking-wider mb-1">Version & Date</strong>
                              <span data-testid="text-qa-doc-meta">{qaResult.evidence.version} ({format(new Date(qaResult.evidence.approvalDate), 'MMM d, yyyy')})</span>
                            </div>
                            <div>
                              <strong className="block text-foreground/80 text-xs uppercase tracking-wider mb-1">Verification</strong>
                              <span className="text-amber-600 dark:text-amber-500 font-semibold flex items-center" data-testid="text-qa-doc-synthetic">
                                Synthetic/Not verified
                              </span>
                            </div>
                          </div>
                          
                          {/* AI Explanation Section */}
                          <div className="mt-8 border-t border-border pt-8" data-testid="container-ai-section">
                            <h4 className="font-semibold text-lg mb-4 flex items-center text-foreground">
                              <Network className="w-5 h-5 mr-2 text-primary" />
                              AI Explanation Pathway
                            </h4>

                            {!aiExplanation && !createExplanation.isPending && (
                              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                  <h5 className="font-semibold text-foreground">Plain-Language Translation</h5>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-secondary/20 text-secondary-foreground border border-secondary-border">
                                    Disabled by default
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
                                  Request an experimental AI-generated, patient-friendly explanation. 
                                  This pathway is designed to strictly ground itself in the exact source instruction above.
                                </p>
                                <button
                                  data-testid="button-request-explanation"
                                  onClick={handleRequestExplanation}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 flex items-center text-sm shadow-sm"
                                >
                                  <Cpu className="w-4 h-4 mr-2" />
                                  Test Gemini Pathway
                                </button>
                              </div>
                            )}

                            {createExplanation.isPending && (
                              <div className="bg-card border border-border rounded-xl p-8 shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in" data-testid="container-ai-loading">
                                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4"></div>
                                <p className="text-sm font-medium text-foreground mb-1">Connecting to AI pathway...</p>
                                <p className="text-xs text-muted-foreground">No request was sent. No clinical team was notified.</p>
                              </div>
                            )}

                            {aiExplanation && (
                              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2" data-testid="container-ai-result">
                                {/* Status header */}
                                <div className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                  aiExplanation.status === 'success' ? 'bg-primary/5 border-primary/20' :
                                  aiExplanation.status === 'not_configured' ? 'bg-muted/50 border-border' :
                                  'bg-destructive/5 border-destructive/20'
                                }`}>
                                   <div className="flex items-center">
                                     {aiExplanation.status === 'success' ? (
                                       <CheckCircle2 className="w-5 h-5 text-primary mr-2.5" />
                                     ) : aiExplanation.status === 'not_configured' ? (
                                       <Link2Off className="w-5 h-5 text-muted-foreground mr-2.5" />
                                     ) : (
                                       <AlertCircle className="w-5 h-5 text-destructive mr-2.5" />
                                     )}
                                     <span className={`font-semibold text-sm ${
                                       aiExplanation.status === 'success' ? 'text-primary' :
                                       aiExplanation.status === 'not_configured' ? 'text-foreground' :
                                       'text-destructive'
                                     }`}>
                                       {aiExplanation.status === 'success' ? 'AI Explanation Generated' :
                                        aiExplanation.status === 'not_configured' ? 'AI Pathway Not Connected' :
                                        'AI Explanation Failed'}
                                     </span>
                                   </div>
                                   
                                   <div className="flex items-center gap-2">
                                     {!aiExplanation.liveModelVerified && (
                                       <span className="inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-background border border-border text-muted-foreground shadow-sm" data-testid="badge-ai-unverified">
                                          Not Live Verified
                                       </span>
                                     )}
                                   </div>
                                </div>

                                <div className="p-6">
                                  {aiExplanation.status === 'success' ? (
                                    <div className="space-y-5">
                                      <div className="text-foreground text-base leading-relaxed p-4 bg-background rounded-lg border border-border/50" data-testid="text-ai-explanation">
                                        {aiExplanation.explanation}
                                      </div>
                                    </div>
                                  ) : (
                                     <div className="space-y-4">
                                       <div className="flex items-start">
                                          <div className="bg-background border border-border/50 rounded-lg p-4 flex-1">
                                              <p className="text-sm font-medium text-foreground mb-2" data-testid="text-ai-error-message">
                                                {aiExplanation.message}
                                              </p>
                                              <p className="text-[11px] text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md inline-block border border-border/50">
                                                ERR_CODE: {aiExplanation.code}
                                              </p>
                                          </div>
                                       </div>
                                     </div>
                                  )}
                                  
                                  <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center" data-testid="text-ai-disclaimer">
                                      <ShieldAlert className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                      {aiExplanation.handoffNotice || 'No request was sent. No clinical team was notified.'}
                                    </p>
                                    
                                    {aiExplanation.retryable && (
                                      <button
                                        onClick={handleRequestExplanation}
                                        data-testid="button-ai-retry"
                                        disabled={createExplanation.isPending}
                                        className="shrink-0 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border border-border bg-background hover:bg-muted text-foreground h-9 px-4 py-2 disabled:opacity-50"
                                      >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${createExplanation.isPending ? 'animate-spin' : ''}`} />
                                        Retry Request ({aiExplanation.attempts}/2)
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Teach-Back Section */}
                          <div className="mt-8 border-t border-border pt-8" data-testid="container-teach-back-section">
                            <h4 className="font-semibold text-lg mb-4 flex items-center text-foreground">
                              <RefreshCw className="w-5 h-5 mr-2 text-primary" />
                              Check My Understanding
                            </h4>

                            {teachBackSkipped ? (
                              <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-center justify-between text-sm text-muted-foreground">
                                <span>Teach-back check skipped.</span>
                                <button
                                  data-testid="button-teach-back-open"
                                  onClick={() => {
                                    setTeachBackSkipped(false);
                                    setIsTeachBackOpen(true);
                                  }}
                                  className="text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                  Check my understanding
                                </button>
                              </div>
                            ) : (!isTeachBackOpen && !teachBackActivity) ? (
                              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                                <p className="text-sm text-foreground mb-4 font-medium">
                                  Would you like to double-check your understanding of this instruction?
                                  This is an optional activity where you explain the instruction in your own words.
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                  <button
                                    data-testid="button-teach-back-open"
                                    onClick={() => setIsTeachBackOpen(true)}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                  >
                                    Check my understanding
                                  </button>
                                  <button
                                    data-testid="button-teach-back-skip"
                                    onClick={() => setTeachBackSkipped(true)}
                                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                  >
                                    Skip
                                  </button>
                                </div>
                              </div>
                            ) : (
                                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                                  <div className="bg-muted/40 p-4 rounded-lg border border-border">
                                    <span className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1 font-bold">Original Instruction</span>
                                    <p className="text-foreground text-sm font-medium" data-testid="text-teach-back-original-source">
                                      {teachBackActivity?.originalInstruction || qaResult.evidence.instruction}
                                    </p>
                                  </div>

                                  {teachBackActivity && (
                                    <div className={`p-4 rounded-xl border ${
                                      teachBackActivity.outcome === 'complete'
                                        ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                                        : teachBackActivity.outcome === 'source_mismatch'
                                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                                          : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                                    }`} aria-live="polite">
                                      <div className="flex items-start mb-2">
                                        {teachBackActivity.outcome === 'complete' ? (
                                          <CheckCircle2 className="w-5 h-5 mr-2 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                                        ) : (
                                          <AlertCircle className="w-5 h-5 mr-2 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                        )}
                                        <h5 className="font-semibold text-foreground">
                                          {teachBackActivity.outcome === 'complete'
                                            ? 'Matches the demo instruction'
                                            : teachBackActivity.outcome === 'provider_error'
                                              ? 'Assessment unavailable'
                                              : teachBackActivity.outcome === 'source_mismatch'
                                                ? 'Source version changed'
                                                : 'Needs clarification'}
                                        </h5>
                                      </div>
                                      <p className="text-foreground/90 text-sm ml-7" data-testid="text-teach-back-feedback">
                                        {teachBackActivity.feedback}
                                      </p>
                                      <div className="mt-3 ml-7 pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-2 items-center justify-between">
                                        <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground" data-testid="label-teach-back-assessment-source">
                                          {teachBackActivity.assessmentSource === 'gemini_live'
                                            ? 'Gemini live meaning classification'
                                            : teachBackActivity.assessmentSource === 'simulated_provider'
                                              ? 'Simulated model classification'
                                              : 'Fixed safety-rule feedback'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          Comprehension attempts: {teachBackActivity.comprehensionAttempts}/2
                                        </span>
                                      </div>
                                      <p className="mt-3 ml-7 text-xs text-muted-foreground italic">
                                        A match is only a limited comprehension check, never proof of real understanding, adherence, clinical readiness, approval, or clearance.
                                      </p>
                                    </div>
                                  )}

                                  {teachBackActivity?.outcome !== 'complete' && (
                                    <fieldset className="rounded-lg border border-dashed border-border p-3">
                                      <legend className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Reviewer-only delivery simulation
                                      </legend>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        This control changes only the synthetic queue outcome. No real clinician is contacted.
                                      </p>
                                      <div className="flex flex-wrap gap-3 text-xs">
                                        {(['delivered', 'failed', 'unconfirmed'] as const).map((scenario) => (
                                          <label key={scenario} className="inline-flex items-center gap-1.5">
                                            <input
                                              type="radio"
                                              name="teach-back-demo-scenario"
                                              value={scenario}
                                              checked={demoScenario === scenario}
                                              onChange={() => setDemoScenario(scenario)}
                                              data-testid={`radio-teach-back-${scenario}`}
                                            />
                                            {scenario === 'delivered'
                                              ? 'Confirmed delivery'
                                              : scenario === 'failed'
                                                ? 'Failed delivery'
                                                : 'Accepted, unconfirmed'}
                                          </label>
                                        ))}
                                      </div>
                                    </fieldset>
                                  )}

                                  {(!teachBackActivity ||
                                    teachBackActivity.outcome === 'provider_error' ||
                                    teachBackActivity.outcome === 'source_mismatch' ||
                                    (teachBackActivity.retryAvailable && isRetryingTeachBack)) ? (
                                    <div className="space-y-4">
                                      <label htmlFor="teach-back-input" className="block text-sm font-medium text-foreground">
                                        In your own words, when is the walker needed?
                                      </label>
                                      <div className="relative">
                                        <textarea
                                          id="teach-back-input"
                                          data-testid="input-teach-back"
                                          className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                                          rows={3}
                                          maxLength={300}
                                          value={teachBackInput}
                                          onChange={(e) => setTeachBackInput(e.target.value)}
                                          disabled={createTeachBack.isPending}
                                          placeholder="e.g., I should use my walker when..."
                                        />
                                        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-medium" data-testid="text-teach-back-char-count">
                                          {teachBackInput.length}/300
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-3">
                                        <button
                                          data-testid="button-teach-back-submit"
                                          onClick={handleTeachBackSubmit}
                                          disabled={createTeachBack.isPending || !teachBackInput.trim()}
                                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-6 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                        >
                                          {createTeachBack.isPending ? (
                                            <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></span> Submitting...</>
                                          ) : 'Submit Explanation'}
                                        </button>
                                        {!teachBackActivity && (
                                          <button
                                            data-testid="button-teach-back-skip"
                                            onClick={() => { setIsTeachBackOpen(false); setTeachBackSkipped(true); }}
                                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                          >
                                            Cancel
                                          </button>
                                        )}
                                        <button
                                          data-testid="button-teach-back-handoff"
                                          onClick={() => handleCreateHandoff(undefined, true)}
                                          disabled={handoffPendingRef.current}
                                          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                        >
                                          Request Clarification (No real clinician contacted)
                                        </button>
                                      </div>

                                      {createTeachBack.isError && (
                                        <p className="text-destructive text-sm" role="alert">An error occurred submitting your explanation.</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="flex flex-wrap items-center gap-3">
                                        {teachBackActivity.retryAvailable && (
                                          <button
                                            data-testid="button-teach-back-retry"
                                            onClick={() => setIsRetryingTeachBack(true)}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                          >
                                            Try again
                                          </button>
                                        )}
                                        {teachBackActivity.handoffAvailable && (
                                          <button
                                            data-testid="button-teach-back-handoff"
                                            onClick={() => handleCreateHandoff(undefined, true)}
                                            disabled={handoffPendingRef.current}
                                            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                          >
                                            Request Clarification (No real clinician contacted)
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {handoffError && (
                                    <p role="alert" className="text-sm font-medium text-destructive">
                                      {handoffError}
                                    </p>
                                  )}

                                  {handoffResult?.question === TEACH_BACK_HANDOFF_QUESTION && (
                                    <div
                                      className={`rounded-xl border p-4 ${
                                        handoffResult.deliveryConfirmed
                                          ? 'border-primary/30 bg-primary/5'
                                          : 'border-destructive/30 bg-destructive/5'
                                      }`}
                                      data-testid="container-handoff-result"
                                      aria-live="polite"
                                    >
                                      <div className="flex items-start gap-2 mb-3">
                                        {handoffResult.deliveryConfirmed ? (
                                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                        ) : (
                                          <XCircle className="w-5 h-5 text-destructive shrink-0" />
                                        )}
                                        <div>
                                          <p className="font-semibold text-foreground" data-testid="text-handoff-status">
                                            {handoffResult.message}
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {handoffResult.destination}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="text-sm font-semibold text-foreground mb-2" data-testid="text-handoff-no-clinician">
                                        {handoffResult.noRealClinicianNotice}
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-3" data-testid="text-handoff-evidence">
                                        {handoffResult.evidenceNote} Source: {handoffResult.sourceReference} · {handoffResult.sourceVersion}.
                                      </p>
                                      {!handoffResult.deliveryConfirmed && (
                                        <p className="text-sm text-amber-900 dark:text-amber-200 mb-3" data-testid="text-handoff-alternative">
                                          {handoffResult.alternativeGuidance}
                                        </p>
                                      )}
                                      {handoffResult.retryable && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCreateHandoff(
                                              handoffResult.reviewRequestId,
                                              true,
                                            )
                                          }
                                          disabled={createHandoff.isPending}
                                          data-testid="button-retry-demo-review"
                                          className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                                        >
                                          <RefreshCw className="w-4 h-4 mr-2" />
                                          Retry delivery ({handoffResult.attempts}/2)
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                            )}
                          </div>
                        </div>
                        <div className="bg-muted/80 p-4 border-t border-border text-sm text-muted-foreground text-center font-medium" data-testid="text-qa-disclaimer">
                          {qaResult.disclaimer}
                        </div>
                      </>
                    ) : qaResult.status === 'unsupported' ? (
                      <div className="p-5 sm:p-6 flex-1 bg-amber-50 dark:bg-amber-950/20">
                        <div className="flex items-start text-amber-700 dark:text-amber-500 mb-4">
                          <AlertCircle className="w-6 h-6 mr-2.5 shrink-0" />
                          <h4 className="font-semibold text-lg" data-testid="text-qa-unsupported-title">Cannot Answer</h4>
                        </div>
                        <p className="text-amber-900 dark:text-amber-200 text-base mb-6 font-medium" data-testid="text-qa-unsupported-message">
                          {qaResult.responseText}
                        </p>
                        <div className="bg-background border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-5 text-sm space-y-3" data-testid="container-review-summary">
                          <div>
                            <span className="block text-xs uppercase tracking-wider font-bold text-muted-foreground">Stop reason</span>
                            <span className="font-semibold text-foreground" data-testid="text-handoff-stop-reason">
                              {STOP_REASON_LABELS[qaResult.stopReason ?? 'missing_guidance']}
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wider font-bold text-muted-foreground">Fictional question</span>
                            <span data-testid="text-handoff-question">{questionText}</span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wider font-bold text-muted-foreground">Evidence for review</span>
                            <span data-testid="text-handoff-evidence">
                              {selectedPatient?.documentTitle} · {selectedPatient?.version} · No answer found in the relevant synthetic plan evidence.
                            </span>
                          </div>
                          <div>
                            <span className="block text-xs uppercase tracking-wider font-bold text-muted-foreground">Prepared</span>
                            <span>{format(new Date(), 'h:mm a (MMM d, yyyy)')}</span>
                          </div>
                        </div>

                        <fieldset className="mb-4">
                          <legend className="text-sm font-semibold text-foreground mb-2">Demo receiving-queue scenario</legend>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {([
                              ['delivered', 'Successful delivery'],
                              ['failed', 'Failed delivery'],
                              ['unconfirmed', 'Unconfirmed delivery'],
                            ] as const).map(([value, label]) => (
                              <label key={value} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm cursor-pointer">
                                <input
                                  type="radio"
                                  name="handoff-scenario"
                                  value={value}
                                  checked={demoScenario === value}
                                  onChange={() => setDemoScenario(value)}
                                  data-testid={`radio-handoff-${value}`}
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </fieldset>

                        {!handoffResult && (
                          <button
                            type="button"
                            onClick={() => handleCreateHandoff()}
                            disabled={createHandoff.isPending}
                            data-testid="button-create-demo-review"
                            className="w-full inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {createHandoff.isPending ? 'Submitting demo request…' : 'Create demo review request'}
                          </button>
                        )}

                        {handoffError && <p role="alert" className="mt-4 text-sm font-medium text-destructive">{handoffError}</p>}

                        {handoffResult && (
                          <div className={`mt-5 rounded-xl border p-4 ${handoffResult.deliveryConfirmed ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`} data-testid="container-handoff-result" aria-live="polite">
                            <div className="flex items-start gap-2 mb-3">
                              {handoffResult.deliveryConfirmed ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                              <div>
                                <p className="font-semibold text-foreground" data-testid="text-handoff-status">{handoffResult.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{handoffResult.destination}</p>
                              </div>
                            </div>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-4">
                              <div><dt className="font-semibold text-muted-foreground">Attempt ID</dt><dd data-testid="text-handoff-attempt-id" className="font-mono break-all">{handoffResult.attemptId}</dd></div>
                              <div><dt className="font-semibold text-muted-foreground">Queue request ID</dt><dd data-testid="text-handoff-queue-id" className="font-mono break-all">{handoffResult.queueRequestId ?? 'Not assigned'}</dd></div>
                            </dl>
                            <p className="text-sm font-semibold text-foreground mb-2" data-testid="text-handoff-no-clinician">{handoffResult.noRealClinicianNotice}</p>
                            {!handoffResult.deliveryConfirmed && (
                              <p className="text-sm text-amber-900 dark:text-amber-200 mb-3" data-testid="text-handoff-alternative">{handoffResult.alternativeGuidance}</p>
                            )}
                            {handoffResult.retryable && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCreateHandoff(
                                    handoffResult.reviewRequestId,
                                    handoffResult.question === TEACH_BACK_HANDOFF_QUESTION,
                                  )
                                }
                                disabled={createHandoff.isPending}
                                data-testid="button-retry-demo-review"
                                className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry delivery ({handoffResult.attempts}/2)
                              </button>
                            )}
                            <div className="mt-4 rounded-lg border border-border bg-background p-3">
                              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Current demo status</p>
                              <p className="font-semibold text-foreground mt-1" data-testid="text-review-status">
                                {REVIEW_STATUS_LABELS[handoffResult.reviewStatus]}
                              </p>
                              <p className="text-sm text-muted-foreground mt-2" data-testid="text-handoff-next-action">
                                <strong className="text-foreground">Next action:</strong> {handoffResult.nextAction}
                              </p>
                            </div>

                            {handoffResult.reviewStatus === 'awaiting_review' && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate('acknowledge')}
                                disabled={updateHandoffStatus.isPending}
                                data-testid="button-demo-acknowledge"
                                className="mt-3 inline-flex items-center rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary"
                              >
                                Manually simulate reviewer acknowledgement
                              </button>
                            )}

                            {handoffResult.reviewStatus === 'acknowledged' && (
                              <div className="mt-4 rounded-lg border border-border bg-background p-3">
                                <label htmlFor="response-fixture" className="block text-sm font-semibold text-foreground mb-2">
                                  Authored demo response fixture
                                </label>
                                <select
                                  id="response-fixture"
                                  value={responseFixture}
                                  onChange={(event) => setResponseFixture(event.target.value as typeof responseFixture)}
                                  data-testid="select-response-fixture"
                                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                >
                                  <option value="current">Matches current source version</option>
                                  <option value="superseded">References superseded demo version</option>
                                  <option value="unverified">Source version cannot be verified</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate('make_response_available')}
                                  disabled={updateHandoffStatus.isPending}
                                  data-testid="button-demo-response"
                                  className="mt-3 inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                                >
                                  Manually simulate response availability
                                </button>
                              </div>
                            )}

                            {handoffResult.reviewStatus === 'response_available' && handoffResult.demoResponse && (
                              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4" data-testid="container-demo-response">
                                <p className="text-xs uppercase tracking-wider font-bold text-primary">Illustrative authored response</p>
                                <p className="mt-2 text-sm font-medium text-foreground" data-testid="text-demo-response">{handoffResult.demoResponse.text}</p>
                                <p className="mt-3 text-xs text-muted-foreground" data-testid="text-demo-response-version">
                                  {handoffResult.demoResponse.approvalLabel} · Source {handoffResult.demoResponse.sourceVersion}
                                </p>
                                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">{handoffResult.demoResponse.notice}</p>
                              </div>
                            )}

                            {handoffResult.reviewStatus === 'clarification_required' && (
                              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200" data-testid="container-clarification-required">
                                The demo response could not be verified against the current source version. Fixture source: {handoffResult.responseFixtureVersion ?? 'unverified'}; current source: {handoffResult.sourceVersion}. Clarification is required; no new advice is displayed and the original synthetic plan remains unchanged.
                              </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-border">
                              <h5 className="font-semibold text-sm flex items-center mb-2"><History className="w-4 h-4 mr-2" />Audit history</h5>
                              <ol className="space-y-2" data-testid="list-handoff-audit">
                                {handoffResult.audit.map((event, index) => (
                                  <li key={`${event.attemptId}-${event.status}-${index}`} className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground capitalize">{event.status.replaceAll('_', ' ')}</span> · {format(new Date(event.timestamp), 'h:mm:ss a')} · {event.reason} · {event.sourceReference} ({event.sourceVersion})
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}

                        <div className="bg-amber-100/50 dark:bg-amber-900/30 p-4 border border-amber-200 dark:border-amber-800/60 rounded-xl text-sm text-amber-800 dark:text-amber-300 text-center font-medium shadow-sm" data-testid="text-qa-unsupported-disclaimer">
                          {handoffResult
                            ? handoffResult.noRealClinicianNotice
                            : 'No demo request has been submitted. No real clinician has been contacted.'}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground" data-testid="text-handoff-retention">
                          {handoffHistory.data?.retentionNotice ?? 'Demo history is scoped to this browser session and running app process.'}
                        </p>
                        {handoffHistory.data && handoffHistory.data.items.length > 0 && !handoffResult && (
                          <p className="mt-2 text-xs text-muted-foreground" data-testid="text-handoff-history-count">
                            {handoffHistory.data.items.length} prior demo review request(s) for this fictional patient in this session.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border" data-testid="container-qa-empty">
                    <MessageSquare className="w-12 h-12 mb-4 text-muted-foreground/30" />
                    <p className="text-lg font-medium text-foreground/70">No Question Asked</p>
                    <p className="text-sm mt-2 max-w-sm">Type a question or select an example on the left to see how the rule-based Q&A handles inquiries safely.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current-session request status */}
        <section className="mt-12 pt-8 border-t border-border" aria-labelledby="request-status-heading">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-border bg-muted/40">
              <h2 id="request-status-heading" className="text-xl font-semibold text-foreground flex items-center">
                <History className="w-5 h-5 mr-2 text-primary" />
                Request status and next steps
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Current browser-session demo requests for {selectedPatient?.name}. No real clinician or clinical system is connected.
              </p>
            </div>
            <div className="p-4 sm:p-6">
              {!handoffHistory.data || handoffHistory.data.items.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="text-status-empty">
                  No demo review request has been submitted for this fictional patient in this browser session.
                </p>
              ) : (
                <div className="space-y-3" data-testid="list-request-status">
                  {handoffHistory.data.items.map((item) => (
                    <article key={item.reviewRequestId} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground">{REVIEW_STATUS_LABELS[item.reviewStatus]}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Updated {format(new Date(item.updatedAt), 'h:mm:ss a (MMM d, yyyy)')}
                          </p>
                        </div>
                        <span className="text-xs font-mono break-all" data-testid="text-status-queue-id">
                          {item.queueRequestId ?? 'Queue request ID not assigned'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        {item.sourceReference} · {item.sourceVersion}
                      </p>
                      <p className="text-sm mt-2" data-testid="text-status-next-action">
                        <strong>Next action:</strong> {item.nextAction}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground mt-2">
                        {item.noRealClinicianNotice}
                      </p>
                      {item.reviewStatus === 'awaiting_review' && (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate('acknowledge', item)}
                          disabled={updateHandoffStatus.isPending}
                          data-testid={`button-status-acknowledge-${item.reviewRequestId}`}
                          className="mt-3 inline-flex items-center rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary"
                        >
                          Manually simulate reviewer acknowledgement
                        </button>
                      )}
                      {item.reviewStatus === 'acknowledged' && (
                        <div className="mt-3 rounded-lg border border-border p-3">
                          <label className="block text-xs font-semibold text-muted-foreground mb-2">
                            Authored response fixture
                            <select
                              value={responseFixture}
                              onChange={(event) => setResponseFixture(event.target.value as typeof responseFixture)}
                              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                            >
                              <option value="current">Matches current source version</option>
                              <option value="superseded">References superseded demo version</option>
                              <option value="unverified">Source version cannot be verified</option>
                            </select>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate('make_response_available', item)}
                            disabled={updateHandoffStatus.isPending}
                            data-testid={`button-status-response-${item.reviewRequestId}`}
                            className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                          >
                            Manually simulate response availability
                          </button>
                        </div>
                      )}
                      {item.reviewStatus === 'response_available' && item.demoResponse && (
                        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                          <p className="text-xs uppercase tracking-wider font-bold text-primary">Illustrative authored response</p>
                          <p className="text-sm mt-2" data-testid="text-status-demo-response">{item.demoResponse.text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {item.demoResponse.approvalLabel} · Source {item.demoResponse.sourceVersion}
                          </p>
                        </div>
                      )}
                      {item.reviewStatus === 'clarification_required' && (
                        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                          Clarification required: fixture source {item.responseFixtureVersion ?? 'unverified'} does not verify against current source {item.sourceVersion}. No new advice is displayed.
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Delivery, reviewer acknowledgement, response availability, and patient acknowledgement are separate demo states. None means clinically resolved.
                      </p>
                    </article>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                {handoffHistory.data?.retentionNotice ?? 'History is limited to this browser session and running demo process.'}
              </p>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <div className="mt-20 pt-10 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Development Roadmap</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-6 border border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-primary/20"></div>
              <div className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-3 py-1 text-sm font-semibold mb-4">
                Now
              </div>
              <h3 className="font-semibold text-lg mb-2">Milestones 1–3</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" /> Synthetic source retrieval</li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" /> Rule-based synthetic Q&A</li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" /> Gemini pathway implemented</li>
                <li className="flex items-start text-amber-600 dark:text-amber-500 font-medium"><AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> Narrow live case passed / not clinically validated</li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" /> Simulated review handoff + audit</li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" /> Request status + next actions</li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" /> Interactive teach-back checks</li>
              </ul>
            </div>
            
            <div className="bg-card rounded-xl p-6 border border-amber-200 dark:border-amber-900/50 shadow-sm bg-amber-50/30 dark:bg-amber-950/10">
              <div className="inline-flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-400 px-3 py-1 text-sm font-semibold mb-4 border border-amber-200 dark:border-amber-800/50">
                Blocked
              </div>
              <h3 className="font-semibold text-lg mb-2">Live AI Evaluation</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start font-medium text-amber-700 dark:text-amber-400"><Clock className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> Broader adversarial evaluation</li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" /> One grounded live explanation</li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 mr-2 text-primary shrink-0 mt-0.5" /> Treatment-change safeguards</li>
              </ul>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border opacity-60">
              <div className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground px-3 py-1 text-sm font-semibold mb-4">
                Later
              </div>
              <h3 className="font-semibold text-lg mb-2">Production Reality</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start"><Clock className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> Identity & Access (AuthN/AuthZ)</li>
                <li className="flex items-start"><Clock className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> EMR Integration (SMART on FHIR)</li>
                <li className="flex items-start"><Clock className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> Real clinical team routing</li>
                <li className="flex items-start"><Clock className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> Durable clinical audit logging</li>
                <li className="flex items-start"><Clock className="w-4 h-4 mr-2 shrink-0 mt-0.5" /> Multi-modal interactions</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
