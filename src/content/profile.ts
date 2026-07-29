/**
 * ============================================================================
 *  SINGLE SOURCE OF TRUTH FOR ALL SITE COPY
 * ============================================================================
 *
 *  Every word rendered by this site comes from this file. All of it was
 *  transcribed from `TAVu_Ecommerce.pdf` (the résumé). Nothing here is invented.
 *
 *  ⚠  IDENTITY NOTE — READ BEFORE DEPLOYING
 *  The original build brief named "Tony (Khoi Nguyen) Tran" as the subject, but
 *  the attached résumé belongs to **Truong An Vu** (different name, email, phone
 *  and LinkedIn), and "TAVU" is that person's initials. The brief's own rule is
 *  "if anything conflicts with the PDF, the PDF wins" — so the site is built as
 *  Truong An Vu's portfolio. If it is meant to be someone else's, DO NOT simply
 *  swap the name: the eBay credentials, GMV ranks, GPA and certifications below
 *  belong to the résumé's owner and cannot transfer with it.
 *
 *  To swap in a new résumé: replace the values below. Anything not found in the
 *  source document must be marked `TO_CONFIRM(...)` so it renders as a visible
 *  placeholder rather than silently disappearing or being made up.
 * ============================================================================
 */

/** A value that is either real, or explicitly marked as missing from the PDF. */
export type Confirmable<T> = T | { __toConfirm: string };

/** Wraps a value that is NOT in the source PDF, so the UI can flag it visibly. */
export const TO_CONFIRM = (label: string): Confirmable<never> => ({ __toConfirm: label });

export const isToConfirm = (v: unknown): v is { __toConfirm: string } =>
  typeof v === 'object' && v !== null && '__toConfirm' in v;

/* Explicit shapes below: without them `as const` narrows a TO_CONFIRM field to
   exactly the placeholder type, and the "real value" branch becomes unreachable
   — so filling a placeholder in would be a type error. */

interface Contact {
  email: string;
  phone: string;
  linkedin: { label: string; href: string };
  github: Confirmable<string>;
  store: Confirmable<string>;
  headshot: Confirmable<string>;
  closingLine: string;
}

interface Project {
  name: string;
  tagline: string;
  stack: readonly string[];
  liveUrl: Confirmable<string>;
  codeUrl: Confirmable<string>;
  bullets: readonly string[];
}

interface Certification {
  name: string;
  issuer: string;
  year: string;
  /** From the Open Badge credential files, so the badge can show currency. */
  issued?: string;
  expires?: string;
  credentialUrl: Confirmable<string>;
}

export const identity = {
  name: 'Truong An Vu',
  /** The e-commerce venture / store brand. Initials of the operator. */
  brand: 'TAVU',
  title: 'E-commerce Operations',
  location: 'Hurstville, NSW 2220',
  workRights: 'Full working rights — Temporary Graduate visa (subclass 485)',
  /** One-line value prop, condensed from the résumé's professional summary. */
  valueProp:
    'I run an independent eBay store end to end — and read the exports myself, down to the fee line.',
  summary:
    'E-commerce operator who scaled an independent eBay store to Top Rated Seller status over 20 months – A$19.9K across 128 transactions in the trailing 12 months, a 100% positive feedback score, and a 0% return rate. Ranks in the top 3% of 4,506 Australian sellers by GMV in its primary category. Owns the full commercial cycle: inventory planning, listing and search optimisation, cross-border fulfilment to 11 countries, and per-listing P&L that holds platform costs to 14% of gross revenue. Graduating Bachelor of Information Technology at UTS (Aug 2026) with SQL and full-stack development capability. Seeking an E-commerce Operations role in Sydney.',
  /** Hero stat chips. Sourced from the résumé, not from the CSV aggregates. */
  chips: [
    'E-commerce Operations',
    'Sydney, Australia',
    'BIT @ UTS — WAM 78.31',
    'eBay Top Rated Seller',
  ],
} as const;

