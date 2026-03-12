
export enum Severity {
  NORMAL = 'Normal',
  CRITICAL = 'Critical',
  STABLE = 'Stable',
  MONITORING = 'Monitoring'
}

export enum AnimalType {
  CATTLE = 'Cattle',
  POULTRY = 'Poultry',
  PIGS = 'Pigs',
  SHEEP_GOAT = 'Sheep/Goat',
  DOG = 'Dog',
  OTHERS = 'Others'
}

export interface CaseReport {
  id: string;
  date: string;
  district: string;
  animal: string;
  disease: string;
  status: Severity;
  actionRequired: boolean;
  ownerName?: string;
  ownerPhone?: string;
  vaccinationStatus?: 'Vaccinated' | 'Not Vaccinated';
}

export interface HealthMetric {
  timestamp: string;
  temperature: number;
  heartRate: number;
  status: 'Stable' | 'Critical' | 'Warning';
}

export interface Animal {
  id: string;
  name: string;
  breed: string;
  age: number;
  lastVaccinationDate: string;
  healthHistory: string[];
  currentMetrics?: HealthMetric;
}

export interface Owner {
  id: string;
  name: string;
  phone: string;
  area: string;
  animalType: AnimalType;
  animals: Animal[];
  isVaccinated: boolean;
  iotEnabled?: boolean;
}

export interface Outbreak {
  id: string;
  diseaseName: string;
  severity: Severity;
  area: string;
  animalType: AnimalType;
  casesCount: number;
  date: string;
  status: 'Active' | 'Contained' | 'Monitored';
  variantDna?: string;
}

export interface SmsLog {
  id: string;
  recipient: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'Sent' | 'Delivered' | 'Failed';
}

export interface HistoricalStats {
  year: number;
  totalCases: number;
  mortalityRate: number;
  vaccinationCoverage: number;
  topDisease: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  date: string;
  category: 'Prevention' | 'Announcement' | 'Research' | 'Emergency';
  imageUrl?: string;
  author: string;
}

export interface PublicReport {
  id: string;
  reporterName: string;
  phone: string;
  area: string;
  description: string;
  animalType: AnimalType;
  symptoms: string[];
  status: 'Pending' | 'Verified' | 'Dismissed';
  date: string;
}

export interface Authority {
  id: string;
  name: string;
  designation: string;
  location: string;
  contact: string;
  organization: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface RiskPrediction {
  district: string;
  riskScore: number;
  dominantThreat: string;
  lastUpdated: string;
}

export interface VaccineInventory {
  id: string;
  disease: string;
  stock: number;
  expiry: string;
  location: string;
}

export interface LabResult {
  id: string;
  sampleId: string;
  district: string;
  pathogen: string;
  status: 'Processing' | 'Confirmed' | 'Negative';
  dateReceived: string;
}
