export interface Section {
  id: string;
  title: string;
  content: string | null;
}

export interface PatientScenario {
  id: string;
  name: string;
  documentTitle: string;
  version: string;
  approvalDate: string;
  sections: Section[];
}

export const mockPatients: PatientScenario[] = [
  {
    id: "p1",
    name: "John Doe (Fictional)",
    documentTitle: "Post-Operative Hip Replacement Discharge Plan",
    version: "v1.0.4",
    approvalDate: "2023-10-15T09:00:00Z",
    sections: [
      {
        id: "mobility",
        title: "Mobility Instructions",
        content: "Use your walker whenever standing or walking until cleared by physical therapy."
      },
      {
        id: "medications",
        title: "Medications",
        content: "Take your prescribed pain medication as directed on the bottle. Do not exceed the maximum daily dose. Take with food to avoid stomach upset."
      },
      {
        id: "diet",
        title: "Dietary Restrictions",
        content: null
      }
    ]
  },
  {
    id: "p2",
    name: "Jane Smith (Fictional)",
    documentTitle: "Cardiac Observation Discharge Summary",
    version: "v2.1.0",
    approvalDate: "2023-11-02T14:30:00Z",
    sections: [
      {
        id: "activity",
        title: "Activity Level",
        content: "Rest for the next 48 hours. Avoid lifting anything heavier than 10 lbs. Short walks around the house are permitted as tolerated."
      },
      {
        id: "symptoms",
        title: "When to Call the Doctor",
        content: "Call immediately if you experience shortness of breath, chest pain, or dizziness."
      },
      {
        id: "followup",
        title: "Follow-up Appointments",
        content: null
      }
    ]
  }
];