export const contact: Contact = {
  email: 'truonganvu1203@gmail.com',
  phone: '+61 451 557 401',
  linkedin: {
    label: 'linkedin.com/in/truong-an-vu-2023b939b',
    href: 'https://www.linkedin.com/in/truong-an-vu-2023b939b',
  },
  github: 'https://github.com/adgtristy-ux',
  store: 'https://www.ebay.com.au/str/adgt36',
  /**
   * Save the portrait to `public/portrait.jpg` — the file is not in the repo.
   * Swap back to TO_CONFIRM('Headshot image') to show the placeholder again.
   */
  headshot: '/portrait.jpg',
  closingLine: 'Let’s build something good.',
};

/** Marquee strip under the hero. Drawn from the résumé skills block. */
export const marquee = [
  'Listing optimisation',
  'Promoted Listings',
  'Cross-border fulfilment',
  'Inventory & pricing',
  'Per-listing P&L',
  'SQL / PostgreSQL',
  'Python',
  'React',
  'Next.js',
  'Excel — PivotTables, XLOOKUP',
  'KNIME',
  'Dispute resolution',
  'Demand planning',
  'Agile / SDLC',
] as const;

/**
 * Skill groups.
 *
 * The brief asked for a "ML & AI" group. The résumé contains no machine-learning
 * or AI experience, so that group is deliberately omitted rather than fabricated.
 * "Ways of Working" and "Languages" (spoken) replace it — both are in the source.
 */
export const skillGroups = [
  {
    label: 'E-commerce & Analytics',
    items: [
      'eBay Seller Hub',
      'Listing optimisation',
      'Promoted Listings',
      'Inventory & pricing management',
      'Cross-border fulfilment',
      'Dispute resolution',
      'Microsoft Excel (PivotTables, XLOOKUP, forecasting)',
      'Google Sheets',
      'KNIME data visualisation',
      'Shopify (familiar)',
      'Shopee (familiar)',
    ],
  },
  {
    label: 'Languages',
    items: ['Python', 'Java', 'C++', 'SQL'],
  },
  {
    label: 'Frameworks & Libraries',
    items: ['React', 'Next.js', 'REST APIs'],
  },
  {
    label: 'Infra & Tools',
    items: ['PostgreSQL', 'Git', 'Trello', 'KNIME'],
  },
  {
    label: 'Ways of Working',
    items: ['Agile', 'SDLC', 'Risk and Issue Management'],
  },
  {
    label: 'Spoken',
    items: ['English — Professional Working', 'Vietnamese — Native'],
  },
] as const;

export const education = [
  {
    degree: 'Bachelor of Information Technology',
    institution: 'University of Technology Sydney (UTS)',
    location: 'Sydney, Australia',
    period: '2024 – 2026',
    details: [
      'GPA: 5.81/7.0 – WAM: 78.31',
      'Major: Networking and Cybersecurity',
      'Graduation: Aug 2026',
    ],
    coursework: [
      'Cybersecurity',
      'Mobile Networking',
      'Cloud Computing and Software as a Service',
      'Data Structures and Algorithms',
      'Project Management and the Professional',
      'Internetworking Project',
    ],
  },
  {
    degree: 'Diploma of Information Technology',
    institution: 'UTS College',
    location: 'Sydney, Australia',
    period: '2023 – 2024',
    details: ['GPA: 5.0/7.0'],
    coursework: [],
  },
] as const;

