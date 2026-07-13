import type { KnowledgeDoc } from './types';

// A dozen short knowledge entries so RAG has real, varied content to retrieve.
// Feel free to add more or replace with real content from your job.
export const seedDocs: KnowledgeDoc[] = [
  {
    id: 'kb-001',
    title: 'Standard Checked Baggage Allowance',
    content: 'Most major airlines (Delta, United, American) allow 1 free checked bag (up to 50 lbs / 23kg) on international economy fares. Domestic economy fares typically charge $30-40 for the first checked bag unless you hold elite status or a co-branded credit card.',
    source_type: 'baggage'
  },
  {
    id: 'kb-002',
    title: 'Carry-On Size Restrictions',
    content: 'Standard carry-on dimensions are 22 x 14 x 9 inches (56 x 36 x 23 cm), including wheels and handles. Personal items (purse, laptop bag) must fit under the seat in front of you. Budget carriers like Spirit and Frontier often charge extra even for standard carry-ons.',
    source_type: 'baggage'
  },
  {
    id: 'kb-003',
    title: 'US Visa Waiver Program (ESTA) Overview',
    content: 'Citizens of Visa Waiver Program countries (UK, most EU nations, Australia, Japan, etc.) can travel to the US for up to 90 days for tourism/business without a visa, but must obtain ESTA authorization online before departure. Cost is $21, valid for 2 years or until passport expiry.',
    source_type: 'visa_info'
  },
  {
    id: 'kb-004',
    title: 'Schengen Visa Requirements',
    content: 'Non-EU travelers visiting Schengen Area countries for tourism need a Schengen visa unless their nationality is exempt. Applications should be submitted 15-90 days before travel, require proof of accommodation, travel insurance with 30,000 EUR minimum coverage, and financial means.',
    source_type: 'visa_info'
  },
  {
    id: 'kb-005',
    title: 'Flight Cancellation and Refund Policy',
    content: 'Under DOT rules, US airlines must offer a full refund if they cancel or significantly delay (3+ hours domestic, 6+ hours international) a flight and the passenger chooses not to travel. Refunds must be processed within 7 business days for credit card payments.',
    source_type: 'faq'
  },
  {
    id: 'kb-006',
    title: 'Layover Duration Recommendations',
    content: 'Recommended minimum layover times: domestic-to-domestic 45-60 minutes, domestic-to-international 90 minutes, international-to-international 2-3 hours, especially when changing terminals or requiring re-screening.',
    source_type: 'faq'
  },
  {
    id: 'kb-007',
    title: 'Pet Travel Policy',
    content: 'Small pets (under 20 lbs combined with carrier) can typically travel in-cabin for a fee ($95-125 on most US carriers). Larger pets must travel as checked baggage or cargo, with breed and temperature restrictions varying by airline. Health certificates required within 10 days of travel for most airlines.',
    source_type: 'faq'
  },
  {
    id: 'kb-008',
    title: 'Frequent Flyer Elite Status Benefits',
    content: 'Elite status tiers (Silver/Gold/Platinum equivalents) typically include free checked bags, priority boarding, complimentary upgrades when available, lounge access at higher tiers, and bonus miles earning (typically 1.25x to 2x base rate).',
    source_type: 'faq'
  },
  {
    id: 'kb-009',
    title: 'Best Time to Book Domestic Flights',
    content: 'Data consistently shows booking domestic US flights 1-3 months in advance yields the best average prices. Tuesday/Wednesday departures tend to be cheaper than Friday/Sunday. Booking on Tuesday afternoons often catches fare sales before they expire.',
    source_type: 'faq'
  },
  {
    id: 'kb-010',
    title: 'Travel Insurance Coverage Basics',
    content: 'Comprehensive travel insurance typically covers trip cancellation/interruption (reimbursing 100-150% of trip cost), emergency medical (often $50,000-100,000), medical evacuation, and baggage loss. Costs range from 4-10% of total trip cost depending on age and coverage level.',
    source_type: 'faq'
  },
  {
    id: 'kb-011',
    title: 'Currency and Payment Tips Abroad',
    content: 'Notify your bank of travel dates to avoid fraud holds. Airport currency exchange kiosks typically have the worst rates (5-10% markup); ATM withdrawals abroad usually offer better rates minus a flat fee. Always decline "dynamic currency conversion" at foreign card terminals and pay in local currency.',
    source_type: 'faq'
  },
  {
    id: 'kb-012',
    title: 'Bonus Queue Lead Handling Reminder',
    content: 'When following up on a Bonus Queue lead, confirm the customer is still looking for a flight, offer at least one price quote option, and log the interaction in the follow-up file with agent comments for tracking purposes.',
    source_type: 'internal_process'
  }
];
