import { Outbreak, Owner, Severity, AnimalType, Article, PublicReport, Authority, RiskPrediction, HistoricalStats, SmsLog, Animal, VaccineInventory, LabResult, CaseReport } from './types';

// API Base URL
const API_URL = 'http://localhost:5000/api';

// Helper for API calls with logic for offline caching
const fetchJson = async (endpoint: string) => {
  const cacheKey = `cache_${endpoint}`;
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error('Server unreachable');
    const data = await res.json();

    // Update cache on success
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    // If server is down, return the last known data from cache
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      console.warn(`Server offline for ${endpoint}. Using cached data.`);
      return JSON.parse(cachedData);
    }
    console.error(`API Error and no cache for ${endpoint}:`, err);
    return [];
  }
};

// We keep some static data that might not need a DB yet (for simplicity of migration)
// or we can fetch everything.

export const db = {
  // Now async! Components must await or use useEffect
  getCaseReports: async (): Promise<CaseReport[]> => {
    return await fetchJson('/reports');
  },

  saveCaseReports: async (data: CaseReport[]) => {
    // In a real app, we would send PUT/POST for specific items, not the whole array.
    // For this migration step, we might need to refactor the UI to update single items.
    // But for "saveCaseReports" which usually updates the whole list in local storage:
    const newReport = data[0]; // Assuming first is new
    if (newReport) {
      await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
      });
    }
    // console.warn("Bulk update not fully supported via API in this demo. Implement individual update.");
  },

  updateReport: async (report: CaseReport) => {
    await fetch(`${API_URL}/reports/${encodeURIComponent(report.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
  },

  getOwners: async (): Promise<Owner[]> => {
    return await fetchJson('/owners');
  },

  getOutbreaks: async (): Promise<Outbreak[]> => {
    return await fetchJson('/outbreaks');
  },

  getSmsLogs: async (): Promise<SmsLog[]> => {
    return await fetchJson('/sms-logs');
  },

  saveSmsLogs: async (logs: SmsLog[]) => {
    // We usually append one log at a time in the UI
    // We'll expose a addLog method
    const newLog = logs[0]; // Assuming the first one is new
    if (newLog) {
      await fetch(`${API_URL}/sms-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
    }
  },

  // ... (Keep other static getters if they are not in DB yet)
  getInventory: (): VaccineInventory[] => [], // Placeholder
  getLabResults: (): LabResult[] => [],
  getStats: () => {
    // This needs to be calculated from async data now, implies a refactor in UI
    return {
      totalCases: 0,
      totalAnimals: 0,
      vaccinationRate: 0,
      activeOutbreaks: 0
    };
  }
};

// Export consts for types if needed, but data should come from DB
export const CASE_REPORTS: CaseReport[] = [];
export const INITIAL_OWNERS: Owner[] = [];

