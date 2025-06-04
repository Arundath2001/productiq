import mongoose from "mongoose";
import Voyage from "./models/voyage.model.js";
import UploadedProduct from "./models/uploadedProduct.model.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/productiq', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Function to parse product code and extract quantity
const parseProductCode = (productCode) => {
    console.log(`  📝 Parsing product code: ${productCode}`);
    
    const parts = productCode.split('|');
    
    if (parts.length >= 2) {
        const baseProductCode = parts[0];
        const quantity = parseInt(parts[1], 10) || 1;
        console.log(`    ➡️  Base: ${baseProductCode}, Quantity: ${quantity}`);
        return { baseProductCode, quantity };
    }
    
    console.log(`    ⚠️  Using fallback parsing for: ${productCode}`);
    return { baseProductCode: productCode, quantity: 1 };
};

// Migration function
const migrateVoyageData = async () => {
    try {
        console.log('🚀 Starting migration...\n');
        
        // Check if migration already happened
        const existingProductsCount = await UploadedProduct.countDocuments();
        if (existingProductsCount > 0) {
            console.log(`⚠️  Found ${existingProductsCount} existing UploadedProduct documents.`);
            console.log('This might indicate migration was already run.');
            console.log('Do you want to continue? (This will duplicate data)');
            // In production, you might want to prompt for confirmation here
        }
        
        // Find all voyages with embedded uploadedData
        const voyagesWithEmbeddedData = await mongoose.connection.db
            .collection('voyages')
            .find({ uploadedData: { $exists: true, $ne: [] } })
            .toArray();
        
        console.log(`📊 Found ${voyagesWithEmbeddedData.length} voyages with embedded data to migrate\n`);
        
        if (voyagesWithEmbeddedData.length === 0) {
            console.log('✅ No voyages with embedded data found. Migration may have already been completed.');
            return;
        }
        
        let totalProductsMigrated = 0;
        
        for (const voyageDoc of voyagesWithEmbeddedData) {
            console.log(`🛳️  Migrating voyage: ${voyageDoc.voyageName} (${voyageDoc.voyageNumber})`);
            console.log(`   Items to migrate: ${voyageDoc.uploadedData.length}`);
            
            // Create UploadedProduct documents
            const uploadedProducts = [];
            
            for (const item of voyageDoc.uploadedData) {
                const { baseProductCode, quantity } = parseProductCode(item.productCode);
                
                const uploadedProduct = {
                    productCode: baseProductCode,
                    trackingNumber: item.trackingNumber,
                    clientCompany: item.clientCompany,
                    voyageId: voyageDoc._id,
                    uploadedBy: item.uploadedBy,
                    image: item.image,
                    status: item.status || 'pending',
                    uploadedDate: new Date(item.uploadedDate) || new Date(),
                    weight: item.weight,
                    quantity: quantity,
                    exportedDate: item.exportedDate ? new Date(item.exportedDate) : null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                uploadedProducts.push(uploadedProduct);
            }
            
            // Insert all uploaded products for this voyage
            if (uploadedProducts.length > 0) {
                try {
                    await mongoose.connection.db.collection('uploadedproducts').insertMany(uploadedProducts);
                    console.log(`   ✅ Created ${uploadedProducts.length} UploadedProduct documents`);
                    totalProductsMigrated += uploadedProducts.length;
                } catch (error) {
                    console.error(`   ❌ Error creating products for voyage ${voyageDoc.voyageName}:`, error.message);
                    continue;
                }
            }
            
            // Remove uploadedData from voyage document
            try {
                await mongoose.connection.db.collection('voyages').updateOne(
                    { _id: voyageDoc._id },
                    { $unset: { uploadedData: "" } }
                );
                console.log(`   ✅ Removed embedded data from voyage`);
            } catch (error) {
                console.error(`   ❌ Error updating voyage ${voyageDoc.voyageName}:`, error.message);
            }
            
            console.log(''); // Empty line for readability
        }
        
        console.log(`🎉 Migration completed successfully!`);
        console.log(`📈 Total products migrated: ${totalProductsMigrated}\n`);
        
        // Auto-verify migration
        await verifyMigration();
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};

// Function to verify migration results
const verifyMigration = async () => {
    try {
        console.log('🔍 --- Verification Report ---\n');
        
        // Count voyages
        const voyageCount = await Voyage.countDocuments();
        console.log(`📊 Total voyages: ${voyageCount}`);
        
        // Count uploaded products
        const productCount = await UploadedProduct.countDocuments();
        console.log(`📦 Total uploaded products: ${productCount}`);
        
        // Check for voyages with remaining embedded data
        const voyagesWithEmbeddedData = await mongoose.connection.db
            .collection('voyages')
            .countDocuments({ uploadedData: { $exists: true, $ne: [] } });
        
        console.log(`⚠️  Voyages still with embedded data: ${voyagesWithEmbeddedData}`);
        
        // Sample data verification
        const sampleVoyage = await Voyage.findOne().populate('uploadedProducts');
        if (sampleVoyage) {
            console.log(`\n🛳️  Sample voyage: ${sampleVoyage.voyageName}`);
            console.log(`   📦 Linked products count: ${sampleVoyage.uploadedProducts?.length || 0}`);
            
            if (sampleVoyage.uploadedProducts && sampleVoyage.uploadedProducts.length > 0) {
                const sampleProduct = sampleVoyage.uploadedProducts[0];
                console.log(`   📝 Sample product: ${sampleProduct.productCode} (Qty: ${sampleProduct.quantity})`);
            }
        }
        
        // Show product code breakdown
        const productCodeStats = await UploadedProduct.aggregate([
            {
                $group: {
                    _id: "$productCode",
                    count: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                    avgWeight: { $avg: "$weight" }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        console.log('\n📈 Product code statistics:');
        productCodeStats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} items, total qty: ${stat.totalQuantity}, avg weight: ${stat.avgWeight.toFixed(2)}kg`);
        });
        
        // Check for potential issues
        const duplicateTrackingNumbers = await UploadedProduct.aggregate([
            { $group: { _id: "$trackingNumber", count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);
        
        if (duplicateTrackingNumbers.length > 0) {
            console.log(`\n⚠️  WARNING: Found ${duplicateTrackingNumbers.length} duplicate tracking numbers!`);
            duplicateTrackingNumbers.slice(0, 5).forEach(dup => {
                console.log(`   Duplicate: ${dup._id} (${dup.count} times)`);
            });
        } else {
            console.log('\n✅ No duplicate tracking numbers found');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
};

// Enhanced rollback function
const rollbackMigration = async () => {
    try {
        console.log('🔄 Starting rollback...\n');
        
        const productCount = await UploadedProduct.countDocuments();
        console.log(`📦 Found ${productCount} products to rollback`);
        
        if (productCount === 0) {
            console.log('✅ No products found to rollback');
            return;
        }
        
        // Get all voyages and their uploaded products
        const voyages = await Voyage.find().lean();
        console.log(`🛳️  Processing ${voyages.length} voyages`);
        
        for (const voyage of voyages) {
            console.log(`🔄 Rolling back voyage: ${voyage.voyageName}`);
            
            // Get uploaded products for this voyage
            const uploadedProducts = await UploadedProduct.find({ voyageId: voyage._id }).lean();
            console.log(`   Found ${uploadedProducts.length} products to embed`);
            
            if (uploadedProducts.length === 0) continue;
            
            // Transform back to embedded format
            const uploadedData = uploadedProducts.map(product => ({
                productCode: `${product.productCode}|${product.quantity.toString().padStart(2, '0')}|1`,
                trackingNumber: product.trackingNumber,
                clientCompany: product.clientCompany,
                uploadedBy: product.uploadedBy,
                image: product.image,
                status: product.status,
                uploadedDate: product.uploadedDate,
                weight: product.weight,
                exportedDate: product.exportedDate
            }));
            
            // Update voyage with embedded data
            await mongoose.connection.db.collection('voyages').updateOne(
                { _id: voyage._id },
                { $set: { uploadedData: uploadedData } }
            );
            
            console.log(`   ✅ Embedded ${uploadedData.length} products back into voyage`);
        }
        
        // Delete all uploaded products
        const deleteResult = await UploadedProduct.deleteMany({});
        console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} UploadedProduct documents`);
        
        console.log('\n✅ Rollback completed successfully!');
        
    } catch (error) {
        console.error('❌ Rollback failed:', error);
        throw error;
    }
};

// Main execution
const main = async () => {
    await connectDB();
    
    const action = process.argv[2];
    
    try {
        switch (action) {
            case 'migrate':
                await migrateVoyageData();
                break;
            case 'rollback':
                await rollbackMigration();
                break;
            case 'verify':
                await verifyMigration();
                break;
            case 'status':
                // Quick status check
                const voyageCount = await Voyage.countDocuments();
                const productCount = await UploadedProduct.countDocuments();
                const embeddedCount = await mongoose.connection.db
                    .collection('voyages')
                    .countDocuments({ uploadedData: { $exists: true, $ne: [] } });
                
                console.log('\n📊 Current Status:');
                console.log(`   Voyages: ${voyageCount}`);
                console.log(`   UploadedProducts: ${productCount}`);
                console.log(`   Voyages with embedded data: ${embeddedCount}`);
                break;
            default:
                console.log('📖 Usage: node migration.js [migrate|rollback|verify|status]');
                console.log('  migrate  - Migrate data from embedded to separate collections');
                console.log('  rollback - Revert migration (restore embedded structure)');
                console.log('  verify   - Verify migration results');
                console.log('  status   - Quick status check');
        }
    } catch (error) {
        console.error('❌ Operation failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
};


    main();


export { migrateVoyageData, rollbackMigration, verifyMigration };