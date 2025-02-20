import SavedCode from "../models/savedCode.model.js";

export const saveProductCode = async (req, res) => {
    try {
        const {productCode} = req.body;

        if(req.user.role !== 'employee'){
            return res.status(400).json({message : "Only employee can add product code"});
        }

        const savedCode = await SavedCode.findOne({productCode});

        if(savedCode) return res.status(400).json({message : "Product code already exisits"});

        const newSavedCode = new SavedCode({
            productCode,
            savedBy: req.user.id
        });

        await newSavedCode.save();

        res.status(200).json(newSavedCode);

    } catch (error) {
        console.log("Error in saveProductCode controller", error.message);
        res.status(500).json({message: "Inernal server error"});
    }
}

export const getSavedProductCode = async (req, res) => {
    try {
        const savedCodes = await SavedCode.find({});

        if(!savedCodes.length){
            return res.status(400).json({message: "No saved product code found"})
        }

        res.status(200).json(savedCodes);

    } catch (error) {
        console.log("Error in getSavedProductCode controller", error.message);
        res.status(500).json({message: "Inernal server error"});
    }
}