// Restoring missing exports
export const TN_AUTHORITIES: Authority[] = [
  { id: '1', name: 'Directorate Office', organization: 'TN Veterinary HQ', designation: 'Head Office', location: 'Nandanam, Chennai', contact: '044-24345362' },
  { id: '2', name: 'Thiru Anitha R. Radhakrishnan', organization: 'Government of TN', designation: 'Minister - Animal Husbandry', location: 'Secretariat, Chennai', contact: '044-25672265' },
  { id: '3', name: 'Support Helpline', organization: 'TN Veterinary Dept', designation: 'General Helpline', location: 'Statewide', contact: '044-25665566' },
  { id: '4', name: 'Dr. N. Subbaiyan, IAS', organization: 'Government of TN', designation: 'Secretary to Government', location: 'Secretariat, Chennai', contact: '044-25672937' },
  { id: '5', name: 'Thiru R. Kannan, IAS', organization: 'TN Veterinary HQ', designation: 'Director', location: 'Nandanam, Chennai', contact: '044-42152200' },
  { id: '6', name: 'Director Office', organization: 'TN Veterinary HQ', designation: 'Direct Contact', location: 'Chennai', contact: '9445001100' },
  { id: '7', name: 'Ariyalur Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Ariyalur', contact: '9445001115' },
  { id: '8', name: 'Chengalpattu Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Chengalpattu', contact: '9445001198' },
  { id: '9', name: 'Chennai Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Vepery, Chennai', contact: '9445001105' },
  { id: '10', name: 'Coimbatore Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Townhall, Coimbatore', contact: '9445001135' },
  { id: '11', name: 'Cuddalore Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Pudupalayam, Cuddalore', contact: '9445001120' },
  { id: '12', name: 'Dharmapuri Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Dharmapuri', contact: '9445001113' },
  { id: '13', name: 'Dindigul Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Dindigul', contact: '9445001114' },
  { id: '14', name: 'Erode Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Erode', contact: '9445001121' },
  { id: '15', name: 'Kallakurichi Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Kallakurichi', contact: '9445001207' },
  { id: '16', name: 'Kancheepuram Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Kancheepuram', contact: '9445001109' },
  { id: '17', name: 'Karur Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Pasupathipalayam, Karur', contact: '9445001126' },
  { id: '18', name: 'Krishnagiri Officer', organization: 'District Command', designation: 'Veterinary Dispensary Campus', location: 'Krishnagiri', contact: '9445001164' },
  { id: '19', name: 'Madurai Officer', organization: 'District Command', designation: 'Veterinary Polyclinic Campus', location: 'Madurai', contact: '9445001127' },
  { id: '20', name: 'Mayiladuthurai Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Mayiladuthurai', contact: '9445001210' },
  { id: '21', name: 'Nagapattinam Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Nagapattinam', contact: '9445001116' },
  { id: '22', name: 'Namakkal Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Namakkal', contact: '9445032503' },
  { id: '23', name: 'Nilgiris Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Udhagamandalam', contact: '9445001111' },
  { id: '24', name: 'Perambalur Officer', organization: 'District Command', designation: 'Veterinary Dispensary Campus', location: 'Perambalur', contact: '9445001205' },
  { id: '25', name: 'Pudukkottai Officer', organization: 'District Command', designation: 'Dairy Farm Premises', location: 'Pudukkottai', contact: '9445001218' },
  { id: '26', name: 'Ramanathapuram Officer', organization: 'District Command', designation: 'Collectorate Complex', location: 'Ramanathapuram', contact: '9445001118' },
  { id: '27', name: 'Ranipet Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Ranipet', contact: '9445001212' },
  { id: '28', name: 'Salem Officer', organization: 'District Command', designation: 'Veterinary Polyclinic Campus', location: 'Salem', contact: '9445001129' },
  { id: '29', name: 'Sivagangai Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Sivagangai', contact: '9445001123' },
  { id: '30', name: 'Tenkasi Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Tenkasi', contact: '9445001208' },
  { id: '31', name: 'Thanjavur Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Thanjavur', contact: '9445001124' },
  { id: '32', name: 'Theni Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Theni', contact: '9445001122' },
  { id: '33', name: 'Thoothukudi Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Thoothukudi', contact: '9445001130' },
  { id: '34', name: 'Tiruchirappalli Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Trichy', contact: '9445032510' },
  { id: '35', name: 'Tirunelveli Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Tirunelveli', contact: '9445001131' },
  { id: '36', name: 'Tirupathur Officer', organization: 'District Command', designation: 'Collectorate Campus', location: 'Tirupathur', contact: '9443244662' },
  { id: '37', name: 'Tiruppur Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Tiruppur', contact: '9445001211' },
  { id: '38', name: 'Tiruvallur Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Tiruvallur', contact: '9445001110' },
  { id: '39', name: 'Tiruvannamalai Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Tiruvannamalai', contact: '9445001119' },
  { id: '40', name: 'Tiruvarur Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Tiruvarur', contact: '9445001125' },
  { id: '41', name: 'Vellore Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Vellore', contact: '9445001108' },
  { id: '42', name: 'Viluppuram Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Viluppuram', contact: '9445001117' },
  { id: '43', name: 'Virudhunagar Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Virudhunagar', contact: '9445001128' },
  { id: '44', name: 'Kanyakumari Officer', organization: 'District Command', designation: 'Veterinary Hospital Campus', location: 'Nagercoil', contact: '9445001132' }
];