export const experience = [
  {
    role: 'Commerce Seller (Part-time)',
    org: 'eBay',
    location: 'Sydney, NSW',
    period: 'Dec 2024 – Present',
    current: true,
    bullets: [
      'Scaled an independent store to eBay Top Rated Seller status, generating A$19.9K across 128 transactions in the trailing 12 months and sustaining a 100% positive feedback score over 214 lifetime orders.',
      'Manage a live catalogue of 116 SKUs across 5 categories at an average order value of A$167, ranking in the top 3% of 4,506 Australian sellers by GMV in its primary collectibles category and 2nd by search impressions.',
      'Grew organic reach to 566K search impressions in a single 31-day period (+238%) at a 1.9% sales conversion rate through item-specific optimisation, keyword-led titles, and a Promoted Listings strategy driving 61% of orders – lifting 90-day sales volume to A$10,049.',
      'Fulfil international orders across 11 countries (21% of revenue), maintaining a 0% return rate, 0% late-shipment rate, and zero unresolved buyer cases over 128 transactions.',
      'Analyse per-listing P&L across final value, promoted-listing, and international selling fees to contain platform costs to 14% of gross revenue, while converting 25% of orders from repeat buyers through post-sale service and inventory expansion into higher-margin collectibles.',
    ],
  },
  {
    role: 'Grocery Team Member (Part-time)',
    org: 'Woolworths Eastgardens',
    location: 'Sydney, NSW',
    period: 'Nov 2023 – Aug 2026',
    current: false,
    bullets: [
      'Maintain stock accuracy across a high-volume grocery section during peak trading periods, managing replenishment cycles for 200+ product lines and minimising out-of-stock gaps on fast-moving items.',
      'Coordinate with team leads to meet delivery-window and shelf-ready deadlines under consistent time pressure.',
      'Sustain 3 shifts weekly alongside full-time study and independent store operations, demonstrating sustained workload management.',
    ],
  },
  {
    role: 'Assistant Accountant (Volunteer)',
    org: 'Cam Nghia 1 Primary School',
    location: 'Khanh Hoa, Vietnam',
    period: 'May 2022 – May 2023',
    current: false,
    bullets: [
      'Processed student tuition fees, meal expenses, and other service charges for 700 students.',
      'Recorded accurate financial records and ledgers, ensuring compliance with educational accounting standards.',
      'Assisted in preparing monthly payroll, including teacher allowances and social insurance documentation.',
      'Organized and archived documents to support internal and external audits.',
    ],
  },
] as const;

export const projects: Project[] = [
  {
    name: 'AnnStore',
    tagline: 'Full-Stack E-commerce & Inventory Management Application',
    stack: ['React', 'Next.js', 'PostgreSQL'],
    liveUrl: 'https://ann-store-three.vercel.app/',
    codeUrl: 'https://github.com/adgtristy-ux/AnnStore',
    bullets: [
      'Built a full-stack storefront and inventory management system, applying operational requirements learned from running a live marketplace store – accurate stock counts, order status visibility, and an audit trail of catalogue changes.',
      'Designed the relational schema and order lifecycle: product catalogue, cart, and checkout with server-side stock validation, so inventory stays consistent when multiple customers purchase concurrently.',
      'Implemented authentication and role-based access control with separate dashboards for customers, store staff, and administrators.',
    ],
  },
];

/** Dates and issuer come from the supplied Open Badge (OB 3.0) credential files. */
export const certifications: Certification[] = [
  {
    name: 'Google Ads Search Professional Certification',
    issuer: 'Google · Skillshop',
    year: '2026',
    issued: '28 Jul 2026',
    expires: '28 Jul 2027',
    credentialUrl: 'https://www.credential.net/dda96a76-19ed-4106-9185-83249896d001',
  },
  {
    name: 'Google Analytics Certification',
    issuer: 'Google · Skillshop',
    year: '2026',
    issued: '28 Jul 2026',
    expires: '28 Jul 2027',
    credentialUrl: 'https://www.credential.net/2273f0ee-9bf3-44fb-91b6-e0842a6f02aa',
  },
];

/**
 * The brief asked for hackathons / awards / volunteering here. The résumé lists
 * no hackathons or awards; the one volunteering entry is the Cam Nghia 1 role,
 * which already appears under Experience and is cross-referenced rather than
 * duplicated. Nothing is invented to fill the section.
 */
export const activities = [
  {
    name: 'Assistant Accountant (Volunteer)',
    org: 'Cam Nghia 1 Primary School — Khanh Hoa, Vietnam',
    period: 'May 2022 – May 2023',
    note: 'Bookkeeping, payroll support and audit preparation for a 700-student school. Detailed under Experience.',
  },
] as const;

export const sections = [
  { id: 'about', num: '01', label: 'About' },
  { id: 'education', num: '02', label: 'Education' },
  { id: 'experience', num: '03', label: 'Experience' },
  { id: 'projects', num: '04', label: 'Projects' },
  { id: 'activities', num: '05', label: 'Activities' },
  { id: 'contact', num: '06', label: 'Contact' },
] as const;
