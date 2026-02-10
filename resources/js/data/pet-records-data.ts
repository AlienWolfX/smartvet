export const petSpecies = [
    { id: "dog", name: "Dog", icon: "🐕" },
    { id: "cat", name: "Cat", icon: "🐱" },
    { id: "rabbit", name: "Rabbit", icon: "🐰" },
    { id: "bird", name: "Bird", icon: "🦜" },
    { id: "hamster", name: "Hamster", icon: "🐹" },
    { id: "guinea-pig", name: "Guinea Pig", icon: "🐹" },
    { id: "ferret", name: "Ferret", icon: "🦫" },
    { id: "reptile", name: "Reptile", icon: "🦎" }
];

export const petBreeds = {
    dog: [
        "Golden Retriever", "Labrador Retriever", "German Shepherd", "Bulldog", 
        "Poodle", "Beagle", "Rottweiler", "Yorkshire Terrier", "Dachshund", 
        "Siberian Husky", "Shih Tzu", "Boston Terrier", "Aspin (Mixed)", "Chihuahua"
    ],
    cat: [
        "Persian", "Maine Coon", "British Shorthair", "Ragdoll", "Siamese", 
        "American Shorthair", "Abyssinian", "Russian Blue", "Scottish Fold", 
        "Domestic Shorthair", "Domestic Longhair", "Puspin (Mixed)"
    ],
    rabbit: [
        "Holland Lop", "Netherland Dwarf", "Mini Rex", "Lionhead", "Flemish Giant", 
        "English Angora", "Dutch", "New Zealand White"
    ],
    bird: [
        "Budgerigar", "Cockatiel", "Love Bird", "Canary", "Cockatoo", "Parrot", 
        "Conure", "Finch", "Macaw"
    ]
};

