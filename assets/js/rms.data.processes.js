(function (global) {
    const defaultProcesses = [
        { value: 'client-onboarding-kyc', label: 'Client onboarding & KYC', referents: ['Amina El Mansouri — Chief Compliance Officer', 'Marc Laurent — B2B Partnership Director'] },
        { value: 'luxury-travel-design', label: 'Luxury travel design', referents: ['Karim Haddad — VP Luxury Operations'] },
        { value: 'supplier-sourcing-due-diligence', label: 'Supplier sourcing & due diligence', referents: ['Amina El Mansouri — Chief Compliance Officer', 'Marc Laurent — B2B Partnership Director'] },
        { value: 'vip-guest-operations', label: 'VIP guest operations', referents: ['Karim Haddad — VP Luxury Operations', 'Raka Santoso — Indonesia Premium Markets Lead'] },
        { value: 'payments-deposits-refunds', label: 'Payments, deposits & refunds', referents: ['Amina El Mansouri — Chief Compliance Officer'] },
        { value: 'data-privacy-guest-confidentiality', label: 'Data privacy & guest confidentiality', referents: ['Sofia Rahman — Data Protection & Guest Privacy Lead'] },
        { value: 'sanctions-restricted-party-screening', label: 'Sanctions and restricted-party screening', referents: ['Amina El Mansouri — Chief Compliance Officer'] },
        { value: 'complaints-incidents-crisis-handling', label: 'Complaints, incidents & crisis handling', referents: ['Karim Haddad — VP Luxury Operations', 'Sofia Rahman — Data Protection & Guest Privacy Lead'] },
        { value: 'partner-relationship-management', label: 'Partner relationship management', referents: ['Marc Laurent — B2B Partnership Director'] }
    ];

    const defaultSubProcesses = {
        'client-onboarding-kyc': [
            {
                value: 'client-identity-verification',
                label: 'Client identity verification',
                referents: ['Amina El Mansouri — Chief Compliance Officer']
            },
            {
                value: 'ubo-source-of-funds-review',
                label: 'UBO and source-of-funds review',
                referents: ['Amina El Mansouri — Chief Compliance Officer']
            },
            {
                value: 'travel-profile-consent-capture',
                label: 'Travel profile and consent capture',
                referents: ['Sofia Rahman — Data Protection & Guest Privacy Lead']
            },
            {
                value: 'b2b-account-approval',
                label: 'B2B account approval',
                referents: ['Marc Laurent — B2B Partnership Director']
            }
        ],
        'luxury-travel-design': [
            {
                value: 'guest-preferences-discovery',
                label: 'Guest preferences discovery',
                referents: ['Karim Haddad — VP Luxury Operations']
            },
            {
                value: 'bespoke-itinerary-curation',
                label: 'Bespoke itinerary curation',
                referents: ['Karim Haddad — VP Luxury Operations']
            },
            {
                value: 'turkey-market-experience-design',
                label: 'Turkey market experience design',
                referents: ['Leila Demir — Turkey Market Director']
            },
            {
                value: 'indonesia-premium-market-design',
                label: 'Indonesia premium market design',
                referents: ['Raka Santoso — Indonesia Premium Markets Lead']
            }
        ],
        'supplier-sourcing-due-diligence': [
            {
                value: 'supplier-market-scan',
                label: 'Supplier market scan',
                referents: ['Marc Laurent — B2B Partnership Director']
            },
            {
                value: 'supplier-compliance-questionnaire',
                label: 'Supplier compliance questionnaire',
                referents: ['Amina El Mansouri — Chief Compliance Officer']
            },
            {
                value: 'onsite-quality-review',
                label: 'Onsite quality and service review',
                referents: ['Karim Haddad — VP Luxury Operations']
            },
            {
                value: 'contracting-and-recertification',
                label: 'Contracting and periodic recertification',
                referents: ['Marc Laurent — B2B Partnership Director']
            }
        ],
        'vip-guest-operations': [
            {
                value: 'arrival-departure-orchestration',
                label: 'Arrival and departure orchestration',
                referents: ['Karim Haddad — VP Luxury Operations']
            },
            {
                value: 'chauffeur-and-security-coordination',
                label: 'Chauffeur and security coordination',
                referents: ['Karim Haddad — VP Luxury Operations']
            },
            {
                value: 'villa-yacht-jet-readiness',
                label: 'Villa, yacht and jet readiness',
                referents: ['Raka Santoso — Indonesia Premium Markets Lead']
            },
            {
                value: 'in-stay-concierge-monitoring',
                label: 'In-stay concierge monitoring',
                referents: ['Karim Haddad — VP Luxury Operations']
            }
        ],
        'payments-deposits-refunds': [
            {
                value: 'quote-approval-and-deposit-call',
                label: 'Quote approval and deposit call',
                referents: ['Karim Haddad — VP Luxury Operations']
            },
            {
                value: 'escrow-and-supplier-prepayments',
                label: 'Escrow and supplier prepayments',
                referents: ['Amina El Mansouri — Chief Compliance Officer']
            },
            {
                value: 'refund-exception-approval',
                label: 'Refund exception approval',
                referents: ['Amina El Mansouri — Chief Compliance Officer']
            },
            {
                value: 'corporate-invoicing-reconciliation',
                label: 'Corporate invoicing and reconciliation',
                referents: ['Marc Laurent — B2B Partnership Director']
            }
        ],
        'data-privacy-guest-confidentiality': [
            {
                value: 'guest-data-minimization',
                label: 'Guest data minimization',
                referents: ['Sofia Rahman — Data Protection & Guest Privacy Lead']
            },
            {
                value: 'vip-confidentiality-protocols',
                label: 'VIP confidentiality protocols',
                referents: ['Sofia Rahman — Data Protection & Guest Privacy Lead']
            },
            {
                value: 'secure-sharing-with-partners',
                label: 'Secure sharing with partners',
                referents: ['Sofia Rahman — Data Protection & Guest Privacy Lead']
            },
            {
                value: 'retention-and-deletion-controls',
                label: 'Retention and deletion controls',
                referents: ['Sofia Rahman — Data Protection & Guest Privacy Lead']
            }
        ],
        'sanctions-restricted-party-screening': [
            {
                value: 'client-screening-before-booking',
                label: 'Client screening before booking',
                referents: ['Amina El Mansouri — Chief Compliance Officer']
            },
            {
                value: 'supplier-and-agent-screening',
                label: 'Supplier and agent screening',
                referents: ['Amina El Mansouri — Chief Compliance Officer']
            },
            {
                value: 'market-specific-restricted-party-review',
                label: 'Market-specific restricted-party review',
                referents: ['Leila Demir — Turkey Market Director', 'Raka Santoso — Indonesia Premium Markets Lead']
            },
            {
                value: 'hit-escalation-and-clearance',
                label: 'Hit escalation and clearance',
                referents: ['Amina El Mansouri — Chief Compliance Officer']
            }
        ],
        'complaints-incidents-crisis-handling': [
            {
                value: 'guest-complaint-triage',
                label: 'Guest complaint triage',
                referents: ['Karim Haddad — VP Luxury Operations']
            },
            {
                value: 'supplier-service-incident-response',
                label: 'Supplier service incident response',
                referents: ['Marc Laurent — B2B Partnership Director']
            },
            {
                value: 'medical-security-crisis-escalation',
                label: 'Medical and security crisis escalation',
                referents: ['Karim Haddad — VP Luxury Operations']
            },
            {
                value: 'privacy-incident-notification',
                label: 'Privacy incident notification',
                referents: ['Sofia Rahman — Data Protection & Guest Privacy Lead']
            }
        ],
        'partner-relationship-management': [
            {
                value: 'partner-segmentation-and-tiering',
                label: 'Partner segmentation and tiering',
                referents: ['Marc Laurent — B2B Partnership Director']
            },
            {
                value: 'performance-review-and-scorecards',
                label: 'Performance review and scorecards',
                referents: ['Marc Laurent — B2B Partnership Director']
            },
            {
                value: 'joint-marketing-and-referral-controls',
                label: 'Joint marketing and referral controls',
                referents: ['Marc Laurent — B2B Partnership Director']
            },
            {
                value: 'renewal-exit-and-blacklisting',
                label: 'Renewal, exit and blacklisting',
                referents: ['Amina El Mansouri — Chief Compliance Officer', 'Marc Laurent — B2B Partnership Director']
            }
        ]
    };

    global.RMS_DEFAULT_PROCESS_CONFIG = Object.freeze({
        processes: Object.freeze(defaultProcesses.map(process => Object.freeze({ ...process }))),
        subProcesses: Object.freeze(Object.keys(defaultSubProcesses).reduce((acc, key) => {
            acc[key] = Object.freeze(defaultSubProcesses[key].map(item => Object.freeze({ ...item })));
            return acc;
        }, {}))
    });
})(typeof window !== 'undefined' ? window : globalThis);
