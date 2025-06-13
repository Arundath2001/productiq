import mongoose from "mongoose";
import UploadedProduct from "./models/uploadedProduct.model.js";
import Company from "./models/company.model.js";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
/**
 * Migration script to create Company records from existing UploadedProduct clientCompany data
 * This script:
 * 1. Finds all unique clientCompany values from UploadedProduct collection
 * 2. Creates corresponding Company records with companyCode set to clientCompany
 * 3. Sets createdBy to the uploadedBy user from the first occurrence
 * 4. Keeps the original clientCompany field in UploadedProduct unchanged
 */

const migrateClientCompaniesToCompanies = async () => {
    try {
        console.log("🚀 Starting company migration...");

        // Connect to MongoDB if not already connected
        if (mongoose.connection.readyState !== 1) {
            const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/your-database';
            console.log(`🔌 Connecting to MongoDB: ${mongoUri}`);
            await mongoose.connect(mongoUri);
            console.log("📦 Connected to MongoDB successfully");
        } else {
            console.log("📦 Already connected to MongoDB");
        }

        // Debug: Check all available collections
        console.log("\n🔍 Debugging collection information...");
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("📚 Available collections:");
        collections.forEach(col => console.log(`   - ${col.name}`));

        // Check the actual collection name being used by the model
        console.log(`🔍 Model collection name: ${UploadedProduct.collection.name}`);
        
        // Try to find documents using raw MongoDB queries to debug
        const rawCollection = mongoose.connection.db.collection('uploadedproducts');
        const rawCount = await rawCollection.countDocuments();
        console.log(`📊 Raw count from 'uploadedproducts' collection: ${rawCount}`);

        // Also try other possible collection names
        const possibleNames = ['uploadedProducts', 'uploaded_products', 'UploadedProducts'];
        for (const name of possibleNames) {
            try {
                const testCollection = mongoose.connection.db.collection(name);
                const testCount = await testCollection.countDocuments();
                if (testCount > 0) {
                    console.log(`📊 Found ${testCount} documents in '${name}' collection`);
                }
            } catch (err) {
                // Collection doesn't exist, continue
            }
        }

        const totalDocs = await UploadedProduct.countDocuments();
        console.log(`📊 Total documents via model: ${totalDocs}`);
        
        if (totalDocs === 0) {
            console.log("❌ No documents found via the model");
            
            // Try to query raw collection directly
            const sampleDoc = await rawCollection.findOne();
            if (sampleDoc) {
                console.log("📄 Sample document from raw collection:", JSON.stringify(sampleDoc, null, 2));
            }
            
            return;
        }

        // Get sample documents to understand the data structure
        console.log("\n📄 Sample documents:");
        const sampleDocs = await UploadedProduct.find().limit(3).lean();
        sampleDocs.forEach((doc, index) => {
            console.log(`Sample ${index + 1}:`, {
                _id: doc._id,
                clientCompany: doc.clientCompany,
                uploadedBy: doc.uploadedBy,
                uploadedByType: typeof doc.uploadedBy
            });
        });

        // Get all unique clientCompany values along with their first uploadedBy user
        console.log("\n🔍 Running aggregation to find unique client companies...");
        
        const uniqueClientCompanies = await UploadedProduct.aggregate([
            {
                $match: {
                    clientCompany: { 
                        $exists: true, 
                        $ne: null, 
                        $ne: "",
                        $type: "string" // Ensure it's a string
                    }
                }
            },
            {
                $group: {
                    _id: "$clientCompany",
                    firstUploadedBy: { $first: "$uploadedBy" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id": 1 }
            }
        ]);
        
        console.log("📋 Raw aggregation result:");
        uniqueClientCompanies.forEach(item => {
            console.log(`   - Company: "${item._id}", Count: ${item.count}, UploadedBy: ${item.firstUploadedBy} (${typeof item.firstUploadedBy})`);
        });

        console.log(`📊 Found ${uniqueClientCompanies.length} unique client companies`);

        if (uniqueClientCompanies.length === 0) {
            console.log("✅ No client companies found to migrate");
            return;
        }

        // Prepare company documents for bulk insertion
        const companyDocuments = [];
        const existingCompanies = new Set();
        const skippedCompanies = [];

        // Check which companies already exist (case-insensitive check)
        const clientCompanyValues = uniqueClientCompanies.map(item => item._id.toUpperCase());
        const existingCompanyRecords = await Company.find({
            companyCode: { 
                $in: clientCompanyValues
            }
        }).select('companyCode');

        existingCompanyRecords.forEach(company => {
            existingCompanies.add(company.companyCode.toUpperCase());
        });

        console.log(`📊 Found ${existingCompanies.size} existing companies`);

        // Create documents for companies that don't exist yet
        for (const clientCompany of uniqueClientCompanies) {
            const originalCompanyCode = clientCompany._id;
            const companyCode = originalCompanyCode.toUpperCase();
            
            console.log(`\n🔍 Processing company: "${originalCompanyCode}" -> "${companyCode}"`);
            
            if (existingCompanies.has(companyCode)) {
                console.log(`ℹ️  Company "${companyCode}" already exists, skipping`);
                continue;
            }

            // More flexible validation - allow basic alphanumeric codes
            if (/^[A-Z0-9]{1,20}$/.test(companyCode)) {
                // Handle uploadedBy field - convert string to ObjectId if necessary
                let uploadedByValue = clientCompany.firstUploadedBy;
                
                if (typeof uploadedByValue === 'string' && mongoose.Types.ObjectId.isValid(uploadedByValue)) {
                    uploadedByValue = new mongoose.Types.ObjectId(uploadedByValue);
                }
                
                companyDocuments.push({
                    companyCode: companyCode,
                    createdBy: uploadedByValue
                });
                
                console.log(`✅ Added "${companyCode}" to creation list`);
            } else {
                console.warn(`⚠️  Skipping invalid company code: "${companyCode}" (original: "${originalCompanyCode}")`);
                skippedCompanies.push(originalCompanyCode);
            }
        }

        console.log(`\n📝 Preparing to insert ${companyDocuments.length} new companies`);
        if (skippedCompanies.length > 0) {
            console.log(`⚠️  Skipped ${skippedCompanies.length} invalid companies: ${skippedCompanies.join(', ')}`);
        }

        // Bulk insert new companies
        if (companyDocuments.length > 0) {
            try {
                const result = await Company.insertMany(companyDocuments, { 
                    ordered: false // Continue even if some documents fail
                });
                console.log(`✅ Successfully created ${result.length} company records`);
                
                // Log created companies
                result.forEach(company => {
                    console.log(`   - ${company.companyCode} (Created by: ${company.createdBy})`);
                });
            } catch (error) {
                if (error.name === 'BulkWriteError') {
                    console.log(`✅ Inserted ${error.result.insertedCount} companies`);
                    console.log(`⚠️  ${error.writeErrors?.length || 0} companies failed to insert`);
                    
                    if (error.writeErrors) {
                        error.writeErrors.forEach(writeError => {
                            console.warn(`   - Failed: ${writeError.err?.op?.companyCode || 'Unknown'} - ${writeError.err?.errmsg || writeError.err?.message}`);
                        });
                    }
                } else {
                    console.error("❌ Unexpected error during bulk insert:", error);
                    throw error;
                }
            }
        } else {
            console.log("ℹ️  No new companies to create");
        }

        // Summary report
        console.log("\n📋 Migration Summary:");
        console.log(`   - Total unique client companies found: ${uniqueClientCompanies.length}`);
        console.log(`   - Companies already existing: ${existingCompanies.size}`);
        console.log(`   - New companies prepared for creation: ${companyDocuments.length}`);
        console.log(`   - Invalid companies skipped: ${skippedCompanies.length}`);
        console.log("   - Original clientCompany fields remain unchanged in UploadedProduct collection");

        // Verification: Check if all client companies now have corresponding company records
        console.log("\n🔍 Running verification...");
        const verificationResults = await UploadedProduct.aggregate([
            {
                $match: {
                    clientCompany: { 
                        $exists: true, 
                        $ne: null, 
                        $ne: "",
                        $type: "string"
                    }
                }
            },
            {
                $group: {
                    _id: { $toUpper: "$clientCompany" }, // Convert to uppercase for matching
                    originalValue: { $first: "$clientCompany" },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "companies", // Make sure this matches your Company collection name
                    localField: "_id",
                    foreignField: "companyCode",
                    as: "companyRecord"
                }
            },
            {
                $match: {
                    companyRecord: { $size: 0 } // Companies without matching records
                }
            }
        ]);

        if (verificationResults.length > 0) {
            console.log("\n⚠️  Warning: Some client companies don't have matching company records:");
            verificationResults.forEach(item => {
                console.log(`   - "${item.originalValue}" -> "${item._id}" (${item.count} products)`);
            });
        } else {
            console.log("\n✅ Verification passed: All client companies have corresponding company records");
        }

        console.log("\n🎉 Migration completed successfully!");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        console.error("Stack trace:", error.stack);
        throw error;
    }
};

// Export the migration function
export default migrateClientCompaniesToCompanies;

// If running this file directly (works with both CommonJS and ES modules)
const isMainModule = process.argv[1] && (
    import.meta.url === `file://${process.argv[1]}` || 
    process.argv[1].endsWith('migration.js')
);

if (isMainModule) {
    console.log("🔧 Starting migration script...");
    migrateClientCompaniesToCompanies()
        .then(() => {
            console.log("✅ Migration script completed successfully");
            mongoose.connection.close();
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Migration script failed:", error);
            mongoose.connection.close();
            process.exit(1);
        });
}