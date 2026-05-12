(function (global) {
    const defaultProcesses = [
        { value: 'gouvernance', label: 'Gouvernance', referents: ['Nadia Benali — Directrice Gouvernance'] },
        { value: 'developpement-client', label: 'Développement client', referents: ['Alexandre Moreau — Directeur Développement Client'] },
        { value: 'recrutement', label: 'Recrutement', referents: ['Camille Perrin — Responsable Acquisition Talents'] },
        { value: 'delivery-service', label: 'Delivery service', referents: ['Yanis Bouchard — Directeur Delivery Service'] },
        { value: 'qualite', label: 'Qualité', referents: ['Inès Caron — Responsable Excellence Qualité'] },
        { value: 'confidentialite-surete', label: 'Confidentialité & sûreté', referents: ['Sami El Idrissi — Responsable Sûreté & Confidentialité'] },
        { value: 'ressources-humaines', label: 'Ressources humaines', referents: ['Claire Dubois — Directrice Ressources Humaines'] },
        { value: 'facturation-encaissement', label: 'Facturation & encaissement', referents: ['Julien Marchand — Responsable Billing & Cash Collection'] },
        { value: 'achats-fournisseurs', label: 'Achats & fournisseurs', referents: ['Soraya Haddad — Directrice Achats & Fournisseurs'] },
        { value: 'finance', label: 'Finance', referents: ['Thomas Lemaire — Directeur Financier'] },
        { value: 'juridique-compliance', label: 'Juridique & compliance', referents: ['Aïcha Rahmani — Directrice Juridique & Compliance'] },
        { value: 'si-cybersecurite', label: 'SI & cybersécurité', referents: ['Olivier Garnier — Directeur SI & Cybersécurité'] },
        { value: 'communication-reputation', label: 'Communication & réputation', referents: ['Maya Chevalier — Directrice Communication & Réputation'] },
        { value: 'fondation', label: 'Fondation', referents: ['Romain Delattre — Directeur Fondation'] }
    ];

    const defaultSubProcesses = {
        'gouvernance': [
            {
                value: 'gouvernance-instances',
                label: 'Instances',
                referents: ['Nadia Benali — Directrice Gouvernance', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'gouvernance-strategie',
                label: 'Stratégie',
                referents: ['Nadia Benali — Directrice Gouvernance', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'gouvernance-pilotage-filiales',
                label: 'Pilotage filiales',
                referents: ['Nadia Benali — Directrice Gouvernance', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'gouvernance-risques-controle',
                label: 'Risques & contrôle',
                referents: ['Nadia Benali — Directrice Gouvernance', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'gouvernance-reporting',
                label: 'Reporting',
                referents: ['Nadia Benali — Directrice Gouvernance', 'Salma Roche — Référente coordination']
            }
        ],
        'developpement-client': [
            {
                value: 'developpement-client-prospection',
                label: 'Prospection',
                referents: ['Alexandre Moreau — Directeur Développement Client', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'developpement-client-qualification-client',
                label: 'Qualification client',
                referents: ['Alexandre Moreau — Directeur Développement Client', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'developpement-client-offre-pricing',
                label: 'Offre & pricing',
                referents: ['Alexandre Moreau — Directeur Développement Client', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'developpement-client-contractualisation',
                label: 'Contractualisation',
                referents: ['Alexandre Moreau — Directeur Développement Client', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'developpement-client-suivi-client',
                label: 'Suivi client',
                referents: ['Alexandre Moreau — Directeur Développement Client', 'Salma Roche — Référente coordination']
            }
        ],
        'recrutement': [
            {
                value: 'recrutement-planification-rh',
                label: 'Planification RH',
                referents: ['Camille Perrin — Responsable Acquisition Talents', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'recrutement-sourcing',
                label: 'Sourcing',
                referents: ['Camille Perrin — Responsable Acquisition Talents', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'recrutement-selection',
                label: 'Sélection',
                referents: ['Camille Perrin — Responsable Acquisition Talents', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'recrutement-verifications',
                label: 'Vérifications',
                referents: ['Camille Perrin — Responsable Acquisition Talents', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'recrutement-onboarding-rh',
                label: 'Onboarding RH',
                referents: ['Camille Perrin — Responsable Acquisition Talents', 'Salma Roche — Référente coordination']
            }
        ],
        'delivery-service': [
            {
                value: 'delivery-service-analyse-du-besoin',
                label: 'Analyse du besoin',
                referents: ['Yanis Bouchard — Directeur Delivery Service', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'delivery-service-matching',
                label: 'Matching',
                referents: ['Yanis Bouchard — Directeur Delivery Service', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'delivery-service-planification',
                label: 'Planification',
                referents: ['Yanis Bouchard — Directeur Delivery Service', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'delivery-service-brief-mission',
                label: 'Brief mission',
                referents: ['Yanis Bouchard — Directeur Delivery Service', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'delivery-service-supervision',
                label: 'Supervision',
                referents: ['Yanis Bouchard — Directeur Delivery Service', 'Salma Roche — Référente coordination']
            }
        ],
        'qualite': [
            {
                value: 'qualite-standards',
                label: 'Standards',
                referents: ['Inès Caron — Responsable Excellence Qualité', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'qualite-formation-luxe',
                label: 'Formation luxe',
                referents: ['Inès Caron — Responsable Excellence Qualité', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'qualite-controles-qualite',
                label: 'Contrôles qualité',
                referents: ['Inès Caron — Responsable Excellence Qualité', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'qualite-incidents-qualite',
                label: 'Incidents qualité',
                referents: ['Inès Caron — Responsable Excellence Qualité', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'qualite-amelioration-continue',
                label: 'Amélioration continue',
                referents: ['Inès Caron — Responsable Excellence Qualité', 'Salma Roche — Référente coordination']
            }
        ],
        'confidentialite-surete': [
            {
                value: 'confidentialite-surete-confidentialite',
                label: 'Confidentialité',
                referents: ['Sami El Idrissi — Responsable Sûreté & Confidentialité', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'confidentialite-surete-protection-des-donnees',
                label: 'Protection des données',
                referents: ['Sami El Idrissi — Responsable Sûreté & Confidentialité', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'confidentialite-surete-gestion-des-acces',
                label: 'Gestion des accès',
                referents: ['Sami El Idrissi — Responsable Sûreté & Confidentialité', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'confidentialite-surete-surete-missions',
                label: 'Sûreté missions',
                referents: ['Sami El Idrissi — Responsable Sûreté & Confidentialité', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'confidentialite-surete-gestion-de-crise',
                label: 'Gestion de crise',
                referents: ['Sami El Idrissi — Responsable Sûreté & Confidentialité', 'Salma Roche — Référente coordination']
            }
        ],
        'ressources-humaines': [
            {
                value: 'ressources-humaines-administration-rh',
                label: 'Administration RH',
                referents: ['Claire Dubois — Directrice Ressources Humaines', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'ressources-humaines-temps-absences',
                label: 'Temps & absences',
                referents: ['Claire Dubois — Directrice Ressources Humaines', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'ressources-humaines-paie',
                label: 'Paie',
                referents: ['Claire Dubois — Directrice Ressources Humaines', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'ressources-humaines-performance',
                label: 'Performance',
                referents: ['Claire Dubois — Directrice Ressources Humaines', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'ressources-humaines-discipline-contentieux',
                label: 'Discipline & contentieux',
                referents: ['Claire Dubois — Directrice Ressources Humaines', 'Salma Roche — Référente coordination']
            }
        ],
        'facturation-encaissement': [
            {
                value: 'facturation-encaissement-parametrage-client',
                label: 'Paramétrage client',
                referents: ['Julien Marchand — Responsable Billing & Cash Collection', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'facturation-encaissement-suivi-des-temps',
                label: 'Suivi des temps',
                referents: ['Julien Marchand — Responsable Billing & Cash Collection', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'facturation-encaissement-facturation',
                label: 'Facturation',
                referents: ['Julien Marchand — Responsable Billing & Cash Collection', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'facturation-encaissement-encaissement',
                label: 'Encaissement',
                referents: ['Julien Marchand — Responsable Billing & Cash Collection', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'facturation-encaissement-revenue-assurance',
                label: 'Revenue assurance',
                referents: ['Julien Marchand — Responsable Billing & Cash Collection', 'Salma Roche — Référente coordination']
            }
        ],
        'achats-fournisseurs': [
            {
                value: 'achats-fournisseurs-besoins-d-achat',
                label: 'Besoins d’achat',
                referents: ['Soraya Haddad — Directrice Achats & Fournisseurs', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'achats-fournisseurs-qualification-fournisseurs',
                label: 'Qualification fournisseurs',
                referents: ['Soraya Haddad — Directrice Achats & Fournisseurs', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'achats-fournisseurs-commandes-contrats',
                label: 'Commandes & contrats',
                referents: ['Soraya Haddad — Directrice Achats & Fournisseurs', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'achats-fournisseurs-paiement-fournisseurs',
                label: 'Paiement fournisseurs',
                referents: ['Soraya Haddad — Directrice Achats & Fournisseurs', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'achats-fournisseurs-performance-fournisseurs',
                label: 'Performance fournisseurs',
                referents: ['Soraya Haddad — Directrice Achats & Fournisseurs', 'Salma Roche — Référente coordination']
            }
        ],
        'finance': [
            {
                value: 'finance-comptabilite',
                label: 'Comptabilité',
                referents: ['Thomas Lemaire — Directeur Financier', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'finance-clotures',
                label: 'Clôtures',
                referents: ['Thomas Lemaire — Directeur Financier', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'finance-reporting-financier',
                label: 'Reporting financier',
                referents: ['Thomas Lemaire — Directeur Financier', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'finance-tresorerie',
                label: 'Trésorerie',
                referents: ['Thomas Lemaire — Directeur Financier', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'finance-fiscalite',
                label: 'Fiscalité',
                referents: ['Thomas Lemaire — Directeur Financier', 'Salma Roche — Référente coordination']
            }
        ],
        'juridique-compliance': [
            {
                value: 'juridique-compliance-contrats',
                label: 'Contrats',
                referents: ['Aïcha Rahmani — Directrice Juridique & Compliance', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'juridique-compliance-anticorruption',
                label: 'Anticorruption',
                referents: ['Aïcha Rahmani — Directrice Juridique & Compliance', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'juridique-compliance-kyc-sanctions',
                label: 'KYC & sanctions',
                referents: ['Aïcha Rahmani — Directrice Juridique & Compliance', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'juridique-compliance-conformite-locale',
                label: 'Conformité locale',
                referents: ['Aïcha Rahmani — Directrice Juridique & Compliance', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'juridique-compliance-alertes-enquetes',
                label: 'Alertes & enquêtes',
                referents: ['Aïcha Rahmani — Directrice Juridique & Compliance', 'Salma Roche — Référente coordination']
            }
        ],
        'si-cybersecurite': [
            {
                value: 'si-cybersecurite-gouvernance-it',
                label: 'Gouvernance IT',
                referents: ['Olivier Garnier — Directeur SI & Cybersécurité', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'si-cybersecurite-applications-metier',
                label: 'Applications métier',
                referents: ['Olivier Garnier — Directeur SI & Cybersécurité', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'si-cybersecurite-habilitations',
                label: 'Habilitations',
                referents: ['Olivier Garnier — Directeur SI & Cybersécurité', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'si-cybersecurite-cybersecurite',
                label: 'Cybersécurité',
                referents: ['Olivier Garnier — Directeur SI & Cybersécurité', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'si-cybersecurite-continuite-it',
                label: 'Continuité IT',
                referents: ['Olivier Garnier — Directeur SI & Cybersécurité', 'Salma Roche — Référente coordination']
            }
        ],
        'communication-reputation': [
            {
                value: 'communication-reputation-communication-corporate',
                label: 'Communication corporate',
                referents: ['Maya Chevalier — Directrice Communication & Réputation', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'communication-reputation-communication-client',
                label: 'Communication client',
                referents: ['Maya Chevalier — Directrice Communication & Réputation', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'communication-reputation-communication-interne',
                label: 'Communication interne',
                referents: ['Maya Chevalier — Directrice Communication & Réputation', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'communication-reputation-veille-reputationnelle',
                label: 'Veille réputationnelle',
                referents: ['Maya Chevalier — Directrice Communication & Réputation', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'communication-reputation-communication-de-crise',
                label: 'Communication de crise',
                referents: ['Maya Chevalier — Directrice Communication & Réputation', 'Salma Roche — Référente coordination']
            }
        ],
        'fondation': [
            {
                value: 'fondation-gouvernance-fondation',
                label: 'Gouvernance Fondation',
                referents: ['Romain Delattre — Directeur Fondation', 'Leïla Saadi — Référente opérations']
            },
            {
                value: 'fondation-selection-projets',
                label: 'Sélection projets',
                referents: ['Romain Delattre — Directeur Fondation', 'Hugo Martin — Référent contrôle interne']
            },
            {
                value: 'fondation-gestion-des-dons',
                label: 'Gestion des dons',
                referents: ['Romain Delattre — Directeur Fondation', 'Nour Haddad — Référente conformité']
            },
            {
                value: 'fondation-partenariats',
                label: 'Partenariats',
                referents: ['Romain Delattre — Directeur Fondation', 'Mathis Nguyen — Référent performance']
            },
            {
                value: 'fondation-impact-reporting',
                label: 'Impact & reporting',
                referents: ['Romain Delattre — Directeur Fondation', 'Salma Roche — Référente coordination']
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
