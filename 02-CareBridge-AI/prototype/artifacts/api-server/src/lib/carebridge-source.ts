export interface CareBridgeSource {
  patientId: string;
  patientName: string;
  documentTitle: string;
  sectionId: string;
  sectionTitle: string;
  version: string;
  simulatedApprovalDate: string;
  exactInstruction: string;
}

const sources: CareBridgeSource[] = [
  {
    patientId: "p1",
    patientName: "John Doe (Fictional)",
    documentTitle: "Post-Operative Hip Replacement Discharge Plan",
    sectionId: "mobility",
    sectionTitle: "Mobility Instructions",
    version: "v1.0.4",
    simulatedApprovalDate: "2023-10-15T09:00:00Z",
    exactInstruction:
      "Use your walker whenever standing or walking until cleared by physical therapy.",
  },
];

export function getCareBridgeSource(
  patientId: string,
  sectionId: string,
): CareBridgeSource | undefined {
  return sources.find(
    (source) =>
      source.patientId === patientId && source.sectionId === sectionId,
  );
}