export const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Biosecurity Protocol for Namakkal Poultry Belt',
    summary: 'Essential guidelines for farm owners to prevent the TN-H5N1-NG strain spread in high-density poultry zones.',
    content: 'Namakkal district, known as the egg basket of South India, is currently under enhanced surveillance following reports of avian influenza variants in neighboring regions. The State Animal Husbandry Department has issued a mandatory Bio-Security Level 2 (BSL-2) protocol for all poultry farms with over 5,000 birds. This includes restricted entry for unauthorized personnel and mandatory vehicle disinfection at farm gates.\n\nAll farm owners are instructed to maintain strictly closed housing systems to prevent contact with wild migratory birds, which are identified as the primary vectors for the H5N1 virus. Water sources must be chlorinated, and feed storage areas must be secured against rodents and wild birds. Daily mortality logs must be submitted to the local Veterinary Assistant Surgeon (VAS) without fail, even if the count is zero.\n\nIn case of sudden mortality exceeding 1% in a single day, the farm must be immediately quarantined. Workers are required to wear Personal Protective Equipment (PPE), including masks and gloves, while handling birds. The government has mobilized mobile rapid response teams to perform random swabbing and serum sampling across the Namakkal poultry clusters.',
    author: 'Dr. P. Rajesh, DVO Namakkal',
    date: '2024-05-18',
    category: 'Emergency',
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    title: 'Lumpy Skin Disease: Containment Strategies in Erode',
    summary: 'A detailed study on the recent LSD surge in cattle and the effectiveness of goat pox vaccines in cross-bred populations.',
    content: 'The recent outbreak of Lumpy Skin Disease (LSD) in the Erode-Gobi belt has prompted a massive investigation into the efficacy of the heterologous Goat Pox vaccine. Epidemiological data suggests that cross-bred cattle, particularly Jersey and Holstein Friesian crosses, show higher vulnerability to the virus. The Department has already administered over 50,000 doses of the vaccine in the affected blocks, reporting a 92% reduction in new clinical cases post-vaccination.\n\nContainment strategies focus on vector control, as LSD is primarily transmitted by biting flies, mosquitoes, and ticks. Farmers are advised to maintain clean cattle sheds and use insect repellents or smoke to keep vectors away during peak twilight hours. Movement of cattle from Erode to neighboring districts like Tiruppur and Karur has been temporarily restricted at check posts to break the chain of transmission.\n\nClinical management of infected animals involves isolation and symptomatic treatment to prevent secondary bacterial infections. High-fever cases are treated with antipyretics, and skin lesions are managed with antiseptic sprays. The government has announced a compensation scheme for farmers who have lost high-yielding milch cows to the disease, provided the death is verified by a government necropsy.',
    author: 'Dr. M. Geetha, State Epidemiologist',
    date: '2024-05-20',
    category: 'Research',
    imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    title: 'Rabies Prevention: Zero-Death Target by 2030',
    summary: 'Tamil Nadu government announces a massive anti-rabies vaccination drive for stray dogs in urban clusters.',
    content: 'In line with the National Action Plan for Rabies Elimination (NAPRE), Tamil Nadu has launched the "Zero-By-30" initiative focusing on urban centers like Chennai, Coimbatore, and Madurai. The program aims to achieve 70% vaccination coverage among the stray dog population to establish effective herd immunity. Collaborative efforts between Municipal Corporations and Animal Welfare Organizations (AWOs) are being scaled up to ensure systematic capture, vaccination, and release (CVR).\n\nPublic awareness campaigns are being intensified in schools and residential areas to educate citizens on post-exposure prophylaxis (PEP). The availability of Anti-Rabies Vaccine (ARV) and Rabies Immunoglobulin (RIG) has been ensured in all Primary Health Centers (PHCs) across the state. A centralized digital registry is being developed to track dog bite incidents and monitor the vaccination status of domestic pets through a QR-coded collar system.\n\nSpecialized training programs are being conducted for veterinary professionals and animal handlers on humane dog catching techniques and cold-chain management of vaccines. The state is also exploring the feasibility of oral rabies vaccines (ORV) for difficult-to-catch free-roaming dogs in forested fringes. Community participation is identified as the cornerstone of this program, with local "Animal Sentinels" being trained to report suspicious canine behavior.',
    author: 'Dr. S. Karthikeyan, Director',
    date: '2024-05-22',
    category: 'Announcement',
    imageUrl: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    title: 'Foot and Mouth Disease: Seasonal Vaccination Calendar',
    summary: 'Coordinating the biannual FMD vaccination drive across all 38 districts to ensure 100% herd immunity.',
    content: 'The 25th round of the National Animal Disease Control Programme (NADCP) for Foot and Mouth Disease (FMD) is scheduled to commence next month. This massive exercise aims to vaccinate over 2.5 crore cattle and buffaloes across Tamil Nadu. The vaccination calendar is strategically timed before the onset of the monsoon to provide maximum protection during high-risk seasons. Logistics for cold-chain maintenance have been audited at the block level to ensure vaccine potency.\n\nMicro-level planning is being implemented where each village is assigned a specific date and time for the vaccination camp. Farmers are requested to bring their animals to the designated collection points and ensure they are ear-tagged for digital tracking on the INAPH portal. Tagging is mandatory for the animals to be eligible for future government schemes and movement certificates. Over 5,000 temporary vaccinators have been recruited to support the core veterinary staff.\n\nPost-vaccination monitoring will be conducted to evaluate the sero-conversion rates in different agro-climatic zones. Farmers are advised that a slight drop in milk yield or localized swelling at the injection site is a normal immune response and should subside within 48 hours. The government is also providing free mineral mixture packets to all farmers who participate in the vaccination drive as an incentive to improve overall herd health.',
    author: 'Livestock Development Board',
    date: '2024-05-25',
    category: 'Prevention',
    imageUrl: 'https://images.unsplash.com/photo-1547407139-3c921a66005c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '5',
    title: 'Anthrax Awareness: Soil-Borne Pathogen Safety',
    summary: 'Protocols for handling sudden mortality in endemic zones to prevent human transmission and soil contamination.',
    content: 'Anthrax, caused by Bacillus anthracis, remains a threat in certain soil-endemic patches of Northern Tamil Nadu. The spores can remain dormant in the soil for decades, surfacing during heavy rains or construction activities. Public health officials have issued a high-alert protocol for "sudden deaths" in livestock, where animals die with bleeding from natural orifices. Such carcasses must NEVER be opened for post-mortem as exposure to air triggers spore formation.\n\nDeep burial of the carcass with lime at a depth of at least 6 feet is mandatory to prevent environmental contamination and scavenging by wild animals. The area where the animal died must be disinfected with 10% formaldehyde or strong bleach. All livestock within a 5km radius of a confirmed Anthrax case must be vaccinated with the Live Spore Vaccine. Humans who have had direct contact with the infected animal or carcass must report to the nearest hospital for prophylactic antibiotics.\n\nSurveillance teams are monitoring historical "hotbeds" using GIS mapping to predict potential outbreaks based on rainfall patterns. Educational workshops are being held for local community leaders and traditional healers to recognize the symptoms of cutaneous anthrax in humans. The "Search and Secure" protocol ensures that any unidentified mortality in forests or grazing lands is treated with the highest degree of bio-hazard caution until laboratory confirmation.',
    author: 'Public Health Department',
    date: '2024-05-28',
    category: 'Emergency',
    imageUrl: 'https://images.unsplash.com/photo-1596733430284-f7437f61c1d9?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '6',
    title: 'Brucellosis Screening in Organized Dairy Farms',
    summary: 'Mandatory testing requirements for all dairy collectives to ensure safe milk production and worker safety.',
    content: 'Brucellosis is a critical zoonotic disease that affects both livestock productivity and human health, particularly dairy farmers and veterinarians. The state has launched a mandatory screening program for all organized dairy farms with ten or more milch animals. Bulk Milk ELISA (B-ELISA) tests are being utilized for rapid screening of large herds, followed by individual Rose Bengal Plate Tests (RBPT) for positive clusters.\n\nInfected animals often suffer from late-term abortions and reduced milk yield, serving as a constant source of infection in the farm environment. The Department recommends the vaccination of heifer calves between 4 and 8 months of age with the S19 strain to provide life-long immunity. Strict biosecurity measures, including proper disposal of placental membranes and disinfection of calving pens, are essential to prevent the intra-farm spread of the bacteria.\n\nPublic health linkage is being established to screen farm workers who report persistent undulant fever and joint pains. Training sessions on safe milk handling and the importance of pasteurization are being conducted for rural milk collection centers. The government is also working on a "Certified Brucella-Free Farm" accreditation system to encourage better health management practices and provide a premium for milk from such certified sources.',
    author: 'Milk Commissioner Office',
    date: '2024-06-01',
    category: 'Prevention',
    imageUrl: 'https://images.unsplash.com/photo-1595273670150-db0a3d39d444?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '7',
    title: 'African Swine Fever: Surveillance at Border Zones',
    summary: 'Enhanced monitoring of pig farms near state borders following reports of ASF in neighboring regions.',
    content: 'African Swine Fever (ASF) poses a significant threat to the burgeoning pig farming sector in Tamil Nadu. While no active cases have been reported within state borders this month, the recent surge in neighboring states has necessitated a "High-Alert Status." Check posts at border districts like Hosur and Coimbatore have been instructed to strictly prohibit the entry of live pigs, pork products, and even feed from infected zones.\n\nASF is a highly contagious viral disease with nearly 100% mortality in domestic pigs, and there is currently no effective vaccine. Biosecurity is the only defense; farmers are urged to stop feeding swill (hotel/kitchen waste) to pigs, as the virus can survive in processed meat for months. All pig farm entries must be restricted, and dedicated footwear must be used for each unit. Any sudden death of pigs must be reported within 2 hours to the veterinary emergency number.\n\nSurveillance teams are conducting regular sampling of feral pig populations in forested areas to monitor potential viral entry into the wildlife cycle. Awareness meetings for tribal communities and traditional pig rearers are being held to explain the clinical signs, such as high fever, loss of appetite, and hemorrhages on the skin. The government has prepared a contingency plan for rapid culling and scientific disposal if an outbreak is confirmed, ensuring fair compensation for affected farmers.',
    author: 'Dr. V. Anand, Border Quarantine',
    date: '2024-06-05',
    category: 'Emergency',
    imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '8',
    title: 'PPR Vaccination: Protecting Small Ruminants',
    summary: 'Strategic mass mapping of sheep and goat populations for the Sheep Pox and PPR eradication program.',
    content: 'Peste des Petits Ruminants (PPR), often called "Goat Plague," is a major economic threat to small-scale farmers in Tamil Nadu. Under the Eradication Programme, a state-wide mass vaccination drive is targeting 100% of the sheep and goat population. Mapping of migratory shepherd routes is being carried out to ensure that mobile herds are not missed during the campaign. Each vaccinated animal is being ear-tagged with a specialized 12-digit UID for record-keeping.\n\nThe PPR vaccine provides long-term immunity, and the current goal is to achieve "PPR-Free" status for the state by 2027. Local veterinary dispensaries are serving as hubs for distributing deworming medicines along with the vaccines to improve the overall resilience of the animals. Village-level "Animal Health Committees" are being formed to help mobilize small ruminant owners and manage the logistics of the vaccination camps.\n\nClinical signs of PPR include high fever, nasal discharge, and severe diarrhea, often leading to rapid dehydration and death. Farmers are advised to isolate new purchases for 21 days before introducing them to the main herd. The government is also providing training for para-veterinarians on the correct sub-cutaneous injection technique for the PPR vaccine. Serological surveys will follow the drive to confirm that protective antibody levels have been achieved across the various districts.',
    author: 'State Animal Husbandry Dept',
    date: '2024-06-10',
    category: 'Prevention',
    imageUrl: 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '9',
    title: 'One Health: Wild-Life Interface Monitoring',
    summary: 'Collaborative initiative between Forest and Veterinary departments to monitor zoonotic spillover risk.',
    content: 'The "One Health" framework integrates human, animal, and environmental health to address complex biosecurity challenges. In the Western Ghats region of Tamil Nadu, a new pilot project is monitoring the interface between domestic livestock and wildlife. This initiative aims to detect pathogens that could potentially "spillover" from wild species to livestock or humans, particularly Focused on Kyasanur Forest Disease (KFD) and Nipah virus.\n\nSurveillance includes systematic testing of water holes and grazing lands shared by both wild herbivores and domestic cattle. Forest guards are being trained to perform "non-invasive" sampling, such as collecting fecal matter and environmental DNA (eDNA), which are then analyzed at the State Level Diagnostic Laboratory. This data is being used to create "Risk Maps" that help local health authorities prepare for seasonal peaks in zoonotic activity.\n\nThe project also emphasizes the importance of vaccinated "Buffer Zones" around protected forest areas. Livestock in these fringe villages receive priority vaccination and regular health check-ups to act as a protective barrier against cross-species transmission. Inter-departmental coordination meetings are held monthly to share data on wildlife mortality and human fever clusters, ensuring a rapid and integrated response to any emerging health threat at the forest interface.',
    author: 'Wildlife Health Unit',
    date: '2024-06-15',
    category: 'Research',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '10',
    title: 'IoT Implementation in Early Warning Systems',
    summary: 'Pilot program using wearable sensors for real-time temperature monitoring and early sickness detection.',
    content: 'Digital transformation is reaching the livestock sector through the pilot implementation of Internet of Things (IoT) sensors in organized dairy farms. These wearable neck-bands monitor ruminant behavior, activity levels, and core body temperature in real-time. The data is transmitted to a cloud-based AI platform that can detect the "prodromal" (pre-clinical) signs of illness before the animal shows visible symptoms like loss of appetite or fever.\n\nEarly detection of diseases like Mastitis or FMD can save thousands of rupees in treatment costs and prevent major production losses. The system sends an automated "Alert Notification" to the farmer\'s mobile app if an animal\'s metrics deviate from its baseline. This allows for immediate isolation and targeted veterinary intervention, significantly reducing the use of broad-spectrum antibiotics and improving animal welfare.\n\nThe pilot program in the Coimbatore cluster has shown a 25% improvement in early clinical intervention and a 10% increase in overall reproductive efficiency through precise heat detection. The state government is now evaluating a subsidy model to make this technology accessible to small-scale dairy cooperatives. Future updates will include geofencing capabilities to track grazing herds and prevent theft or loss in difficult terrains.',
    author: 'TANUVAS Research Wing',
    date: '2024-06-20',
    category: 'Research',
    imageUrl: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800'
  }
];

