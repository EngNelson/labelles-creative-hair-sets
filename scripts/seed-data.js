const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

// Configuration
const MONGO_URI = process.env.MONGO_URI;
const DATA_FILE = path.join(__dirname, 'data/seed_data.json');

async function seedData() {
    if (!MONGO_URI) {
        console.error('Error: MONGO_URI is not defined in ../apps/api/.env or environment variables.');
        process.exit(1);
    }

    const client = new MongoClient(MONGO_URI);

    try {
        console.log('Connecting to MongoDB...');
        await client.connect();
        
        // Mask password in logs
        const safeUri = MONGO_URI.includes('@') 
            ? MONGO_URI.split('?')[0].replace(/:([^:@]{1,})@/, ':****@')
            : 'MONGO_URI';
        console.log('Connected successfully to:', safeUri);

        const db = client.db(); // Uses the database from the URI
        
        if (!fs.existsSync(DATA_FILE)) {
            console.error(`Error: Seed data file not found at ${DATA_FILE}`);
            process.exit(1);
        }

        console.log('Reading seed data...');
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        const allData = JSON.parse(rawData);

        console.log('Starting import...');

        for (const [collectionName, documents] of Object.entries(allData)) {
            if (documents.length === 0) {
                console.log(`Skipping ${collectionName} (no data).`);
                continue;
            }

            console.log(`Importing ${collectionName} (${documents.length} docs)...`);
            const collection = db.collection(collectionName);

            // Create bulk operations
            const ops = documents.map(doc => {
                // Restore ObjectId if _id is a 24-char hex string
                if (typeof doc._id === 'string' && /^[0-9a-fA-F]{24}$/.test(doc._id)) {
                    try {
                        doc._id = new ObjectId(doc._id);
                    } catch (e) {
                        // Keep as string if conversion fails
                    }
                }
                
                return {
                    replaceOne: {
                        filter: { _id: doc._id },
                        replacement: doc,
                        upsert: true
                    }
                };
            });

            try {
                const result = await collection.bulkWrite(ops);
                console.log(`  - Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`);
            } catch (e) {
                console.error(`  - Error importing ${collectionName}:`, e.message);
            }
        }
        
        console.log('Import completed successfully!');

    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        await client.close();
    }
}

seedData();
