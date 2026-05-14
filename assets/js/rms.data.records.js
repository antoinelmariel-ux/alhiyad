(function (global) {
    const data = {
    "risks": [
        {
            "id": 1,
            "titre": "Contournement d’appel d’offres pour un fournisseur de villas",
            "description": "Un collaborateur favorise un prestataire proche sans comparaison documentée.",
            "example": "Un gestionnaire impose une société de maintenance liée à un membre de sa famille.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "delivery-service",
                "achats-fournisseurs"
            ],
            "sousProcessusAssocies": [
                "delivery-service-matching",
                "achats-fournisseurs-qualification-fournisseurs"
            ],
            "paysExposes": [
                "HQ Dubai"
            ],
            "tiers": [
                "groupes-hoteliers",
                "prestataires"
            ],
            "probBrut": 4,
            "impactBrut": 5,
            "mitigationEffectiveness": "inefficace",
            "postActionMitigationEffectiveness": "insuffisant",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [],
                "group2": [
                    "culture-du-pourboire"
                ]
            },
            "controls": [
                1,
                2
            ],
            "controlAssignments": [
                {
                    "controlId": 1,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 2,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                1,
                5
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14",
            "typesCorruption": [
                "active"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "cadeaux-invitations"
            ]
        },
        {
            "id": 2,
            "titre": "Cadeau de grande valeur offert par un partenaire hôtelier",
            "description": "Un avantage personnel influence la sélection d’un partenaire premium.",
            "example": "Une invitation tous frais payés est proposée avant le renouvellement du contrat.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "confidentialite-surete",
                "delivery-service"
            ],
            "sousProcessusAssocies": [
                "confidentialite-surete-protection-des-donnees",
                "delivery-service-brief-mission"
            ],
            "paysExposes": [
                "Dubai Operations"
            ],
            "tiers": [
                "vip"
            ],
            "probBrut": 4,
            "impactBrut": 4,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "ameliorable",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [],
                "group2": [
                    "culture-du-pourboire",
                    "forte-presence-de-cash-disponible"
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
            "actionPlans": [
                1,
                6
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14",
            "typesCorruption": [
                "passive"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "paiement"
            ]
        },
        {
            "id": 3,
            "titre": "Commission opaque versée à un intermédiaire commercial",
            "description": "Une rémunération sans service démontré masque un avantage indu.",
            "example": "Un agent réclame une success fee inhabituelle payable sur un compte tiers.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "juridique-compliance",
                "developpement-client"
            ],
            "sousProcessusAssocies": [
                "juridique-compliance-kyc-sanctions",
                "developpement-client-qualification-client"
            ],
            "paysExposes": [
                "Turkey Subsidiary"
            ],
            "tiers": [
                "agences-de-tourisme"
            ],
            "probBrut": 3,
            "impactBrut": 5,
            "mitigationEffectiveness": "ameliorable",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [
                    "agent-public"
                ],
                "group2": [
                    "culture-du-pourboire"
                ]
            },
            "controls": [
                3,
                4
            ],
            "controlAssignments": [
                {
                    "controlId": 3,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 4,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                1,
                7
            ],
            "statut": "brouillon",
            "dateCreation": "2026-05-14",
            "typesCorruption": [
                "active"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "cadeaux-invitations"
            ]
        },
        {
            "id": 4,
            "titre": "Paiement cash urgent pour débloquer une prestation VIP",
            "description": "Une demande de liquidités crée un risque de paiement non tracé.",
            "example": "Un chauffeur exige un règlement immédiat hors circuit pour garantir le service.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "ressources-humaines",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "ressources-humaines-recrutement",
                "qualite-incidents-qualite"
            ],
            "paysExposes": [
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "prestataires"
            ],
            "probBrut": 3,
            "impactBrut": 4,
            "mitigationEffectiveness": "efficace",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [],
                "group2": [
                    "culture-du-pourboire",
                    "forte-presence-de-cash-disponible"
                ]
            },
            "controls": [
                4,
                5
            ],
            "controlAssignments": [
                {
                    "controlId": 4,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 5,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                1,
                8
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14",
            "typesCorruption": [
                "passive"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "paiement"
            ]
        },
        {
            "id": 5,
            "titre": "Conflit d’intérêts dans la sélection d’un lifestyle manager",
            "description": "Un lien personnel non déclaré biaise une décision de recrutement ou d’affectation.",
            "example": "Un manager recommande un proche pour gérer un portefeuille client sensible.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "communication-reputation",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "communication-reputation-communication-de-crise",
                "qualite-incidents-qualite"
            ],
            "paysExposes": [
                "HQ Dubai",
                "Dubai Operations"
            ],
            "tiers": [
                "autorites-locales"
            ],
            "probBrut": 2,
            "impactBrut": 5,
            "mitigationEffectiveness": "inefficace",
            "postActionMitigationEffectiveness": "insuffisant",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [],
                "group2": [
                    "culture-du-pourboire"
                ]
            },
            "controls": [
                5,
                6
            ],
            "controlAssignments": [
                {
                    "controlId": 5,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 6,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                1
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14",
            "typesCorruption": [
                "active"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "cadeaux-invitations"
            ]
        },
        {
            "id": 6,
            "titre": "Accès excessif aux préférences intimes des clients",
            "description": "Des collaborateurs disposent de données sensibles au-delà du besoin opérationnel.",
            "example": "Des notes de santé et habitudes familiales restent visibles dans un espace partagé.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "facturation-encaissement",
                "juridique-compliance"
            ],
            "sousProcessusAssocies": [
                "facturation-encaissement-facturation",
                "juridique-compliance-kyc-sanctions"
            ],
            "paysExposes": [
                "Turkey Subsidiary",
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "lifestyle-agents"
            ],
            "probBrut": 4,
            "impactBrut": 3,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "ameliorable",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [
                    "donnees-sensibles-dont-de-sante"
                ],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                6,
                7
            ],
            "controlAssignments": [
                {
                    "controlId": 6,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 7,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                2,
                5
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 7,
            "titre": "Perte d’un appareil contenant des informations VIP",
            "description": "Un équipement mobile non sécurisé expose des données confidentielles.",
            "example": "Une tablette utilisée en mission disparaît avec l’historique des demandes client.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "achats-fournisseurs",
                "facturation-encaissement"
            ],
            "sousProcessusAssocies": [
                "achats-fournisseurs-selection-fournisseurs",
                "facturation-encaissement-paiement"
            ],
            "paysExposes": [
                "HQ Dubai"
            ],
            "tiers": [
                "fournisseurs-locaux"
            ],
            "probBrut": 2,
            "impactBrut": 4,
            "mitigationEffectiveness": "ameliorable",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                7,
                8
            ],
            "controlAssignments": [
                {
                    "controlId": 7,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 8,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                2,
                6
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 8,
            "titre": "Partage non autorisé de documents d’identité",
            "description": "Des pièces KYC sont transmises hors canal validé.",
            "example": "Un passeport est envoyé via messagerie personnelle à un fournisseur.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "developpement-client",
                "communication-reputation"
            ],
            "sousProcessusAssocies": [
                "developpement-client-prospection",
                "communication-reputation-relations-presse"
            ],
            "paysExposes": [
                "Dubai Operations"
            ],
            "tiers": [
                "collaborateurs"
            ],
            "probBrut": 1,
            "impactBrut": 5,
            "mitigationEffectiveness": "efficace",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                8,
                9
            ],
            "controlAssignments": [
                {
                    "controlId": 8,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 9,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                2,
                7
            ],
            "statut": "brouillon",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 9,
            "titre": "Conservation excessive des historiques de voyage",
            "description": "Des données anciennes sont gardées sans justification claire.",
            "example": "Les itinéraires de clients inactifs restent consultables plusieurs années.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "delivery-service",
                "achats-fournisseurs"
            ],
            "sousProcessusAssocies": [
                "delivery-service-matching",
                "achats-fournisseurs-qualification-fournisseurs"
            ],
            "paysExposes": [
                "Turkey Subsidiary"
            ],
            "tiers": [
                "groupes-hoteliers",
                "prestataires"
            ],
            "probBrut": 3,
            "impactBrut": 3,
            "mitigationEffectiveness": "inefficace",
            "postActionMitigationEffectiveness": "insuffisant",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [
                    "donnees-sensibles-dont-de-sante"
                ],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                9,
                10
            ],
            "controlAssignments": [
                {
                    "controlId": 9,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 10,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                2,
                8
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 10,
            "titre": "Erreur de destinataire sur un briefing mission",
            "description": "Un briefing contenant des détails sensibles est envoyé au mauvais tiers.",
            "example": "Un email de mission VIP est transmis à une agence non mandatée.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "confidentialite-surete",
                "delivery-service"
            ],
            "sousProcessusAssocies": [
                "confidentialite-surete-protection-des-donnees",
                "delivery-service-brief-mission"
            ],
            "paysExposes": [
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "vip"
            ],
            "probBrut": 2,
            "impactBrut": 3,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "ameliorable",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                10,
                11
            ],
            "controlAssignments": [
                {
                    "controlId": 10,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 11,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                2
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 11,
            "titre": "Réservation indirecte pour bénéficiaire sous sanctions",
            "description": "Un intermédiaire masque le bénéficiaire effectif d’une prestation.",
            "example": "Une agence réserve pour un client final situé dans une juridiction sanctionnée.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "juridique-compliance",
                "developpement-client"
            ],
            "sousProcessusAssocies": [
                "juridique-compliance-kyc-sanctions",
                "developpement-client-qualification-client"
            ],
            "paysExposes": [
                "HQ Dubai",
                "Dubai Operations"
            ],
            "tiers": [
                "agences-de-tourisme"
            ],
            "probBrut": 1,
            "impactBrut": 4,
            "mitigationEffectiveness": "ameliorable",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "international-sanctions",
                "group1": [],
                "group2": [
                    "beneficiaire-effectif-difficile-a-identifier"
                ]
            },
            "controls": [
                11,
                12
            ],
            "controlAssignments": [
                {
                    "controlId": 11,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 12,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                3,
                5
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 12,
            "titre": "Paiement en dollars impliquant une banque exposée",
            "description": "Un flux financier transite par un établissement à risque sanctions.",
            "example": "Une facture fournisseur exige un virement USD vers une banque correspondante sensible.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "ressources-humaines",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "ressources-humaines-recrutement",
                "qualite-incidents-qualite"
            ],
            "paysExposes": [
                "Turkey Subsidiary",
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "prestataires"
            ],
            "probBrut": 2,
            "impactBrut": 2,
            "mitigationEffectiveness": "efficace",
            "postActionMitigationEffectiveness": "efficace",
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
                12,
                13
            ],
            "controlAssignments": [
                {
                    "controlId": 12,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 13,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                3,
                6
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 13,
            "titre": "Prestation de transport vers une zone embargo",
            "description": "Une mission logistique peut soutenir une activité interdite.",
            "example": "Un transport privé est demandé pour rejoindre un site soumis à restrictions.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "communication-reputation",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "communication-reputation-communication-de-crise",
                "qualite-incidents-qualite"
            ],
            "paysExposes": [
                "HQ Dubai"
            ],
            "tiers": [
                "autorites-locales"
            ],
            "probBrut": 1,
            "impactBrut": 3,
            "mitigationEffectiveness": "inefficace",
            "postActionMitigationEffectiveness": "insuffisant",
            "aggravatingFactors": {
                "theme": "international-sanctions",
                "group1": [],
                "group2": [
                    "beneficiaire-effectif-difficile-a-identifier"
                ]
            },
            "controls": [
                13,
                14
            ],
            "controlAssignments": [
                {
                    "controlId": 13,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 14,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                3,
                7
            ],
            "statut": "brouillon",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 14,
            "titre": "Fournisseur détenu par une personne politiquement exposée sanctionnée",
            "description": "La structure capitalistique d’un prestataire révèle un bénéficiaire à risque.",
            "example": "La due diligence identifie tardivement un actionnaire figurant sur une liste de sanctions.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "facturation-encaissement",
                "juridique-compliance"
            ],
            "sousProcessusAssocies": [
                "facturation-encaissement-facturation",
                "juridique-compliance-kyc-sanctions"
            ],
            "paysExposes": [
                "Dubai Operations"
            ],
            "tiers": [
                "lifestyle-agents"
            ],
            "probBrut": 1,
            "impactBrut": 2,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "ameliorable",
            "aggravatingFactors": {
                "theme": "international-sanctions",
                "group1": [],
                "group2": [
                    "beneficiaire-effectif-difficile-a-identifier",
                    "presence-d-intermediaire"
                ]
            },
            "controls": [
                14,
                15
            ],
            "controlAssignments": [
                {
                    "controlId": 14,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 15,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                3,
                8
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 15,
            "titre": "Contournement géographique via filiale locale",
            "description": "Une entité locale est utilisée pour masquer l’origine ou la destination réelle.",
            "example": "Une demande est requalifiée au nom d’une filiale non exposée alors que l’usage final est interdit.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "achats-fournisseurs",
                "facturation-encaissement"
            ],
            "sousProcessusAssocies": [
                "achats-fournisseurs-selection-fournisseurs",
                "facturation-encaissement-paiement"
            ],
            "paysExposes": [
                "Turkey Subsidiary"
            ],
            "tiers": [
                "fournisseurs-locaux"
            ],
            "probBrut": 1,
            "impactBrut": 1,
            "mitigationEffectiveness": "ameliorable",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "international-sanctions",
                "group1": [
                    "pays-sous-sanctions-ou-pays-a-exposition-geopolitique-elevee"
                ],
                "group2": [
                    "beneficiaire-effectif-difficile-a-identifier"
                ]
            },
            "controls": [
                15,
                16
            ],
            "controlAssignments": [
                {
                    "controlId": 15,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 16,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                3
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 16,
            "titre": "Traitement préférentiel excluant certains profils de clients",
            "description": "Des critères non objectifs orientent la qualité de service rendue.",
            "example": "Des demandes similaires reçoivent des priorités différentes selon l’origine perçue.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "developpement-client",
                "communication-reputation"
            ],
            "sousProcessusAssocies": [
                "developpement-client-prospection",
                "communication-reputation-relations-presse"
            ],
            "paysExposes": [
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "collaborateurs"
            ],
            "probBrut": 4,
            "impactBrut": 2,
            "mitigationEffectiveness": "efficace",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "discrimination",
                "group1": [],
                "group2": [
                    "discrimination-liee-a-l-origine-ethnique-ou-le-sexe"
                ]
            },
            "controls": [
                16,
                17
            ],
            "controlAssignments": [
                {
                    "controlId": 16,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 17,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                4,
                5
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 17,
            "titre": "Refus de recrutement fondé sur l’âge supposé",
            "description": "Une décision RH repose sur un critère discriminatoire.",
            "example": "Un candidat expérimenté est écarté avec une justification liée à son âge.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "delivery-service",
                "achats-fournisseurs"
            ],
            "sousProcessusAssocies": [
                "delivery-service-matching",
                "achats-fournisseurs-qualification-fournisseurs"
            ],
            "paysExposes": [
                "HQ Dubai",
                "Dubai Operations"
            ],
            "tiers": [
                "groupes-hoteliers",
                "prestataires"
            ],
            "probBrut": 3,
            "impactBrut": 2,
            "mitigationEffectiveness": "inefficace",
            "postActionMitigationEffectiveness": "insuffisant",
            "aggravatingFactors": {
                "theme": "discrimination",
                "group1": [],
                "group2": [
                    "discrimination-liee-a-l-origine-ethnique-ou-le-sexe"
                ]
            },
            "controls": [
                17,
                18
            ],
            "controlAssignments": [
                {
                    "controlId": 17,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 18,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                4,
                6
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 18,
            "titre": "Communication de crise stigmatisant une nationalité",
            "description": "Un message public peut cibler indirectement un groupe protégé.",
            "example": "Un communiqué attribue un incident à une nationalité plutôt qu’à des faits établis.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "confidentialite-surete",
                "delivery-service"
            ],
            "sousProcessusAssocies": [
                "confidentialite-surete-protection-des-donnees",
                "delivery-service-brief-mission"
            ],
            "paysExposes": [
                "Turkey Subsidiary",
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "vip"
            ],
            "probBrut": 2,
            "impactBrut": 1,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "ameliorable",
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
                18,
                19
            ],
            "controlAssignments": [
                {
                    "controlId": 18,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 19,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                4,
                7
            ],
            "statut": "brouillon",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 19,
            "titre": "Scoring client automatisé défavorable à une zone géographique",
            "description": "Un outil de priorisation crée un biais non détecté.",
            "example": "Les demandes d’une région sont systématiquement classées comme moins rentables.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "juridique-compliance",
                "developpement-client"
            ],
            "sousProcessusAssocies": [
                "juridique-compliance-kyc-sanctions",
                "developpement-client-qualification-client"
            ],
            "paysExposes": [
                "HQ Dubai"
            ],
            "tiers": [
                "agences-de-tourisme"
            ],
            "probBrut": 4,
            "impactBrut": 1,
            "mitigationEffectiveness": "ameliorable",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "discrimination",
                "group1": [],
                "group2": [
                    "discrimination-liee-a-l-origine-ethnique-ou-le-sexe"
                ]
            },
            "controls": [
                19,
                20
            ],
            "controlAssignments": [
                {
                    "controlId": 19,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 20,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                4,
                8
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 20,
            "titre": "Affectation de missions selon le genre du collaborateur",
            "description": "La répartition des opportunités professionnelles repose sur des stéréotypes.",
            "example": "Certaines missions VIP sont réservées à un genre sans raison opérationnelle.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "ressources-humaines",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "ressources-humaines-recrutement",
                "qualite-incidents-qualite"
            ],
            "paysExposes": [
                "Dubai Operations"
            ],
            "tiers": [
                "prestataires"
            ],
            "probBrut": 3,
            "impactBrut": 1,
            "mitigationEffectiveness": "efficace",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "discrimination",
                "group1": [],
                "group2": [
                    "discrimination-liee-a-l-origine-ethnique-ou-le-sexe"
                ]
            },
            "controls": [
                20,
                1
            ],
            "controlAssignments": [
                {
                    "controlId": 20,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 1,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                4
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 21,
            "titre": "Invitation privée par une autorité locale avant permis événementiel",
            "description": "Une interaction avec un agent public peut influencer une autorisation.",
            "example": "Un dîner luxueux est demandé avant la délivrance d’un permis.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "communication-reputation",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "communication-reputation-communication-de-crise",
                "qualite-incidents-qualite"
            ],
            "paysExposes": [
                "Turkey Subsidiary"
            ],
            "tiers": [
                "autorites-locales"
            ],
            "probBrut": 4,
            "impactBrut": 5,
            "mitigationEffectiveness": "inefficace",
            "postActionMitigationEffectiveness": "insuffisant",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [
                    "agent-public"
                ],
                "group2": [
                    "culture-du-pourboire"
                ]
            },
            "controls": [
                1,
                2
            ],
            "controlAssignments": [
                {
                    "controlId": 1,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 2,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                1
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14",
            "typesCorruption": [
                "active"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "cadeaux-invitations"
            ]
        },
        {
            "id": 22,
            "titre": "Fausse facture de service de conciergerie premium",
            "description": "Une facture fictive permet de dissimuler un transfert indu.",
            "example": "Une prestation non réalisée est facturée par un partenaire récurrent.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "facturation-encaissement",
                "juridique-compliance"
            ],
            "sousProcessusAssocies": [
                "facturation-encaissement-facturation",
                "juridique-compliance-kyc-sanctions"
            ],
            "paysExposes": [
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "lifestyle-agents"
            ],
            "probBrut": 2,
            "impactBrut": 5,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "ameliorable",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [],
                "group2": [
                    "culture-du-pourboire",
                    "forte-presence-de-cash-disponible"
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
            "actionPlans": [
                1,
                6
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14",
            "typesCorruption": [
                "passive"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "paiement"
            ]
        },
        {
            "id": 23,
            "titre": "Captation de données biométriques sans base documentée",
            "description": "Des données biométriques sont collectées sans justification ni information suffisante.",
            "example": "Un accès événementiel impose une reconnaissance faciale sans alternative.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "achats-fournisseurs",
                "facturation-encaissement"
            ],
            "sousProcessusAssocies": [
                "achats-fournisseurs-selection-fournisseurs",
                "facturation-encaissement-paiement"
            ],
            "paysExposes": [
                "HQ Dubai",
                "Dubai Operations"
            ],
            "tiers": [
                "fournisseurs-locaux"
            ],
            "probBrut": 3,
            "impactBrut": 4,
            "mitigationEffectiveness": "ameliorable",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                3,
                4
            ],
            "controlAssignments": [
                {
                    "controlId": 3,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 4,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                2
            ],
            "statut": "brouillon",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 24,
            "titre": "Publication accidentelle d’une photo révélant la localisation d’un VIP",
            "description": "Une communication externe expose une donnée de localisation sensible.",
            "example": "Une story montre l’arrière-plan identifiable d’une résidence privée.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "developpement-client",
                "communication-reputation"
            ],
            "sousProcessusAssocies": [
                "developpement-client-prospection",
                "communication-reputation-relations-presse"
            ],
            "paysExposes": [
                "Turkey Subsidiary",
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "collaborateurs"
            ],
            "probBrut": 1,
            "impactBrut": 5,
            "mitigationEffectiveness": "efficace",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [
                    "donnees-sensibles-dont-de-sante"
                ],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                4,
                5
            ],
            "controlAssignments": [
                {
                    "controlId": 4,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 5,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                2
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 25,
            "titre": "Client final masqué derrière plusieurs sociétés écrans",
            "description": "La chaîne contractuelle rend impossible l’identification fiable du bénéficiaire.",
            "example": "Trois sociétés intermédiaires interviennent entre le payeur et le voyageur final.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "delivery-service",
                "achats-fournisseurs"
            ],
            "sousProcessusAssocies": [
                "delivery-service-matching",
                "achats-fournisseurs-qualification-fournisseurs"
            ],
            "paysExposes": [
                "HQ Dubai"
            ],
            "tiers": [
                "groupes-hoteliers",
                "prestataires"
            ],
            "probBrut": 4,
            "impactBrut": 3,
            "mitigationEffectiveness": "inefficace",
            "postActionMitigationEffectiveness": "insuffisant",
            "aggravatingFactors": {
                "theme": "international-sanctions",
                "group1": [],
                "group2": [
                    "beneficiaire-effectif-difficile-a-identifier"
                ]
            },
            "controls": [
                5,
                6
            ],
            "controlAssignments": [
                {
                    "controlId": 5,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 6,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                3,
                7
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 26,
            "titre": "Demande de prestation liée à un navire sous restriction",
            "description": "Un actif sanctionné bénéficie indirectement d’un service.",
            "example": "Une demande d’avitaillement concerne un yacht récemment inscrit sur liste.",
            "riskTheme": "international-sanctions",
            "processusAssocies": [
                "confidentialite-surete",
                "delivery-service"
            ],
            "sousProcessusAssocies": [
                "confidentialite-surete-protection-des-donnees",
                "delivery-service-brief-mission"
            ],
            "paysExposes": [
                "Dubai Operations"
            ],
            "tiers": [
                "vip"
            ],
            "probBrut": 2,
            "impactBrut": 4,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "ameliorable",
            "aggravatingFactors": {
                "theme": "international-sanctions",
                "group1": [],
                "group2": [
                    "beneficiaire-effectif-difficile-a-identifier",
                    "presence-d-intermediaire"
                ]
            },
            "controls": [
                6,
                7
            ],
            "controlAssignments": [
                {
                    "controlId": 6,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 7,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                3
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 27,
            "titre": "Processus de promotion interne biaisé",
            "description": "Des critères informels créent une inégalité d’accès à l’évolution professionnelle.",
            "example": "Les promotions reposent sur des recommandations non documentées.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "juridique-compliance",
                "developpement-client"
            ],
            "sousProcessusAssocies": [
                "juridique-compliance-kyc-sanctions",
                "developpement-client-qualification-client"
            ],
            "paysExposes": [
                "Turkey Subsidiary"
            ],
            "tiers": [
                "agences-de-tourisme"
            ],
            "probBrut": 3,
            "impactBrut": 3,
            "mitigationEffectiveness": "ameliorable",
            "postActionMitigationEffectiveness": "efficace",
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
                7,
                8
            ],
            "controlAssignments": [
                {
                    "controlId": 7,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 8,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                4
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 28,
            "titre": "Refus d’aménagement raisonnable pour handicap",
            "description": "Une demande d’adaptation est rejetée sans analyse objective.",
            "example": "Un collaborateur ne reçoit pas l’équipement nécessaire pour une mission terrain.",
            "riskTheme": "discrimination",
            "processusAssocies": [
                "ressources-humaines",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "ressources-humaines-recrutement",
                "qualite-incidents-qualite"
            ],
            "paysExposes": [
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "prestataires"
            ],
            "probBrut": 1,
            "impactBrut": 4,
            "mitigationEffectiveness": "efficace",
            "postActionMitigationEffectiveness": "efficace",
            "aggravatingFactors": {
                "theme": "discrimination",
                "group1": [],
                "group2": [
                    "discrimination-liee-a-l-origine-ethnique-ou-le-sexe"
                ]
            },
            "controls": [
                8,
                9
            ],
            "controlAssignments": [
                {
                    "controlId": 8,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 9,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                4
            ],
            "statut": "brouillon",
            "dateCreation": "2026-05-14"
        },
        {
            "id": 29,
            "titre": "Rétrocommission dans l’achat de billets événementiels rares",
            "description": "La rareté d’un accès premium favorise une commission dissimulée.",
            "example": "Un broker augmente le prix contre une remise personnelle au prescripteur.",
            "riskTheme": "corruption",
            "processusAssocies": [
                "communication-reputation",
                "qualite"
            ],
            "sousProcessusAssocies": [
                "communication-reputation-communication-de-crise",
                "qualite-incidents-qualite"
            ],
            "paysExposes": [
                "HQ Dubai",
                "Dubai Operations"
            ],
            "tiers": [
                "autorites-locales"
            ],
            "probBrut": 2,
            "impactBrut": 3,
            "mitigationEffectiveness": "inefficace",
            "postActionMitigationEffectiveness": "insuffisant",
            "aggravatingFactors": {
                "theme": "corruption",
                "group1": [],
                "group2": [
                    "culture-du-pourboire"
                ]
            },
            "controls": [
                9,
                10
            ],
            "controlAssignments": [
                {
                    "controlId": 9,
                    "transverse": false,
                    "avantagesIndus": []
                },
                {
                    "controlId": 10,
                    "transverse": false,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                1,
                8
            ],
            "statut": "validated",
            "dateCreation": "2026-05-14",
            "typesCorruption": [
                "active"
            ],
            "corruptionExposureTypes": [
                "tiers"
            ],
            "corruptionModes": [
                "cadeaux-invitations"
            ]
        },
        {
            "id": 30,
            "titre": "Transfert transfrontalier non encadré de dossiers clients",
            "description": "Des données sont transférées hors périmètre contractuel ou pays validé.",
            "example": "Un support externe hors zone autorisée accède aux dossiers sans clause adaptée.",
            "riskTheme": "personal-data",
            "processusAssocies": [
                "facturation-encaissement",
                "juridique-compliance"
            ],
            "sousProcessusAssocies": [
                "facturation-encaissement-facturation",
                "juridique-compliance-kyc-sanctions"
            ],
            "paysExposes": [
                "Turkey Subsidiary",
                "Indonesia Subsidiary"
            ],
            "tiers": [
                "lifestyle-agents"
            ],
            "probBrut": 4,
            "impactBrut": 4,
            "mitigationEffectiveness": "insuffisant",
            "postActionMitigationEffectiveness": "ameliorable",
            "aggravatingFactors": {
                "theme": "personal-data",
                "group1": [
                    "donnees-sensibles-dont-de-sante"
                ],
                "group2": [
                    "donnee-sensibles-dont-intimes"
                ]
            },
            "controls": [
                10,
                11
            ],
            "controlAssignments": [
                {
                    "controlId": 10,
                    "transverse": true,
                    "avantagesIndus": []
                },
                {
                    "controlId": 11,
                    "transverse": true,
                    "avantagesIndus": []
                }
            ],
            "actionPlans": [
                2,
                7
            ],
            "statut": "a-valider",
            "dateCreation": "2026-05-14"
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
    "actionPlans": [
        {
            "id": 1,
            "title": "Renforcer la due diligence tiers premium",
            "owner": "Compliance",
            "dueDate": "2026-06-30",
            "status": "en-cours",
            "description": "Revoir les contrôles de qualification, bénéficiaires effectifs et clauses contractuelles des tiers à plus forte exposition.",
            "comment": "Priorité haute pour les partenaires récurrents.",
            "risks": [
                1,
                2,
                3,
                4,
                5,
                21,
                22,
                29
            ],
            "dateCreation": "2026-05-14"
        },
        {
            "id": 2,
            "title": "Sécuriser les données VIP et briefings mission",
            "owner": "DPO",
            "dueDate": "2026-07-15",
            "status": "a-demarrer",
            "description": "Déployer une revue des accès, un chiffrement systématique et des canaux approuvés pour les informations sensibles.",
            "comment": "Inclure les équipes terrain et support externe.",
            "risks": [
                6,
                7,
                8,
                9,
                10,
                23,
                24,
                30
            ],
            "dateCreation": "2026-05-14"
        },
        {
            "id": 3,
            "title": "Automatiser le filtrage sanctions avant prestation",
            "owner": "Juridique & Compliance",
            "dueDate": "2026-06-20",
            "status": "en-cours",
            "description": "Mettre en place un filtrage avant acceptation, paiement et livraison des prestations internationales.",
            "comment": "Connecter le contrôle aux workflows de réservation.",
            "risks": [
                11,
                12,
                13,
                14,
                15,
                25,
                26
            ],
            "dateCreation": "2026-05-14"
        },
        {
            "id": 4,
            "title": "Auditer les décisions RH et client contre les biais",
            "owner": "Ressources humaines",
            "dueDate": "2026-08-31",
            "status": "brouillon",
            "description": "Contrôler les critères de recrutement, promotion, affectation et priorisation client pour réduire les biais discriminatoires.",
            "comment": "Prévoir un échantillonnage trimestriel.",
            "risks": [
                16,
                17,
                18,
                19,
                20,
                27,
                28
            ],
            "dateCreation": "2026-05-14"
        },
        {
            "id": 5,
            "title": "Créer un comité d’arbitrage des situations sensibles",
            "owner": "Direction générale",
            "dueDate": "2026-09-15",
            "status": "a-demarrer",
            "description": "Installer une revue collégiale pour les scénarios critiques impliquant clients VIP, autorités, sanctions ou données sensibles.",
            "comment": "Comité mensuel avec escalade ad hoc.",
            "risks": [
                1,
                6,
                11,
                16
            ],
            "dateCreation": "2026-05-14"
        },
        {
            "id": 6,
            "title": "Former les équipes aux cadeaux, invitations et conflits d’intérêts",
            "owner": "Compliance",
            "dueDate": "2026-07-31",
            "status": "en-cours",
            "description": "Actualiser la formation opérationnelle avec cas pratiques luxe, seuils d’approbation et déclarations obligatoires.",
            "comment": "Module court à intégrer à l’onboarding.",
            "risks": [
                2,
                7,
                12,
                17,
                22
            ],
            "dateCreation": "2026-05-14"
        },
        {
            "id": 7,
            "title": "Mettre en place une revue mensuelle des alertes transactionnelles",
            "owner": "Contrôle interne",
            "dueDate": "2026-10-15",
            "status": "delayed",
            "description": "Analyser paiements atypiques, factures sensibles, flux transfrontaliers et demandes de justification tardive.",
            "comment": "Retard lié à la disponibilité des données finance.",
            "risks": [
                3,
                8,
                13,
                18,
                25,
                30
            ],
            "dateCreation": "2026-05-14"
        },
        {
            "id": 8,
            "title": "Normaliser la communication de crise et les validations externes",
            "owner": "Communication",
            "dueDate": "2026-08-15",
            "status": "a-demarrer",
            "description": "Créer des messages types, une validation juridique et une checklist anti-discrimination avant toute publication sensible.",
            "comment": "Inclure réseaux sociaux et relation presse.",
            "risks": [
                4,
                9,
                14,
                19,
                29
            ],
            "dateCreation": "2026-05-14"
        }
    ],
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
