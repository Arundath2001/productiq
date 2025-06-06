import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to your database
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

// Old Voyage Schema (for reading existing data)
const oldVoyageSchema = new mongoose.Schema({
    voyageName: String,
    voyageNumber: String,
    year: Number,
    createdBy: mongoose.Schema.Types.ObjectId,
    status: String,
    lastPrintedCounts: Map,
    uploadedData: [{
        productCode: String,
        trackingNumber: String,
        clientCompany: String,
        uploadedBy: mongoose.Schema.Types.ObjectId,
        image: String,
        status: String,
        uploadedDate: Date,
        weight: Number,
        exportedDate: Date
    }]
}, { timestamps: true });

// New schemas
const newVoyageSchema = new mongoose.Schema({
    voyageName: String,
    voyageNumber: String,
    year: Number,
    createdBy: mongoose.Schema.Types.ObjectId,
    status: String,
    lastPrintedCounts: Map
}, { timestamps: true });

// Add virtual populate
newVoyageSchema.virtual('uploadedProducts', {
    ref: 'UploadedProduct',
    localField: '_id',
    foreignField: 'voyageId'
});

newVoyageSchema.set('toJSON', { virtuals: true });
newVoyageSchema.set('toObject', { virtuals: true });

const uploadedProductSchema = new mongoose.Schema({
    productCode: String,
    sequenceNumber: Number,
    voyageNumber: Number,
    trackingNumber: String,
    clientCompany: String,
    voyageId: mongoose.Schema.Types.ObjectId,
    uploadedBy: mongoose.Schema.Types.ObjectId,
    image: String,
    status: String,
    uploadedDate: Date,
    weight: Number,
    exportedDate: Date
}, { timestamps: true });

// Create models
const OldVoyage = mongoose.model('OldVoyage', oldVoyageSchema, 'voyages');
const NewVoyage = mongoose.model('NewVoyage', newVoyageSchema, 'voyages_migrated');
const UploadedProduct = mongoose.model('UploadedProduct', uploadedProductSchema, 'uploadedproducts');

// Function to parse composite product code
const parseProductCode = (compositeCode) => {
    const parts = compositeCode.split('|');
    if (parts.length !== 3) {
        throw new Error(`Invalid product code format: ${compositeCode}. Expected format: CODE|SEQUENCE|VOYAGE`);
    }
    
    const sequenceNumber = parseInt(parts[1], 10);
    const voyageNumber = parseInt(parts[2], 10);
    
    if (isNaN(sequenceNumber) || isNaN(voyageNumber)) {
        throw new Error(`Invalid numeric values in product code: ${compositeCode}`);
    }
    
    return {
        productCode: parts[0].trim(),
        sequenceNumber: sequenceNumber,
        voyageNumber: voyageNumber
    };
};

// Cleanup function to remove existing migrated data
const cleanupExistingMigration = async () => {
    try {
        console.log('Cleaning up any existing migration data...');
        await NewVoyage.deleteMany({});
        await UploadedProduct.deleteMany({});
        console.log('✓ Cleanup completed');
    } catch (error) {
        console.error('Cleanup failed:', error);
        throw error;
    }
};