export const RISK_PREDICTIONS: RiskPrediction[] = [
  { district: 'Madurai', riskScore: 85, dominantThreat: 'Lumpy Skin Disease', lastUpdated: '2026-02-15' },
  { district: 'Theni', riskScore: 45, dominantThreat: 'FMD', lastUpdated: '2026-02-15' },
  { district: 'Dindigul', riskScore: 65, dominantThreat: 'Anthrax', lastUpdated: '2026-02-15' },
  { district: 'Trichy', riskScore: 30, dominantThreat: 'None', lastUpdated: '2026-02-15' },
  { district: 'Salem', riskScore: 55, dominantThreat: 'Brucellosis', lastUpdated: '2026-02-15' },
  { district: 'Erode', riskScore: 20, dominantThreat: 'None', lastUpdated: '2026-02-15' }
];

export const HISTORICAL_DATA: HistoricalStats[] = [
  { year: 2020, totalCases: 3200, mortalityRate: 4.2, vaccinationCoverage: 65, topDisease: 'FMD' },
  { year: 2021, totalCases: 2900, mortalityRate: 3.8, vaccinationCoverage: 72, topDisease: 'FMD' },
  { year: 2022, totalCases: 2100, mortalityRate: 3.1, vaccinationCoverage: 81, topDisease: 'Lumpy Skin' },
  { year: 2023, totalCases: 1800, mortalityRate: 2.5, vaccinationCoverage: 88, topDisease: 'Lumpy Skin' }
];
