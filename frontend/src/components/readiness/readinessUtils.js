// Helper function to create initial state for validation fields
export const createInitialState = (fields) => {
  return fields.reduce((acc, field) => {
    acc[field] = {
      value: false,
      validation: {
        tko: false,
        ot: false,
        ot_op: false,
        is: false,
        sop: false,
        ok_nok: "",
        who: "",
        when: "",
        validation_check: false,
        comment: "",
      },
    }
    return acc
  }, {})
}

// Field definitions
export const fieldDefinitions = {
  Documentation: [
    "workStandardsInPlace",
    "polyvalenceMatrixUpdated",
    "gaugesAvailable",
    "qualityFileApproved",
    "drpUpdated",
    "checkCSR",
    "dRP",
  ],

  Logistics: ["loopsFlowsDefined", "storageDefined", "labelsCreated", "sapReferenced", "safetyStockReady"],

  Maintenance: ["sparePartsIdentifiedAndAvailable", "processIntegratedInPlantMaintenance", "maintenanceStaffTrained"],

  Packaging: ["customerDefined", "smallBatchSubstitute", "returnableLoops", "rampUpReady"],

  ProcessStatusIndustrials: [
    "processComplete",
    "processParametersIdentified",
    "pokaYokesIdentifiedAndEffective",
    "specificBoundaryPartsSamples",
    "gaugesAcceptedByPlant",
    "processCapabilitiesPerformed",
    "pfmeaIssuesAddressed",
    "reversePfmeaPerformed",
    "checkingFixtures",
    "industrialMeansAccepted",
  ],

  ProductProcess: [
    "technicalReview",
    "dfmea",
    "pfmea",
    "injectionTools",
    "paintingProcess",
    "assyMachine",
    "checkingFixture",
    "industrialCapacity",
    "skillsDeployment",
  ],

  RunAtRateProduction: [
    "qualityWallInPlace",
    "selfRunRatePerformed",
    "dimensionalInspectionsConform",
    "rampUpDefined",
    "mppAuditCompleted",
  ],

  Safety: ["industrialMeansCompliance", "teamTraining",],

  Supp: [
    "componentsRawMaterialAvailable",
    "packagingDefined",
    "partsAccepted",
    "purchasingRedFilesTransferred",
    "automaticProcurementEnabled",
  ],

  ToolingStatus: [
    "manufacturedPartsAtLastRelease",
    "specificationsConformity",
    "partsGrainedAndValidated",
    "noBreakOrIncidentDuringInjectionTrials",
    "toolsAccepted",
    "preSerialInjectionParametersDefined",
    "serialProductionInjectionParametersDefined",
    "incompletePartsProduced",
    "toolmakerIssuesEradicated",
  ],

  Training: ["visualControlQualification", "dojoTrainingCompleted", "trainingPlanDefined","trainingPlan",],
}

// Helper function to format field names for display
export const formatFieldName = (fieldName) => {
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
}

// Helper function to check if a section is complete
export const isSectionComplete = (data, fields) => {
  return fields.every((field) => data[field]?.value)
}

// Helper function to calculate overall form completion
export const calculateOverallCompletion = (formData, allSectionData, fieldDefinitions) => {
  // Count general form fields
  const generalFields = Object.keys(formData).length
  const filledGeneralFields = Object.keys(formData).filter(
    (key) => formData[key] !== "" && formData[key] !== null && formData[key] !== undefined,
  ).length

  // Count all section fields
  let totalSectionFields = 0
  let completedSectionFields = 0

  Object.keys(fieldDefinitions).forEach((section) => {
    const sectionData = allSectionData[section.toLowerCase() + "Data"]
    const fields = fieldDefinitions[section]

    totalSectionFields += fields.length
    completedSectionFields += fields.filter((field) => sectionData[field]?.value).length
  })

  // Calculate overall percentage
  const totalFields = generalFields + totalSectionFields
  const completedFields = filledGeneralFields + completedSectionFields

  return Math.round((completedFields / totalFields) * 100)
}