export const petRecords = [
    {
        id: "PET-001",
        name: "Mika",
        species: "dog",
        breed: "Siberian Husky",
        age: 3,
        weight: 28.5,
        gender: "female",
        color: "Black and White",
        microchipId: "982000123456789",
        owner: {
            name: "Maria Santos",
            phone: "+63 917 123 4567",
            email: "maria.santos@email.com",
            address: "123 Maple Street, Quezon City",
            emergencyContact: "Juan Santos - +63 917 234 5678"
        },
        medicalHistory: [
            {
                date: "2024-11-10",
                type: "Surgery",
                description: "TPLO Surgery - Cranial Cruciate Ligament Repair",
                veterinarian: "Dr. Elena Rodriguez",
                cost: 48900,
                status: "completed",
                notes: "Post-operative recovery going well. Follow-up in 2 weeks."
            },
            {
                date: "2024-10-15",
                type: "Vaccination",
                description: "Annual DHPP + Rabies Vaccination",
                veterinarian: "Dr. Mark Thompson",
                cost: 2500,
                status: "completed",
                notes: "Next vaccination due in 12 months."
            },
            {
                date: "2024-09-20",
                type: "Checkup",
                description: "Routine Health Examination",
                veterinarian: "Dr. Elena Rodriguez",
                cost: 1200,
                status: "completed",
                notes: "Healthy weight, recommend diet adjustment."
            }
        ],
        vaccinations: [
            {
                vaccine: "DHPP",
                lastDate: "2024-10-15",
                nextDue: "2025-10-15",
                status: "current"
            },
            {
                vaccine: "Rabies",
                lastDate: "2024-10-15",
                nextDue: "2025-10-15",
                status: "current"
            },
            {
                vaccine: "Lyme Disease",
                lastDate: "2024-05-10",
                nextDue: "2025-05-10",
                status: "due-soon"
            }
        ],
        allergies: ["Chicken", "Wheat"],
        currentMedications: [
            {
                name: "Carprofen",
                dosage: "50mg twice daily",
                startDate: "2024-11-10",
                duration: "14 days",
                purpose: "Post-surgical pain management"
            }
        ],
        lastVisit: "2024-11-10",
        status: "active",
        registrationDate: "2021-08-15"
    },
    {
        id: "PET-002",
        name: "Cooper",
        species: "dog",
        breed: "Beagle",
        age: 5,
        weight: 15.2,
        gender: "male",
        color: "Tri-color",
        microchipId: "982000234567890",
        owner: {
            name: "Rivera Holdings (Corporate)",
            phone: "+63 2 8234 5678",
            email: "admin@riveraholdings.com",
            address: "456 Business District, Makati City",
            emergencyContact: "Security Desk - +63 2 8234 5600"
        },
        medicalHistory: [
            {
                date: "2024-11-05",
                type: "Corporate Wellness",
                description: "Executive Pet Health Package",
                veterinarian: "Dr. Sarah Kim",
                cost: 62500,
                status: "completed",
                notes: "Comprehensive health screening completed."
            },
            {
                date: "2024-08-22",
                type: "Treatment",
                description: "Ear Infection Treatment",
                veterinarian: "Dr. Mark Thompson",
                cost: 3200,
                status: "completed",
                notes: "Bacterial infection treated successfully."
            }
        ],
        vaccinations: [
            {
                vaccine: "DHPP",
                lastDate: "2024-11-05",
                nextDue: "2025-11-05",
                status: "current"
            },
            {
                vaccine: "Rabies",
                lastDate: "2024-11-05",
                nextDue: "2025-11-05",
                status: "current"
            },
            {
                vaccine: "Bordetella",
                lastDate: "2024-11-05",
                nextDue: "2025-05-05",
                status: "current"
            }
        ],
        allergies: [],
        currentMedications: [],
        lastVisit: "2024-10-30",
        status: "active",
        registrationDate: "2020-03-22"
    },
    {
        id: "PET-003",
        name: "Indie",
        species: "cat",
        breed: "Domestic Shorthair",
        age: 2,
        weight: 4.1,
        gender: "female",
        color: "Calico",
        microchipId: "982000345678901",
        owner: {
            name: "Anna & Lisa Perez",
            phone: "+63 919 345 6789",
            email: "perezsisters@email.com",
            address: "789 Luna Street, Pasig City",
            emergencyContact: "Mom Perez - +63 919 345 6700"
        },
        medicalHistory: [
            {
                date: "2024-11-08",
                type: "Emergency",
                description: "Feline ICU - Severe Dehydration",
                veterinarian: "Dr. Angela Flores",
                cost: 34200,
                status: "completed",
                notes: "Responded well to fluid therapy. Discharged after 3 days."
            },
            {
                date: "2024-07-15",
                type: "Surgery",
                description: "Spay Surgery",
                veterinarian: "Dr. Elena Rodriguez",
                cost: 8500,
                status: "completed",
                notes: "Routine spay procedure. Recovery excellent."
            }
        ],
        vaccinations: [
            {
                vaccine: "FVRCP",
                lastDate: "2024-07-15",
                nextDue: "2025-07-15",
                status: "current"
            },
            {
                vaccine: "Rabies",
                lastDate: "2024-07-15",
                nextDue: "2025-07-15",
                status: "current"
            },
            {
                vaccine: "FeLV",
                lastDate: "2024-01-20",
                nextDue: "2025-01-20",
                status: "overdue"
            }
        ],
        allergies: ["Fish-based foods"],
        currentMedications: [],
        lastVisit: "2024-11-05",
        status: "active",
        registrationDate: "2022-01-10"
    },
    {
        id: "PET-004",
        name: "Delta",
        species: "dog",
        breed: "Aspin (Mixed)",
        age: 1,
        weight: 12.8,
        gender: "female",
        color: "Brown",
        microchipId: "982000456789012",
        owner: {
            name: "K1 Rescue Foundation",
            phone: "+63 2 8456 7890",
            email: "rescue@k1foundation.org",
            address: "321 Rescue Center Rd, Antipolo City",
            emergencyContact: "Emergency Line - +63 2 8456 7800"
        },
        medicalHistory: [
            {
                date: "2024-11-12",
                type: "Treatment",
                description: "Parvo Isolation Treatment Package",
                veterinarian: "Dr. Angela Flores",
                cost: 27600,
                status: "ongoing",
                notes: "Day 5 of treatment. Showing improvement, eating well."
            },
            {
                date: "2024-10-28",
                type: "Vaccination",
                description: "Puppy Vaccination Series - 2nd Shot",
                veterinarian: "Dr. Mark Thompson",
                cost: 1800,
                status: "completed",
                notes: "Next shot due in 3 weeks."
            }
        ],
        vaccinations: [
            {
                vaccine: "DHPP",
                lastDate: "2024-10-28",
                nextDue: "2024-11-18",
                status: "due-soon"
            },
            {
                vaccine: "Rabies",
                lastDate: null,
                nextDue: "2024-12-15",
                status: "pending"
            }
        ],
        allergies: [],
        currentMedications: [
            {
                name: "Metronidazole",
                dosage: "250mg twice daily",
                startDate: "2024-11-12",
                duration: "7 days",
                purpose: "Gastrointestinal support"
            },
            {
                name: "Probiotics",
                dosage: "1 capsule daily",
                startDate: "2024-11-12",
                duration: "14 days",
                purpose: "Digestive health"
            }
        ],
        lastVisit: "2024-11-12",
        status: "active",
        registrationDate: "2019-07-04"
    },
    {
        id: "PET-005",
        name: "Loki",
        species: "cat",
        breed: "Maine Coon",
        age: 4,
        weight: 6.8,
        gender: "male",
        color: "Silver Tabby",
        microchipId: "982000567890123",
        owner: {
            name: "Luna Martinez",
            phone: "+63 918 567 8901",
            email: "luna.martinez@email.com",
            address: "654 Garden Hills, Taguig City",
            emergencyContact: "Carlos Martinez - +63 918 567 8900"
        },
        medicalHistory: [
            {
                date: "2024-11-06",
                type: "Diagnostics",
                description: "Cardio Diagnostics Package",
                veterinarian: "Dr. Sarah Kim",
                cost: 19800,
                status: "completed",
                notes: "Mild heart murmur detected. Follow-up in 6 months."
            },
            {
                date: "2024-09-14",
                type: "Checkup",
                description: "Senior Cat Health Screening",
                veterinarian: "Dr. Elena Rodriguez",
                cost: 4500,
                status: "completed",
                notes: "Overall health good. Recommend dental cleaning."
            }
        ],
        vaccinations: [
            {
                vaccine: "FVRCP",
                lastDate: "2024-09-14",
                nextDue: "2025-09-14",
                status: "current"
            },
            {
                vaccine: "Rabies",
                lastDate: "2024-09-14",
                nextDue: "2025-09-14",
                status: "current"
            }
        ],
        allergies: ["Beef"],
        currentMedications: [
            {
                name: "Enalapril",
                dosage: "2.5mg once daily",
                startDate: "2024-11-06",
                duration: "ongoing",
                purpose: "Heart support"
            }
        ],
        lastVisit: "2024-10-28",
        status: "active",
        registrationDate: "2018-11-12"
    },
    {
        id: "PET-006",
        name: "Buddy",
        species: "dog",
        breed: "Golden Retriever",
        age: 8,
        weight: 32.1,
        gender: "male",
        color: "Golden",
        microchipId: "982000678901234",
        owner: {
            name: "The Johnson Family",
            phone: "+63 917 678 9012",
            email: "johnsonfam@email.com",
            address: "987 Sunshine Village, Las Piñas",
            emergencyContact: "Emergency Contact - +63 917 678 9000"
        },
        medicalHistory: [
            {
                date: "2024-10-20",
                type: "Surgery",
                description: "Dental Cleaning & Extractions",
                veterinarian: "Dr. Mark Thompson",
                cost: 15600,
                status: "completed",
                notes: "3 teeth extracted. Oral health much improved."
            },
            {
                date: "2024-08-15",
                type: "Treatment",
                description: "Hip Dysplasia Management",
                veterinarian: "Dr. Elena Rodriguez",
                cost: 8900,
                status: "ongoing",
                notes: "Started on joint supplements and pain management."
            }
        ],
        vaccinations: [
            {
                vaccine: "DHPP",
                lastDate: "2024-08-15",
                nextDue: "2025-08-15",
                status: "current"
            },
            {
                vaccine: "Rabies",
                lastDate: "2024-08-15",
                nextDue: "2025-08-15",
                status: "current"
            }
        ],
        allergies: ["Corn", "Soy"],
        currentMedications: [
            {
                name: "Glucosamine",
                dosage: "500mg twice daily",
                startDate: "2024-08-15",
                duration: "ongoing",
                purpose: "Joint health"
            },
            {
                name: "Tramadol",
                dosage: "50mg as needed",
                startDate: "2024-08-15",
                duration: "ongoing",
                purpose: "Pain management"
            }
        ],
        lastVisit: "2024-10-20",
        status: "active",
        registrationDate: "2016-05-10"
    }
];

export const veterinarians = [
    {
        id: "VET-001",
        name: "Dr. Elena Rodriguez",
        specialization: "Small Animal Surgery",
        licenseNumber: "PHL-VET-001234",
        experience: "12 years",
        education: "DVM - University of the Philippines"
    },
    {
        id: "VET-002",
        name: "Dr. Mark Thompson",
        specialization: "General Practice & Emergency",
        licenseNumber: "PHL-VET-002345",
        experience: "8 years",
        education: "DVM - Central Luzon State University"
    },
    {
        id: "VET-003",
        name: "Dr. Sarah Kim",
        specialization: "Cardiology & Internal Medicine",
        licenseNumber: "PHL-VET-003456",
        experience: "15 years",
        education: "DVM - Tuskegee University (USA)"
    },
    {
        id: "VET-004",
        name: "Dr. Angela Flores",
        specialization: "Critical Care & ICU",
        licenseNumber: "PHL-VET-004567",
        experience: "10 years",
        education: "DVM - University of Santo Tomas"
    }
];

export const petData = {
    species: petSpecies,
    breeds: petBreeds,
    records: petRecords,
    veterinarians: veterinarians
};