// Migration function with proper ID handling
const migrateData = async () => {
    try {
        console.log('Starting data migration...');
        
        // Clean up any existing migration data first
        await cleanupExistingMigration();
        
        // Get all old voyage documents
        const oldVoyages = await OldVoyage.find({});
        console.log(`Found ${oldVoyages.length} voyages to migrate`);
        
        let migratedVoyages = 0;
        let migratedProducts = 0;
        let errors = [];
        
        // Create a map to track old voyage ID to new voyage ID mapping
        const voyageIdMapping = new Map();
        
        for (const oldVoyage of oldVoyages) {
            try {
                console.log(`\nMigrating voyage: ${oldVoyage.voyageName} (${oldVoyage.voyageNumber})`);
                
                // **IMPORTANT**: Use the same _id from old voyage to maintain consistency
                const newVoyageData = {
                    _id: oldVoyage._id, // Keep the same ID
                    voyageName: oldVoyage.voyageName,
                    voyageNumber: oldVoyage.voyageNumber,
                    year: oldVoyage.year,
                    createdBy: oldVoyage.createdBy, // Keep original user ID
                    status: oldVoyage.status,
                    lastPrintedCounts: oldVoyage.lastPrintedCounts,
                    createdAt: oldVoyage.createdAt,
                    updatedAt: oldVoyage.updatedAt
                };
                
                const newVoyage = new NewVoyage(newVoyageData);
                await newVoyage.save();
                migratedVoyages++;
                
                // Map old voyage ID to new voyage ID (they're the same now)
                voyageIdMapping.set(oldVoyage._id.toString(), newVoyage._id);
                
                console.log(`  ✓ Created voyage with ID: ${newVoyage._id}`);
                
                // Migrate uploaded products
                if (oldVoyage.uploadedData && oldVoyage.uploadedData.length > 0) {
                    console.log(`  Migrating ${oldVoyage.uploadedData.length} products...`);
                    
                    for (const uploadedItem of oldVoyage.uploadedData) {
                        try {
                            // Validate required fields
                            if (!uploadedItem.productCode) {
                                throw new Error('Product code is missing');
                            }
                            if (!uploadedItem.trackingNumber) {
                                throw new Error('Tracking number is missing');
                            }
                            if (!uploadedItem.uploadedBy) {
                                throw new Error('UploadedBy user ID is missing');
                            }
                            
                            // Parse the composite product code
                            const parsedCode = parseProductCode(uploadedItem.productCode);
                            
                            // Create new uploaded product document with correct IDs
                            const uploadedProduct = new UploadedProduct({
                                productCode: parsedCode.productCode,
                                sequenceNumber: parsedCode.sequenceNumber,
                                voyageNumber: parsedCode.voyageNumber,
                                trackingNumber: uploadedItem.trackingNumber,
                                clientCompany: uploadedItem.clientCompany,
                                voyageId: newVoyage._id, // Use the new voyage's ID
                                uploadedBy: uploadedItem.uploadedBy, // Keep original user ID
                                image: uploadedItem.image,
                                status: uploadedItem.status || 'pending',
                                uploadedDate: uploadedItem.uploadedDate || new Date(),
                                weight: uploadedItem.weight || 0,
                                exportedDate: uploadedItem.exportedDate,
                                createdAt: uploadedItem.uploadedDate || new Date(),
                                updatedAt: uploadedItem.uploadedDate || new Date()
                            });
                            
                            await uploadedProduct.save();
                            migratedProducts++;
                            
                            if (migratedProducts % 50 === 0) {
                                console.log(`    Migrated ${migratedProducts} products so far...`);
                            }
                            
                        } catch (productError) {
                            const errorMsg = `Error migrating product ${uploadedItem.productCode} in voyage ${oldVoyage.voyageNumber}: ${productError.message}`;
                            console.error(`    ❌ ${errorMsg}`);
                            errors.push({
                                type: 'product',
                                voyageId: oldVoyage._id,
                                voyageName: oldVoyage.voyageName,
                                productCode: uploadedItem.productCode,
                                error: productError.message
                            });
                        }
                    }
                }
                
                console.log(`  ✓ Voyage migration completed (${oldVoyage.uploadedData?.length || 0} products)`);
                
            } catch (voyageError) {
                const errorMsg = `Error migrating voyage ${oldVoyage.voyageNumber}: ${voyageError.message}`;
                console.error(`  ❌ ${errorMsg}`);
                errors.push({
                    type: 'voyage',
                    voyageId: oldVoyage._id,
                    voyageName: oldVoyage.voyageName,
                    error: voyageError.message
                });
            }
        }
        
        console.log('\n=== Migration Summary ===');
        console.log(`Voyages migrated: ${migratedVoyages}/${oldVoyages.length}`);
        console.log(`Products migrated: ${migratedProducts}`);
        console.log(`Errors encountered: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n=== Detailed Errors ===');
            errors.forEach((error, index) => {
                console.log(`${index + 1}. [${error.type.toUpperCase()}] ${error.voyageName} (${error.voyageId})`);
                console.log(`   Product: ${error.productCode || 'N/A'}`);
                console.log(`   Error: ${error.error}`);
                console.log('');
            });
        }
        
        // Clean up uploadedData from migrated voyages
        if (migratedVoyages > 0) {
            console.log('\n=== Cleaning up embedded uploadedData ===');
            try {
                const cleanupResult = await NewVoyage.updateMany(
                    {}, 
                    { $unset: { uploadedData: "" } }
                );
                console.log(`✓ Removed uploadedData from ${cleanupResult.modifiedCount} voyage documents`);
            } catch (cleanupError) {
                console.error('❌ Failed to cleanup uploadedData:', cleanupError.message);
                errors.push({
                    type: 'cleanup',
                    error: 'Failed to remove uploadedData from voyage documents: ' + cleanupError.message
                });
            }
        }
        
        console.log('Migration completed!');
        return { migratedVoyages, migratedProducts, errors };
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
};

// Enhanced validation function
const validateMigration = async () => {
    try {
        console.log('\n=== Validation ===');
        
        const oldVoyageCount = await OldVoyage.countDocuments();
        const newVoyageCount = await NewVoyage.countDocuments();
        const uploadedProductCount = await UploadedProduct.countDocuments();
        
        console.log(`Original voyages: ${oldVoyageCount}`);
        console.log(`New voyages: ${newVoyageCount}`);
        console.log(`Uploaded products: ${uploadedProductCount}`);
        
        // Count total uploaded items in old format
        const oldVoyagesWithData = await OldVoyage.find({ uploadedData: { $exists: true, $ne: [] } });
        let totalOldProducts = 0;
        oldVoyagesWithData.forEach(voyage => {
            totalOldProducts += voyage.uploadedData.length;
        });
        
        console.log(`Original uploaded items: ${totalOldProducts}`);
        console.log(`Migration success rate: ${totalOldProducts > 0 ? ((uploadedProductCount / totalOldProducts) * 100).toFixed(2) : 0}%`);
        
        // Validate ID relationships
        console.log('\n=== ID Validation ===');
        
        // Check voyage ID consistency
        const orphanedProducts = await UploadedProduct.countDocuments({
            voyageId: { $nin: await NewVoyage.distinct('_id') }
        });
        console.log(`Orphaned products (no matching voyage): ${orphanedProducts}`);
        
        // Check user ID consistency
        const productsWithoutUploader = await UploadedProduct.countDocuments({
            uploadedBy: { $in: [null, undefined] }
        });
        console.log(`Products without uploader ID: ${productsWithoutUploader}`);
        
        // Sample validation - check a few records with proper populate
        console.log('\n=== Sample Data Check ===');
        const sampleNewVoyage = await NewVoyage.findOne();
        if (sampleNewVoyage) {
            const relatedProducts = await UploadedProduct.countDocuments({ voyageId: sampleNewVoyage._id });
            console.log(`Sample voyage "${sampleNewVoyage.voyageName}" has ${relatedProducts} products`);
            
            // Show a sample product
            const sampleProduct = await UploadedProduct.findOne({ voyageId: sampleNewVoyage._id });
            if (sampleProduct) {
                console.log(`Sample product: ${sampleProduct.productCode} (seq: ${sampleProduct.sequenceNumber}, voyage: ${sampleProduct.voyageNumber})`);
                console.log(`Voyage ID match: ${sampleProduct.voyageId.toString() === sampleNewVoyage._id.toString()}`);
            }
        }
        
        // Check for parsing issues
        const parsingIssues = await UploadedProduct.countDocuments({
            $or: [
                { productCode: { $regex: /\|/ } },
                { sequenceNumber: { $exists: false } },
                { voyageNumber: { $exists: false } },
                { sequenceNumber: null },
                { voyageNumber: null }
            ]
        });
        console.log(`Products with parsing issues: ${parsingIssues}`);
        
        if (orphanedProducts === 0 && productsWithoutUploader === 0 && parsingIssues === 0) {
            console.log('\n✅ Migration validation PASSED - All data looks good!');
            return true;
        } else {
            console.log('\n❌ Migration validation FAILED - Issues found above');
            return false;
        }
        
    } catch (error) {
        console.error('Validation failed:', error);
        return false;
    }
};

// Rollback function in case something goes wrong
const rollbackMigration = async () => {
    try {
        console.log('\n=== Rollback ===');
        console.log('Rolling back migration...');
        
        await NewVoyage.deleteMany({});
        await UploadedProduct.deleteMany({});
        
        console.log('✅ Rollback completed - migrated data removed');
        
    } catch (error) {
        console.error('Rollback failed:', error);
    }
};

// Final step - replace collections (run only after successful validation)
const finalizemigration = async () => {
    try {
        console.log('\n=== Finalization ===');
        console.log('⚠️  This will replace your original voyages collection!');
        console.log('Make sure you have a backup and validation passed!');
        
        // Rename original collection as backup
        await mongoose.connection.db.collection('voyages').rename('voyages_backup_' + Date.now());
        console.log('✅ Original collection backed up');
        
        // Rename migrated collection to replace original
        await mongoose.connection.db.collection('voyages_migrated').rename('voyages');
        console.log('✅ Migration completed and collections renamed');
        
        console.log('\nYour database is now updated with the new structure!');
        
    } catch (error) {
        console.error('Finalization failed:', error);
        console.log('Your original data is still safe in the voyages collection');
    }
};

// Main execution
const runMigration = async () => {
    await connectDB();
    
    try {
        const results = await migrateData();
        const validationPassed = await validateMigration();
        
        if (validationPassed && results.errors.length === 0) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('You can now run finalizeStep() to replace your original collection');
            console.log('Or run rollbackMigration() if you want to undo the migration');
        } else {
            console.log('\n⚠️  Migration completed with issues. Please review the errors above.');
            console.log('Consider running rollbackMigration() and fixing the issues before retrying.');
        }
        
    } catch (error) {
        console.error('Migration process failed:', error);
        console.log('Consider running rollbackMigration() to clean up partial migration');
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Export individual functions for manual execution
const finalizeStep = async () => {
    await connectDB();
    try {
        await finalizeStep();
    } finally {
        await mongoose.connection.close();
    }
};

// Run the migration
runMigration().catch(console.error);

// Export functions for individual use if needed
export { migrateData, validateMigration, rollbackMigration, finalizeStep };