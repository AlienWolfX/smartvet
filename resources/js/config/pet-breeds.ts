/**
 * Common pet breeds organized by species.
 * Used for the breed selector in pet registration.
 */
export const petBreeds: Record<string, string[]> = {
    Dog: [
        'Aspin (Asong Pinoy)',
        'Beagle',
        'Bichon Frise',
        'Border Collie',
        'Boxer',
        'Bulldog (English)',
        'Bulldog (French)',
        'Cavalier King Charles Spaniel',
        'Chihuahua',
        'Chow Chow',
        'Cocker Spaniel',
        'Corgi (Pembroke Welsh)',
        'Dachshund',
        'Dalmatian',
        'Doberman Pinscher',
        'German Shepherd',
        'Golden Retriever',
        'Great Dane',
        'Husky (Siberian)',
        'Jack Russell Terrier',
        'Labrador Retriever',
        'Lhasa Apso',
        'Maltese',
        'Miniature Pinscher',
        'Pomeranian',
        'Poodle (Standard)',
        'Poodle (Toy/Miniature)',
        'Pug',
        'Rottweiler',
        'Shiba Inu',
        'Shih Tzu',
        'Yorkshire Terrier',
        'Mixed Breed',
    ],
    Cat: [
        'Puspin (Pusang Pinoy)',
        'Abyssinian',
        'Bengal',
        'British Shorthair',
        'Burmese',
        'Himalayan',
        'Maine Coon',
        'Munchkin',
        'Norwegian Forest Cat',
        'Persian',
        'Ragdoll',
        'Russian Blue',
        'Scottish Fold',
        'Siamese',
        'Singapura',
        'Sphynx',
        'Turkish Angora',
        'Mixed Breed',
    ],
};

/**
 * Get breed options for a given species.
 * Returns an empty array if the species is not found.
 */
export function getBreedsForSpecies(species: string): string[] {
    return petBreeds[species] ?? [];
}
