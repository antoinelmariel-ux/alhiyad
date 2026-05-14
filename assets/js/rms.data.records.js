(function (global) {
    const data = {
    "risks": [
        {
            "id": 1,
            "titre": "Paiement de facilitation pour obtenir un accès premium",
            "description": "Risque fictif de demande de paiement indu pour accélérer une réservation ou obtenir un accès exclusif.",
            "example": "Un partenaire hôtelier réclame un avantage personnel pour débloquer une suite très demandée.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "delivery-service",
                "achats-fournisseurs"
            ],
            "sousProcessusAssocies": [
                "delivery-service-matching",
                "achats-fournisseurs-qualification-fournisseurs"
            ],
            "typesCorruption": [
                "active",
                "passive"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "cadeaux-invitations"
            ],
            "targetAudiences": [
                "dubai-luxury-operations"
            ],
            "paysExposes": [
                "Dubai Operations"
            ],
            "tiers": [
                "palace-hotels",
                "exclusive-experience-suppliers"
            ],
            "probBrut": 4,
            "impactBrut": 4,
            "mitigationEffectiveness": "partiel",
            "postActionMitigationEffectiveness": "satisfaisant",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [
                    "agent-public"
                ],
                "group2": [
                    "culture-du-pourboire",
                    "forte-presence-de-cash-disponible"
                ]
            },
            "controls": [
                7,
                10
            ],
            "controlAssignments": [
                {
                    "controlId": 7,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 10,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "statut": "validated",
            "dateCreation": "2026-04-16"
        },
        {
            "id": 2,
            "titre": "Divulgation non autorisée de préférences client VIP",
            "description": "Risque fictif de diffusion de données personnelles sensibles liées aux habitudes et préférences de clients ultra-premium.",
            "example": "Des préférences de voyage et données intimes sont partagées dans un canal non autorisé.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "confidentialite-surete",
                "delivery-service"
            ],
            "sousProcessusAssocies": [
                "confidentialite-surete-protection-des-donnees",
                "delivery-service-brief-mission"
            ],
            "targetAudiences": [
                "guest-privacy-confidentiality"
            ],
            "paysExposes": [
                "HQ Dubai",
                "Dubai Operations"
            ],
            "tiers": [
                "b2c-ultra-high-net-worth-clients"
            ],
            "probBrut": 3,
            "impactBrut": 5,
            "mitigationEffectiveness": "partiel",
            "postActionMitigationEffectiveness": "fort",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [
                    "donnees-sensibles-dont-de-sante",
                    "donnees-sur-des-personnes-exposees-mediatiquement"
                ],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                7,
                11
            ],
            "controlAssignments": [
                {
                    "controlId": 7,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 11,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "statut": "a-valider",
            "dateCreation": "2026-04-16"
        },
        {
            "id": 3,
            "titre": "Prestation indirecte vers un client sous sanctions",
            "description": "Risque fictif de contournement de filtrage sanctions via un intermédiaire ou un bénéficiaire effectif masqué.",
            "example": "Une réservation est portée par un lifestyle agent alors que le bénéficiaire final est situé dans une juridiction sensible.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "juridique-compliance",
                "developpement-client"
            ],
            "sousProcessusAssocies": [
                "juridique-compliance-kyc-sanctions",
                "developpement-client-qualification-client"
            ],
            "targetAudiences": [
                "b2b-partnerships"
            ],
            "paysExposes": [
                "Turkey Subsidiary"
            ],
            "tiers": [
                "lifestyle-agents",
                "b2b-corporate-clients"
            ],
            "probBrut": 3,
            "impactBrut": 5,
            "mitigationEffectiveness": "partiel",
            "postActionMitigationEffectiveness": "fort",
            "aggravatingFactors": {
                "theme": "international-sanctions",
                "group1": [
                    "pays-sous-sanctions-ou-pays-a-exposition-geopolitique-elevee"
                ],
                "group2": [
                    "beneficiaire-effectif-difficile-a-identifier",
                    "presence-d-intermediaire"
                ]
            },
            "controls": [
                7,
                10,
                11
            ],
            "controlAssignments": [
                {
                    "controlId": 7,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 10,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "statut": "validated",
            "dateCreation": "2026-04-16"
        },
        {
            "id": 4,
            "titre": "Traitement discriminatoire dans la sélection de concierges",
            "description": "Risque fictif de décision discriminatoire lors de la sélection ou de l’affectation de talents de conciergerie.",
            "example": "Un profil est écarté d’une mission sur des critères non objectifs liés à l’origine ou au genre.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "recrutement",
                "ressources-humaines"
            ],
            "sousProcessusAssocies": [
                "recrutement-selection",
                "ressources-humaines-discipline-contentieux"
            ],
            "targetAudiences": [
                "hq-dubai-leadership"
            ],
            "paysExposes": [
                "HQ Dubai"
            ],
            "tiers": [],
            "probBrut": 3,
            "impactBrut": 4,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "satisfaisant",
            "aggravatingFactors": {
                "theme": "discrimination",
                "group1": [
                    "decision-a-fort-enjeu-pour-la-personne"
                ],
                "group2": [
                    "discrimination-liee-a-l-origine-ethnique-ou-le-sexe"
                ]
            },
            "controls": [
                2,
                3
            ],
            "controlAssignments": [
                {
                    "controlId": 2,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 3,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "statut": "brouillon",
            "dateCreation": "2026-04-16"
        },
        {
            "id": 5,
            "titre": "Remise commerciale non documentée accordée à un partenaire B2B",
            "description": "Risque fictif de remise ou commission inhabituelle non justifiée dans le cycle de développement client.",
            "example": "Un commercial ajuste le prix sans justification pour favoriser un apporteur d’affaires.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "developpement-client",
                "finance"
            ],
            "sousProcessusAssocies": [
                "developpement-client-offre-pricing",
                "finance-comptabilite"
            ],
            "typesCorruption": [
                "conflit-interet",
                "favoritisme"
            ],
            "targetAudiences": [
                "b2b-partnerships"
            ],
            "paysExposes": [
                "Dubai Operations"
            ],
            "tiers": [
                "partner-concierges",
                "b2b-corporate-clients"
            ],
            "probBrut": 4,
            "impactBrut": 3,
            "mitigationEffectiveness": "partiel",
            "postActionMitigationEffectiveness": "satisfaisant",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [],
                "group2": [
                    "fort-impact-potentiel-sur-la-remuneration"
                ]
            },
            "controls": [
                5,
                8,
                11
            ],
            "controlAssignments": [
                {
                    "controlId": 5,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 8,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "statut": "a-valider",
            "dateCreation": "2026-04-16"
        },
        {
            "id": 6,
            "titre": "Accès SI excessif aux dossiers clients confidentiels",
            "description": "Risque fictif de droits applicatifs trop larges permettant de consulter des informations client non nécessaires.",
            "example": "Un utilisateur conserve des habilitations après changement de poste et accède à des dossiers VIP.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "si-cybersecurite",
                "confidentialite-surete"
            ],
            "sousProcessusAssocies": [
                "si-cybersecurite-habilitations",
                "confidentialite-surete-gestion-des-acces"
            ],
            "targetAudiences": [
                "guest-privacy-confidentiality"
            ],
            "paysExposes": [
                "HQ Dubai"
            ],
            "tiers": [
                "b2c-ultra-high-net-worth-clients"
            ],
            "probBrut": 4,
            "impactBrut": 4,
            "mitigationEffectiveness": "partiel",
            "postActionMitigationEffectiveness": "fort",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [
                    "donnees-sur-des-personnes-exposees-mediatiquement"
                ],
                "group2": [
                    "fort-turn-over-parmi-les-gestionnaires-des-donnees"
                ]
            },
            "controls": [
                11,
                20
            ],
            "controlAssignments": [
                {
                    "controlId": 11,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 20,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "statut": "validated",
            "dateCreation": "2026-04-16"
        },
        {
            "id": 7,
            "titre": "Facturation masquant une prestation interdite",
            "description": "Risque fictif de libellé de facture incomplet pouvant masquer une prestation à exposition sanctions.",
            "example": "Une facture globale ne détaille pas le pays de réalisation ni le bénéficiaire de la prestation.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "facturation-encaissement",
                "juridique-compliance"
            ],
            "sousProcessusAssocies": [
                "facturation-encaissement-facturation",
                "juridique-compliance-kyc-sanctions"
            ],
            "targetAudiences": [
                "turkey-europe-americas-middle-east"
            ],
            "paysExposes": [
                "Turkey Subsidiary"
            ],
            "tiers": [
                "yacht-jet-operators"
            ],
            "probBrut": 2,
            "impactBrut": 5,
            "mitigationEffectiveness": "partiel",
            "postActionMitigationEffectiveness": "satisfaisant",
            "aggravatingFactors": {
                "theme": "international-sanctions",
                "group1": [
                    "paiement-en-dollar-ou-via-banques-exposees"
                ],
                "group2": [
                    "presence-d-intermediaire"
                ]
            },
            "controls": [
                12,
                11
            ],
            "controlAssignments": [
                {
                    "controlId": 12,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 11,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "statut": "brouillon",
            "dateCreation": "2026-04-16"
        },
        {
            "id": 8,
            "titre": "Communication client excluante lors d’une crise réputationnelle",
            "description": "Risque fictif de message ou traitement différencié défavorable à une population ciblée pendant une communication de crise.",
            "example": "Une réponse publique laisse entendre qu’un segment de clientèle est moins prioritaire pour la prise en charge.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "communication-reputation",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "communication-reputation-communication-de-crise",
                "qualite-incidents-qualite"
            ],
            "targetAudiences": [
                "hq-dubai-leadership"
            ],
            "paysExposes": [
                "HQ Dubai",
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "b2c-ultra-high-net-worth-clients"
            ],
            "probBrut": 2,
            "impactBrut": 4,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "satisfaisant",
            "aggravatingFactors": {
                "theme": "discrimination",
                "group1": [
                    "forte-communication-externe-de-l-entreprise-en-faveur-de-la-population-visee"
                ],
                "group2": [
                    "discrimination-liee-a-l-origine-ethnique-ou-le-sexe"
                ]
            },
            "controls": [
                3,
                11
            ],
            "controlAssignments": [
                {
                    "controlId": 3,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 11,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "statut": "a-valider",
            "dateCreation": "2026-04-16"
        }
    ],
    "controls": [
        {
            "id": 1,
            "reference": "GEN.01",
            "groupCode": "",
            "name": "Separation of medical and commercial roles (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Compliance",
            "frequency": "annuelle",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 2,
            "reference": "GEN.02",
            "groupCode": "",
            "name": "Segregation of duties (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Compliance",
            "frequency": "annuelle",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 3,
            "reference": "GEN.03",
            "groupCode": "",
            "name": "Collegial decision-making (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Compliance",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 4,
            "reference": "GEN.04",
            "groupCode": "",
            "name": "Collegiality via committees/review bodies (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Compliance",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 5,
            "reference": "GEN.05",
            "groupCode": "",
            "name": "Documentation of needs (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Achats",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "satisfactory",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 6,
            "reference": "GEN.06",
            "groupCode": "",
            "name": "Documentation of partner selection (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Achats",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "satisfactory",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 7,
            "reference": "GEN.07",
            "groupCode": "",
            "name": "Due diligence (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Compliance",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "satisfactory",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 8,
            "reference": "GEN.08",
            "groupCode": "",
            "name": "Pricing structure / ceiling (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Finance",
            "frequency": "annuelle",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 9,
            "reference": "GEN.09",
            "groupCode": "",
            "name": "Competitive tendering (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Achats",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "satisfactory",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 10,
            "reference": "GEN.10",
            "groupCode": "",
            "name": "Level 2 prior authorisation (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Management",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 11,
            "reference": "GEN.11",
            "groupCode": "",
            "name": "Level 2 ex-post control (generic)",
            "type": "a-posteriori",
            "origin": "interne",
            "owner": "Contrôle interne",
            "frequency": "mensuelle",
            "mode": "transactional",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 12,
            "reference": "GEN.12",
            "groupCode": "",
            "name": "Reconciliation of invoice and purchase order (generic)",
            "type": "a-posteriori",
            "origin": "interne",
            "owner": "Finance",
            "frequency": "mensuelle",
            "mode": "ongoing",
            "effectiveness": "satisfactory",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 13,
            "reference": "GEN.13",
            "groupCode": "",
            "name": "Proof of service rendered (generic)",
            "type": "a-posteriori",
            "origin": "interne",
            "owner": "Achats",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 14,
            "reference": "GEN.14",
            "groupCode": "",
            "name": "Traceability of actions/flows (generic)",
            "type": "a-posteriori",
            "origin": "interne",
            "owner": "IT",
            "frequency": "quotidienne",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 15,
            "reference": "GEN.15",
            "groupCode": "",
            "name": "Traceability of the validation workflow (generic)",
            "type": "a-posteriori",
            "origin": "interne",
            "owner": "IT",
            "frequency": "quotidienne",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 16,
            "reference": "GEN.16",
            "groupCode": "",
            "name": "Contract with anti-corruption clause (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Juridique",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "satisfactory",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 17,
            "reference": "GEN.17",
            "groupCode": "",
            "name": "Contract without anti-corruption clause (generic)",
            "type": "a-posteriori",
            "origin": "interne",
            "owner": "Juridique",
            "frequency": "ad-hoc",
            "mode": "transactional",
            "effectiveness": "not-in-place",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 18,
            "reference": "GEN.18",
            "groupCode": "",
            "name": "Anti-corruption training (generic)",
            "type": "a-priori",
            "origin": "interne",
            "owner": "Compliance",
            "frequency": "annuelle",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 19,
            "reference": "GEN.19",
            "groupCode": "",
            "name": "Internal whistleblowing mechanism (generic)",
            "type": "a-posteriori",
            "origin": "interne",
            "owner": "Compliance",
            "frequency": "ad-hoc",
            "mode": "ongoing",
            "effectiveness": "to-be-improved",
            "status": "actif",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-16"
        },
        {
            "id": 20,
            "name": "Audit",
            "reference": "GEN.20",
            "groupCode": "",
            "type": "",
            "owner": "",
            "mode": "",
            "effectiveness": "",
            "description": "",
            "risks": [],
            "dateCreation": "2026-04-24"
        }
    ],
    "actionPlans": [],
    "history": [],
    "interviews": []
};

    const deepFreeze = (value) => {
        if (!value || typeof value !== "object") {
            return value;
        }
        if (Array.isArray(value)) {
            value.forEach(deepFreeze);
        } else {
            Object.keys(value).forEach((key) => {
                deepFreeze(value[key]);
            });
        }
        return Object.freeze(value);
    };

    global.RMS_DEFAULT_DATA = deepFreeze(data);
})(typeof window !== 'undefined' ? window : globalThis);
